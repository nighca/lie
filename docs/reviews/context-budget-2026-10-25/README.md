# CR-01: context wire-budget investigation

2026-10-25. Status: proposed remediation, no production changes. Fixed base `03fcb06b40ad9dc85ce92af5c1dd6723afc10d4a`; `git diff 58b416d 03fcb06 -- packages apps/web/src apps/gateway/src` is empty. Earlier review commits remain frozen on `codex/architecture-code-review`. Owner: architecture_code_review; integration/implementation decisions: root. Invite/auth, new animation revisions, browser QA and result design are excluded.

## Recommendation

First add a generic exact serialized-frame guard and an actionable application error, preserving all game state. Separately propose preflight diagnostics for impossible initial contexts. Consider removing duplicate context fields only after the provider adapter's tool semantics are reviewed; it materially helps the example but cannot solve arbitrary content or history growth. Do not truncate, summarize, increase the gateway limit, or impose a new authoring limit as part of an unapproved defensive patch.

A serializer guard is a bounded defensive implementation choice: today's oversized frame already cannot pass the gateway. Sending no oversized reply and reporting its specific cause changes failure handling, not accepted gameplay/content. It must retain the existing stop/cleanup and in-memory transcript behavior. Root can schedule that routine safeguard. Making authoring/play blocking, selecting a history retention policy, or redefining the supported maximum story size needs a consequential product decision; this report is not that approval.

## Actual encoding and reproduced boundaries

The runtime builds `CharacterContext`, including background/profile/history/systemPrompt. Background and profile are repeated inside systemPrompt. LiveVoice JSON.stringify returns this object as a **string**; channel puts the string in `{type:'mcp',payload:{jsonrpc:'2.0',id,result:{content:[{type:'text',text}],isError:false}}}` and JSON.stringify escapes that envelope again. The gateway measures UTF-8 bytes of the resulting outer string. Neither raw profile characters, raw JSON bytes nor compressed share URL length is the frame size.

[Offline probe](probes.cjs) executes the actual validateGame, draftGame, share encode/decode, buildCharacterContext, createVoiceChannel and relaySockets, using inert sockets and no server. [Recorded results](probe-results.jsonl), Node24.22.1:

| Case | Result |
| --- | --- |
| Ordinary three-person Editor-valid fixture | 395 content bytes, 364-character share URL, 929-byte initial context reply. |
| Three-person fixture with one 12,000-character Chinese profile | Accepted by draftGame with current preset ID, encode/decode unchanged; 36,383 content bytes, 476-character share URL, 72,905-byte reply. |
| Same large context without duplicate background/profile keys | 36,856-byte reply. The instruction prompt and all facts/history remain present in the proposed projection; this is an investigation-only representation. |
| Ordinary initial fixture plus 40 retained entries of 600 Chinese characters | 76,208-byte reply. No truncation; illustrates history growth separately from static story size. |
| Actual channel output exactly 65,536 bytes | Relay forwards once; test then closes normally with1000 to release its timer. |
| Actual channel output exactly 65,537 bytes | Relay forwards zero, closes1009. |

The boundary probes calculate the complete envelope, assert byte equality with the actual channel's output, then pass that output to the actual relay. A quote, backslash and newline each expand through JSON escaping; a Chinese character occupies three UTF-8 bytes. A longer RPC ID adds bytes too (the sample 300-character string ID adds301 bytes versus numeric1). Do not validate with JS `.length` or assume a constant envelope overhead for every call. These examples are fake protocol verification, not proof of provider acceptance or natural conversation length.

## Options and concrete responsibility

### 1. Initial diagnostics plus universal reply guard — recommended first

**One transport contract:** place the existing64KiB frame constant and exact MCP reply serializer/byte measurer in a host-independent `packages/voice/src/protocol.ts`, exported through a narrow `@lie/voice/protocol` subpath. This is within existing module E's browser/protocol/Worker responsibility, rather than a new package or a game-core constant. The helper must not import DOM, Vue, story types, channel state or gateway. Gateway imports this pure subpath and uses the same frame constant. Keep gateway's independent enforcement; a client is untrusted. Package export/import boundaries and tests should ensure no browser entry side effects become a gateway dependency.

**Exact runtime guard:** channel serializes the whole actual reply with the actual ID, measures once and only sends if within budget. The same guard should cover generated discovery/errors/other text replies, not assume only the successful tool body can be large. Expose a structured protocol error such as `payload-too-large` (wire bytes and limit, no story or raw payload in logs). Do not substitute a partial successful tool answer. If a bounded small MCP error can be sent safely, return it; measure that error envelope too. An arbitrarily large/escaped incoming ID may make even an error oversized: do not echo it unchecked or recursively try to report errors over the socket. End through the existing controlled failure/cleanup path in that case. Normal audio limits and fixed upstream remain unchanged.

**Application handling:** liveVoice/controller map the structured error to a specific notice: this character's context exceeds the transport size; displayed conversation is retained, current voice is stopped. Do not automatically retry or reopen paid sessions. Reuse current close/abort cleanup, epoch checks and getView flow. Before any microphone/status/WS startup, the application can measure the current full character context and detect a definitely oversized initial projection, avoiding a predictably doomed connection. This code belongs in an application adapter helper (e.g. `apps/web/src/application/contextBudget.ts`) that composes core context creation and module E measurement. Core neither knows nor enforces gateway bytes. Voice remains generic: it sees string tool output and protocol frames, never character IDs or ending.

**Static Editor/share diagnostics:** the Editor and shared-play application may call the same application helper to report which character's initial context is too large and suggest shortening its profile/public background. Do not add this rule into game-core validateGame or share decompression schema. Before an RPC request arrives its ID is unknown: a synthetic small ID gives an estimate/lower-bound diagnostic, not an exact guarantee. If an initial context already exceeds the frame with a minimal valid ID, it is definitely unserviceable under that representation. Near-limit content can still fail with larger actual IDs; the universal exact runtime guard remains mandatory. Do not invent an ID cap or reserved-byte allowance without an explicit provider protocol contract. Turning a diagnostic into a hard authoring or play gate is a separate product decision.

**History growth:** guard every tool response, including context requests during an active conversation; checking only at voice start is insufficient. The initial case may fit and later history may not. On this known-untransmittable response, stop cleanly and preserve all displayed/in-memory entries using current mechanics. A specific explanation is preferable to existing generic disconnect. It does not make continued voice possible; an open product decision remains how a player should proceed when the existing character context can no longer fit. Do not promise that reconnect/retry will repair it. Selecting another character has its own isolated history and may fit, but is not a general solution or automatic action.

### 2. Deduplicate the context tool projection — useful follow-up, not complete

The application voice adapter can project `{characterId,characterName,systemPrompt,history}` rather than repeating background/profile outside systemPrompt. Keep the authoritative core context API unchanged for other consumers. Facts and instructions remain verbatim in systemPrompt; complete history remains present. In the large three-person example this reduces72,905 to36,856 bytes. No content truncation or new game rule is needed.

However, removal of keys changes what the model sees as a tool result, and the current tool description/protocol prompt may rely on their organization. Review the configured provider instructions/fixtures through their owner without reading secrets; do not assume a JSON field is semantically unused just because our code never reads it. Automated assertions can prove all approved facts and history are retained, not equivalent model behavior. Any live/provider evaluation requires its own authorized bounded plan. Larger profiles/background or accumulated history can still overflow even after deduplication, so retain option1. No compelling reason to add a new core DTO, framework or generic story serializer.

### 3. Retention/truncation/summary — defer to product decision

Dropping oldest entries, bounding per-character history, summarizing conversation, limiting response length or discarding repeated facts changes the role's available knowledge or player expectations. This may address continuing long conversations but requires explicit semantics and approval; summaries also bring model calls/cost/fidelity concerns. Keep full UI transcript versus provider context policies distinct if ever approved. Current investigation does none of these, and128KiB content acceptance is not silently reduced.

## Implementation order and acceptance vectors

1. Root reviews this proposal. If scheduling routine defense, implement the pure shared protocol helper and channel guard, gateway reuse, typed error mapping and focused tests. No new package/dependency, service or provider required. Keep current64KiB enforcement and existing max connection duration.
2. Fake-integrated test: valid normal context works; actual65,536 passes;65,537 is never sent; a long escaped ID/error envelope cannot overflow or recurse; failed tools/discovery use the same safe serializer; close/abort occurs once, no late audio/history mutation, all existing transcript retained. Measure real UTF-8/escaping, including quotes/backslashes/newlines/Chinese/emoji. No raw secrets/story logged.
3. Root/user choose the supported-content UX: diagnostic only versus block known-unserviceable play/share, wording and when it appears. Implement through the single app adapter helper after that decision. Test all characters, official/shared/editor-preview routes, zero-history and history-growth cases, invalid content handled by existing validation first. No mic/provider on initial rejection if a blocking preflight is approved.
4. Review deduplication with provider owner; test exact preservation of facts/instructions/history and demonstrate it does not weaken the guard. Product decides history policy only if continued long-context play is required.

No blanket full-suite rerun requested for this report. Production changes should run focused channel/gateway/liveVoice/controller and authoring tests affected by their actual patch, then relevant type/build checks. Transport contract export changes merit checking both browser and Worker bundling.

## Other routine documentation proposal

`packages/game-core/README.md` says wrong accusation remains interrogating. Actual `session.ts:98` returns lost and architecture explicitly requires terminal loss. A one-line README correction to match current approved/implemented semantics is routine and needs no product decision. Do not modify rules or tests to match the stale text. No README change is included in this investigation.

## Handoff and limits

Only new files in this directory are allowed and changed. No production implementation, root dashboard, previous report, dependencies, resource/port/service/browser state, microphone, provider, secrets, external API or paid requests changed. Existing main dependencies were only read for TypeScript transpilation; no symlink/install is needed. Reproduce with `node docs/reviews/context-budget-2026-10-25/probes.cjs [source-root] [installed-dependency-root]`. Use Node24.22.1. All fake relay/channel timers are closed by the probe.

This report investigates outbound context frames; arbitrary hostile upstream input/memory bounds, provider prompt semantics and genuine multi-user/session isolation are not newly certified. The old CR01 one-character reproducer remains valid; the new three-character Editor-valid example removes that presentation distraction without altering the finding.
