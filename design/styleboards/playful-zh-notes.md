# 两版中文风格稿 — 生成记录

2026-10-23。两张均由内置 `image_gen.imagegen` 全新生成，`transparent_background: false`，没有参考图或 CLI fallback。尚未获得风格批准。

- A：[柔和圆润](playful-zh-a.png)，原图 `/Users/nighca/.codex/generated_images/01a1677a-5eff-7f22-87c6-d2c382569aee/exec-33a16b0a-f38e-4e05-b0c2-01221110b845.png`。
- B：[活泼撞色](playful-zh-b.png)，原图 `/Users/nighca/.codex/generated_images/01a1677a-5eff-7f22-87c6-d2c382569aee/exec-6e267aec-724d-4317-b0c8-29d5e8484214.png`。

目检：两张均为 1536×1024，包含三名嫌疑人、同一当前人物的大图、只读短对话、语音控件和最终指认按钮。除品牌 LIE 外为中文；主要按钮与两句对话可读。没有证据、文字输入或新增评分/闯关元素。A 柔和留白更多，B 描边与撞色更鲜明。两图仍包含少量生成的渐变/阴影，并非冻结的平面规范。

人物、对白、字标均为占位；表情及语音状态小图仅是美术样例，不是系统识谎。A/B 的人物设定有意采用不同造型进行风格对比，不代表正式剧情。中文辅助小字、字重、色彩对比、交互和缩放仍需实际前端验证。

## A 实际完整提示词

```text
Use case: ui-mockup
Asset type: exploratory art-direction board for LIE, a desktop-browser voice-only deduction game. New design, not an edit.
Primary request: cheerful, simple, approachable casual-game visual design, with the friendliness of Duolingo but original characters, palette and branding. A humorous contrast between suspects hiding things and a lighthearted game interface.
Composition: wide landscape board, upper 82 percent one crisp flat front-facing desktop interface (no device frame), lower 18 percent clearly separated visual samples: 5 palette circles and three small voice-state examples.
Structure: top left original rounded LIE wordmark with small Chinese descriptor “语音推理”; top right quiet “结束本局” and primary “最终指认”. Exactly THREE original adult cartoon suspects on left rail, labelled “林岚”, “陈默”, “周启”, with 林岚 clearly selected. Main area: large expressive illustration of THE SAME 林岚 in selected thumbnail, and two short readable read-only dialogue bubbles, “闭馆后，你在哪里？” and “我？一直在前台呀。” Bottom stable voice controls: prominent microphone button, simple waveform, status “正在聆听”, smaller “停止” button. No text composer, typed chat or suggested-question buttons.
All visible interface language MUST be simplified Chinese except the LIE brand. Chinese labels precisely legible, large, well-spaced. No English UI words, no pseudo-Chinese glyphs. Bottom samples labelled “聆听”, “思考”, “说话”; footer “风格探索 · 非最终设计”. Bottom samples are not concurrent gameplay states.
Constraints: only voice conversation, switching suspects and button accusation; no evidence, documents, clue board, points, timers, lives, levels, guilt meters, badges, police symbols, owls or existing mascots. Original contemporary adults, not children. Playful facial expressions are illustrative, not lie detection indicators. No realistic faces, no noir, no paper casefile aesthetic, no gradients, no glossy 3D, no hatching, no interface clutter. Preserve whitespace and strong legibility.
Variant A — soft geometric playground.
Style: extremely simple flat geometric 2D character art, broad rounded silhouettes, big oval eyes, expressive thick eyebrows, mitten-like hands, minimal facial features and clean solid color shapes. Friendly mobile-learning-game craft with sophistication. 林岚 is a short-haired adult woman in a lavender sweatshirt, a slightly sheepish smile and a small shrug, NOT a realistic portrait. 陈默 is a broad adult man with round glasses and a teal shirt. 周启 is a lanky adult with curly hair and a peach sweater. Distinct memorable silhouettes.
Palette: warm almost-white backdrop, lavender/periwinkle primary, buttery yellow highlight, mint and peach secondary, deep ink text. White panels with generous rounded corners, small solid darker bottom-edge button shadows, no outlines on characters. Large light lavender oval behind current character. Minimal, calm and airy, few decorative details. Rounded sans-serif typography, friendly compact LIE wordmark.
Bottom sample strip: small repeated 林岚 face neutral / thinking / surprised, plus the palette and voice samples; one coherent design system.
```

## B 实际完整提示词

```text
Use case: ui-mockup
Asset type: exploratory art-direction board for LIE, a desktop-browser voice-only deduction game. New design, not an edit.
Primary request: cheerful, simple, approachable casual-game visual design, with the friendliness of Duolingo but original characters, palette and branding. A humorous contrast between suspects hiding things and a lighthearted game interface.
Composition: wide landscape board, upper 82 percent one crisp flat front-facing desktop interface (no device frame), lower 18 percent clearly separated visual samples: 5 palette circles and three small voice-state examples.
Structure: top left original rounded LIE wordmark with small Chinese descriptor “语音推理”; top right quiet “结束本局” and primary “最终指认”. Exactly THREE original adult cartoon suspects on left rail, labelled “林岚”, “陈默”, “周启”, with 林岚 clearly selected. Main area: large expressive illustration of THE SAME 林岚 in selected thumbnail, and two short readable read-only dialogue bubbles, “闭馆后，你在哪里？” and “我？一直在前台呀。” Bottom stable voice controls: prominent microphone button, simple waveform, status “正在聆听”, smaller “停止” button. No text composer, typed chat or suggested-question buttons.
All visible interface language MUST be simplified Chinese except the LIE brand. Chinese labels precisely legible, large, well-spaced. No English UI words, no pseudo-Chinese glyphs. Bottom samples labelled “聆听”, “思考”, “说话”; footer “风格探索 · 非最终设计”. Bottom samples are not concurrent gameplay states.
Constraints: only voice conversation, switching suspects and button accusation; no evidence, documents, clue board, points, timers, lives, levels, guilt meters, badges, police symbols, owls or existing mascots. Original contemporary adults, not children. Playful facial expressions are illustrative, not lie detection indicators. No realistic faces, no noir, no paper casefile aesthetic, no gradients, no glossy 3D, no hatching, no interface clutter. Preserve whitespace and strong legibility.
Variant B — lively graphic character comedy.
Style: flat graphic 2D cartoon with bold dark-navy outlines and assertive chunky shapes, asymmetric quirky adult silhouettes, comically raised eyebrows and exaggerated little poses. Crisp playful indie-game art, energetic but clean and easy to use. 林岚 is an adult woman with a triangular bob haircut and coral jacket, one eyebrow raised, hands tucked behind her back; 陈默 is a square-shaped adult man with a mustard shirt and tiny moustache; 周启 is a tall adult with large round glasses and cobalt overalls. All three invented and charming, not portraits.
Palette: pale sunny yellow backdrop, cobalt blue primary controls, tomato coral and aqua accents, near-black navy text and outlines. White rounded rectangular conversation bubbles, thick precise outlines, flat offset shadows on primary buttons. Bold but disciplined color blocking, selected character outlined in cobalt, main area largely open with one simple aqua backdrop shape. No confetti or decorative clutter.
Typography: large soft bold Chinese sans labels, strong hierarchy, slightly bouncy original LIE wordmark. Bottom sample strip: three little expression variations of 林岚, palette and voice samples, same outlined design language.
```
