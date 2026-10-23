# 已确认中文 B：具体界面稿

状态：总体风格及原型流程已确认，本轮具体设计供主代理 review 后交用户查看。人物、剧情、字标为占位；此目录不含应用代码。使用 Vue / TypeScript 实现时先读 [spec.md](spec.md) 和 [tokens.json](tokens.json)。

- [screens-flow.png](screens-flow.png)：接案、审讯、最终指认，2172×724。
- [voice-and-results.png](voice-and-results.png)：聆听 / 等待 / 说话、错误 / 正确、就绪 / 异常，1536×1024。
- 参考图：`design/styleboards/playful-zh-b.png`（用户已选）；参考流程：已确认原型 `prototypes/interaction`。

## 制作与目检

两张均使用内置 `image_gen.imagegen`；每次独立调用，以已查看的本地中文 B 作为 `referenced_image_paths`，`transparent_background: false`。没有 CLI fallback、HTML/SVG 替代或真实人物资料。原图保留，复制到本工作树：

- `/private/tmp/lie-approved-visual-design/design/ui/screens-flow.png`
- `/private/tmp/lie-approved-visual-design/design/ui/voice-and-results.png`

原始生成路径：

- `/Users/nighca/.codex/generated_images/01a167a4-52a9-7eb2-ba15-8e2e9c90d04b/exec-779ea6c0-400b-45e7-8fb8-9e55a3592a67.png`
- `/Users/nighca/.codex/generated_images/01a167a4-52a9-7eb2-ba15-8e2e9c90d04b/exec-cc7d77d4-3a78-498d-9826-fd695289a03c.png`

已用 `view_image` 打开复制后的两图：

- 黄蓝撞色、深蓝轮廓、亲切成人卡通与选中 B 一致；跨屏三名人物基本保持一致，中文主要标题与操作清楚。
- 接案有简介、三人及开始按钮；审讯有当前人物、只读转写和主语音区；指认有三人按钮与返回。
- 语音稿覆盖聆听、等待、说话、就绪、异常；错误返回、正确揭晓和重开齐全，没有证据、输入框、评分或生命。
- 位图审讯卡较紧凑，未完整展示身份与长历史；实际实现按 spec 常驻身份、允许滚动，不能直接把整屏位图当背景。位图不同面板不代表同时发生的状态。
- 错误稿省略“此人没有取走纪念章”的长说明，实际业务反馈以已确认原型为准。结局用三行概括，仅为排版示例，不替代完整经过。
- 尚未完成正式头像资源、正式矢量字标、浏览器图标、演示封面。不能直接裁图当最终角色素材。
- 图片不能验证真实音频、状态准确性、中文缩放、键盘、对比度或组件事件；实现后自动化与浏览器人工检查另做。tokens 是目标值，不宣称生成位图逐像素匹配。

## 完整实际提示词：流程稿

```text
Use case: ui-mockup
Asset type: concrete UI design handoff board, desktop Chinese voice detective game LIE.
Input image: approved visual style reference only. Preserve its sunny yellow, cobalt blue, dark navy 3px outlines, round chunky buttons, friendly expressive adult cartoon illustration, flat colors. Do not duplicate any third-party mascot.
Create a wide landscape board with THREE fully separated desktop page designs in a 3-column grid. Large readable simplified Chinese short labels, precise hierarchy, ample whitespace. Each column is one page, no overlapping collage. Title above each: "接案", "审讯", "最终指认".
PAGE1 接案: LIE text wordmark, warm white large rounded card on sunny yellow background. Title "消失的纪念章", short line "三个人，三种说法。谁在隐瞒？" Three small distinct suspect portraits (black-bob woman coral blazer 林岚; stocky mustache man yellow shirt 陈默; slim glasses man blue overalls 周启). Tiny process line "开口问话 → 对照说法 → 最终指认". Main cobalt button "接案，开始调查".
PAGE2 审讯: top LIE + title "消失的纪念章" + cobalt "最终指认". Left rail 3 same suspect portraits/name cards with 林岚 selected blue border and visible "当前人物". Center large selected friendly adult cartoon 林岚 portrait coral blazer against aqua simple shape. Right read-only transcript two rounded white speech bubbles "你：闭馆后，你在哪里？" and "林岚：我一直在前台呀。" Wide lower voice bar microphone/waveform status "正在聆听", button "结束说话". No text input.
PAGE3 最终指认: dimmed yellow interview page behind centered warm white rounded dialog, navy outline. Header "最终指认", description "谁取走了纪念章？". Three illustrated portrait choice buttons labeled "指认 林岚", "指认 陈默", "指认 周启". Clear secondary "返回调查". Selection itself submits; no extra submit button or text field.
Palette: canvas #FFF18A, card #FFFEF7, text/outline #111B45, primary #075BFA, coral #FF665B, aqua #78DDD7. Main text dark, blue buttons white bold labels, modern rounded Chinese sans-serif. Button raised bottom-shadow, not glossy. Character expressions playful but not guilt-coded.
Footer "具体设计稿 · 人物与案件为占位". No evidence, documents, scores, lives, maps, tips, clue board, truth meters, hidden answers in interview, or extra gameplay. No watermark. These screens share tokens and characters; no camera/device photograph. Make polished executable-looking digital layouts, not mood collage.
```

## 完整实际提示词：语音与结果稿

```text
Use case: ui-mockup
Asset type: concrete Chinese desktop game UI handoff board, voice states and result screens for LIE.
Input image is the approved STYLE reference: sunny yellow, cobalt, warm white, dark navy outlines, round chunky shapes, friendly expressive adult cartoon. Maintain this style, no third party mascot.
Create wide landscape, TWO neat rows, each three separated large rectangular panels with generous gutters, six panels total. Top row three reusable voice control states; lower row two result screens plus idle/error state detail. Short accurately rendered simplified Chinese, all panels coherent.
Top left heading "正在聆听": warm white wide voice bar with cobalt microphone and blue waveform, label "正在聆听", outlined "结束说话". A small black-bob adult woman in coral blazer with listening gesture above.
Top middle heading "等待回应": same bar static three blue dots, text "等待回应", outlined "取消本轮". Same woman thinking with hand to chin. This is voice waiting not lie detection.
Top right heading "正在说话": same bar speaker icon and blue waveform, text "正在说话", blue "打断说话". Same woman cheerful speaking gesture.
Lower left heading "指认错误": white dialog on sunny yellow, small surprised fictional mustache man yellow shirt, title "指认错误", text "可以返回调查，再听听其他人的说法。", strong blue "返回调查". No loss of lives, punishment, or correct culprit hint.
Lower middle heading "指认正确": white result screen on sunny yellow, calm celebratory simple coral and aqua confetti shapes, title "指认正确", cartoon woman small portrait, short placeholder explanation "林岚隐瞒了返回展厅的行为。", section "完整经过" with three short numbered placeholder lines "闭馆后返回展厅" / "将纪念章放入暂存柜" / "声称一直在前台", large blue "重新开始一局". Treat this as placeholder story not actual game fact.
Lower right heading "就绪与异常": two stacked small voice control variants, top microphone static "等待你开口" and blue "开始说话"; bottom simple warning icon, label "语音暂时中断", secondary "重试". Compact labels only.
Palette #FFF18A canvas, #FFFEF7 surfaces, #111B45 text/3px outlines, #075BFA buttons, #FF665B and #78DDD7 decorations. Rounded sans Chinese, body legible, 20px button corner, sturdy bottom-shadow, expressive simple adult characters not photo/realistic.
Footer "具体设计稿 · 语音状态依真实事件 · 人物与剧情占位". NO evidence/documents/clue board/text input/truth meter/extra gameplay, no device mockup or watermark.
```
