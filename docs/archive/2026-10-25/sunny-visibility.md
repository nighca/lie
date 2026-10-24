# Sunny visibility QA — 2026-10-25

Read-only baseline: 6653bf44b8bd9c1d9b1895e9111d894ebdc94ec0, clean main at start. No branch/worktree/commit/ref mutation and no production source changes. Root later integrated documentation-only f535c4ee3eabceaa8ec553a4ab5393856aa40ac0.

## Actual top-level game

Opened own background Codex IAB tab 1 at http://127.0.0.1:8787/?game=empty-medal-box and entered the actual game. Shen He rendered the sunny-moustache 1254×1254 canvas (display block), with corresponding sunny avatar assets. No demo/fake provider and no conversation was started. Switching character away/back worked and returned a single active canvas. Instrumentation in this tab observed visible/hidden=false, no visibilitychange events, 543 clearRect draws, pending RAF 1/max 1. This is ordinary visible playback evidence, NOT hidden/restore evidence.

Attempted setup returned exact limitations: `This method is not supported through raw CDP.` for Page.addScriptToEvaluateOnNewDocument; creating a second background IAB tab returned `IAB visibility is not supported in a subagent thread`. Only tab 1 existed afterward. No approval/rejection was observed. Did not request global viewport/browser visibility/native app control or use someone else's tab.

## Explicitly synthetic same-origin iframe check

Replaced only own tab body with a clearly labeled QA shell and 1000×720 same-origin iframe loading the actual game. Installed RAF/cancelRAF/clearRect observation wrappers in iframe before entering the game. For three bounded cycles, own iframe document.hidden and visibilityState were shadowed and synthetic visibilitychange dispatched. Every event was isTrusted=false. Each hidden interval lasted about 250ms: draw counts held 29→29, 44→44, 60→60 with pending RAF 0. About 250ms after restoration draw counts advanced to 44/60/75 with pending RAF 1; max pending stayed 1, canvas count stayed 1/display block. Removed document overrides afterward; actual state remained visible. This verifies callback cancellation/restart in synthetic conditions, NOT native tab lifecycle or operating-system background behavior. Counters show no duplicate RAF in these three cycles, not an exhaustive scheduler proof.

No fresh static fallback fault injection was performed in this bounded follow-up. Existing earlier reduced-motion/load-failure acceptance remains separate. Real hidden/restore and long background suspension remain UNVERIFIED; no new source bug was found.

## Environment and cleanup

Read-only lsof showed 8787 PID31089 and 8788 PID31169 LISTEN and IAB loaded the app, despite root shell curl failures. No services were restarted/stopped. No private credential file was read. No owned server was started. No global viewport/media/network overrides. Own tab 1 was closed, destroying shell/instrumentation/iframe. No user or specialist tabs touched. Console warn/error list empty. Screenshot is simulation-only and not official visual acceptance.

Evidence: observations.json and iframe-simulation.jpg in this directory. No commits to integrate. Root should retain sunny real hidden/restore as pending with this concrete IAB capability blocker, and may record synthetic cancellation/restart as supporting evidence only.
