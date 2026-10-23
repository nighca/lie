# LIE 风格板：供用户选择方向

状态：探索预览，未批准，非正式 Logo、角色、界面或可运行页面。2026-10-23。

本目录实际包含两张内置 `image_gen` 工具生成的本地 PNG；没有使用 CLI fallback、HTML 截图或 SVG 替代。分别独立调用一次，未使用输入参考图片。对应方向提案见 ../../docs/visual-direction.md。

| 图片 | 方向 | 可评审重点 |
| --- | --- | --- |
| [night-desk.png](night-desk.png) | A 夜间调查台（推荐） | 暗色审讯区域、琥珀语音控件、浅色证据阅读面；语音对峙更突出 |
| [open-casefile.png](open-casefile.png) | B 公开案卷 | 浅色档案排版、深蓝操作、赭红标记；材料阅读与比较更突出 |

人物、名字、门禁记录、公寓与所有其他文案均为虚构占位，用来比较色彩、排版、人物表现和状态感受，不确认首案剧情、规则或语言。正式产品的中文排版仍需单独验证。图中 Logo 是方向草图，不能当作最终品牌资产；后续需检查缩小可读性并产出正式资源。图中“Close case”等按钮不是对玩法用语的批准。

## 本地路径与生成记录

本工作树路径：

- `/private/tmp/lie-visual-styleboards/design/styleboards/night-desk.png`
- `/private/tmp/lie-visual-styleboards/design/styleboards/open-casefile.png`

路径随本地集成迁移到主工作树时，以本目录的相对文件名为准。原始生成结果保留在：

- `/Users/nighca/.codex/generated_images/01a167a4-52a9-7eb2-ba15-8e2e9c90d04b/exec-d622a71a-0be7-4d69-9be4-263a78c0cb46.png`
- `/Users/nighca/.codex/generated_images/01a167a4-52a9-7eb2-ba15-8e2e9c90d04b/exec-d0bb5db7-6529-4001-a8ae-49bbdf141f04.png`

两次调用均为 `image_gen.imagegen({ prompt, transparent_background: false })`，未使用 `referenced_image_paths` 或 `num_last_images_to_include`。

## 目检结果与限制

已用 `view_image` 打开复制后的两张本地文件，尺寸均为 1536×1024。检查到：

- 两图都有三个嫌疑人卡、当前人物区、证词、证据阅读区、出示按钮、麦克风/波形/Listening/Stop、字标探索与色板。
- 暗色与浅色方向区别清楚；主要标签和门禁时间清楚可读，未出现警徽、古代道具或科幻霓虹。
- 未出现真实账号、API key 或供应商状态，未展示“谁是罪犯”的判定。
- 两图人物插画的身份外观不完全相同；此轮比较风格，不承诺跨图角色一致性。正式人物素材将在方向与案件确认后统一制作。
- A 底部的小色板标注较细；B 增加了虚构公寓照片和材料说明。均只作氛围参考，不直接进入应用。
- 图片是静态生成稿，未验证交互、中文排版、键盘操作、像素级色值或实际对比度。不能用其替代实现后的测试。

下一步请用户选 A / B 或明确需要修改的视觉要素，再制作正式主屏、tokens、角色素材和 Logo。主代理另行组织可点原型；本任务不包含其实现。

## 实际完整提示词 A

```text
Use case: ui-mockup
Asset type: exploratory visual direction board for desktop browser game LIE, not final production design.
Primary request: A wide landscape high-fidelity visual style board titled "A / NIGHT DESK". Modern single-player voice interrogation mystery game, three fictional suspects, restrained editorial art direction.
Composition: A large flat front-facing desktop UI occupies the upper 80 percent of the image, with a narrow style specimen strip beneath containing five palette swatches, LIE wordmark exploration, and a microphone control specimen. No laptop or physical desk photograph. In the UI: compact top bar with LIE on left and "CASE 01", "Close case" on right; three small fictional illustrated head-and-shoulder suspect cards ALEX, MORGAN, RILEY across the upper left, selected ALEX indicated by amber border and text; broad conversation zone left, pale evidence reading panel right. A larger selected suspect portrait in the conversation header, a few short neatly typeset dialogue lines below, stable voice control area at bottom with microphone icon, modest waveform, "Listening", "Stop". Evidence panel has title "ACCESS LOG", "SOURCE / BUILDING RECORD", a short timeline "21:10 Entry", "21:24 Exit", and a button "Present evidence".
Style: contemporary, quiet and tactile yet clean digital product, nuanced charcoal-blue panels with thin rules, subtle restrained rounded corners; ample space, highly readable sans-serif typography, bold white titles, body text not tiny. Character art consistent monochrome editorial illustration, distinct contemporary adults, original invented faces, not celebrities.
Palette: background #11171C, panel #1B242C, primary text #EEF1ED, secondary #B7C1C7, amber #E6B66A. Evidence reading surface warm paper #F3EFE5 with dark readable text.
Wordmark: "LIE" very legible geometric sans capitals, one subtle broken stroke as an exploratory concept. Small board footer "VISUAL DIRECTION / NOT FINAL".
Constraints: exactly three suspect cards, all English text short and spelled correctly, evidence remains clearly legible, voice interaction is visually central, no truth/guilt scores, no indication of culprit, no real credentials or accounts, no police badges, no vintage detective props, no cyberpunk, no sci-fi neon, no generic dashboard charts, no photos of physical devices, no watermark.
```

## 实际完整提示词 B

```text
Use case: ui-mockup
Asset type: exploratory visual direction board for desktop browser game LIE, not final production design.
Primary request: A wide landscape high-fidelity visual style board titled "B / OPEN CASEFILE". Modern single-player voice interrogation mystery game, three fictional suspects, a warm light editorial casefile system. Deliberately daylight and paper-oriented, not dark or neon.
Composition: A large flat front-facing desktop UI occupies upper 80 percent, a narrow style specimen strip beneath with five palette swatches, LIE wordmark exploration, and a microphone control specimen. No laptop or physical desk photo. In UI: compact top bar with LIE on left and "CASE 01", "Close case" on right; left conversational dossier column containing three small fictional illustrated head-and-shoulder suspect cards ALEX, MORGAN, RILEY in a row, selected ALEX marked by navy underline and text; selected portrait and few short conversational lines; bottom voice control area with microphone, modest waveform, "Listening", "Stop". Right evidence reading area generously laid out like a contemporary editorial archive, large "ACCESS LOG" title, "SOURCE / BUILDING RECORD", a two-item short timeline "21:10 Entry", "21:24 Exit", and navy "Present evidence" button. Thin precise dividing lines, small evidence index tabs.
Style: clean contemporary typography, generous gutters, near-square card corners, subtle warm paper texture only, ink-dark text. Strong clear hierarchy, large readable text. Three consistent monochrome ink-like editorial illustrated portraits of distinct contemporary adults, original invented faces, not celebrities. This is a digital game UI, not an illustration of old paperwork.
Palette: background #F2EFE7, white paper panels #FFFCF5, text #222B31, secondary #59646B, navy #24495C, very restrained rust #A33B30 for small graphic emphasis. No dominant black surfaces.
Wordmark: "LIE" very legible bold sans capitals with one small proofreading-style line offset, exploratory not finished. Small board footer "VISUAL DIRECTION / NOT FINAL".
Constraints: exactly three suspect cards, English short labels spelled correctly, evidence clearly legible, voice control clearly visible, no truth/guilt scores or culprit indicators, no real credentials/accounts, no badges, no wax seals, no typewriter fonts, no historical detective aesthetic, no physical props, no generic SaaS charts, no watermark.
```

