# @lie/game-core

A/B/C 的独立 TypeScript 基础模块，不依赖 Vue、DOM、Node.js API、平台服务或存储。测试故事均为 placeholder，不是正式首案。

## 内容

`validateGame(unknown)` 返回规范化的 `GameDefinition`；静态数据为 `id`、`title`、`background`、`characters[{id,name,profile,appearanceId?}]`、`ending{culpritId,reveal}`。文本保持原文，省略或空值的 `appearanceId` 规范为 `null`。不检查故事逻辑，也不生成角色文案。

`loadGame(gameId, read)` 使用调用方注入的异步读取函数，检查返回内容及游戏 ID。读取失败原样抛出；坏内容抛 `ContentValidationError`，`issues` 提供字段位置。

## 纯会话转换

```ts
import { accuse, createGameSession, startSession } from '@lie/game-core'

const opening = createGameSession(game, { sessionId: 'caller-generated-id', now: 100 })
const running = startSession(opening, 101)
const result = accuse(running, selectedCharacterId, 102)
```

- `createGameSession` 拷贝内容快照，阶段为 `intro`，无当前角色、无结果、逐人空历史。
- `startSession` 仅接受 `intro`，进入 `interrogating` 并选择内容中的第一位角色。
- `selectCharacter`、`appendDialogue`、`accuse` 和 `endSession` 仅接受 `interrogating`。
- `accuse` 错误时仍在调查中，结果 `correct: false`、`reveal: null`；正确时进入 `solved`，停止当前人物并返回揭晓文本。
- `endSession` 进入 `ended`，不主动揭晓；`restartSession` 在任意阶段创建新开场、清空历史和结果。新局 ID、数字时间戳由调用方注入。
- `appendDialogue` 只接受当前有效人物。条目为 `{id,role:'user'|'assistant',text,at,interrupted}`；本人同 ID 条目重复到达时返回原状态，不覆盖已有证词。

所有转换均返回新状态且不改输入，输入与结果使用 readonly 契约。错误操作抛 `GameStateError`，`code` 为 `invalid-phase`、`unknown-character` 或 `inactive-character`。异步事件归属、旧连接代次、麦克风和播放均由编排层负责，core 不管理 provider 生命周期。

## 角色上下文

`buildCharacterContext(game, characterId, history)` 返回当前人物身份、公共背景原文、私有设定原文、拷贝的历史和通用扮演提示词；不会读取其他人物设定或结局。调用方只传本人物历史，不传混合对话。历史与 systemPrompt 分开，可由接入层按供应商协议交付。

提示词约束不能保证真实模型遵守设定；需独立评估真实对话表现。浏览器仍持有完整内容，本模块不提供防作弊或对浏览器持有者保密。

## 检查

使用仓库的 TypeScript 和 Vitest：`npm run typecheck --workspace @lie/game-core`、`npm run test --workspace @lie/game-core`。无运行时第三方依赖。
