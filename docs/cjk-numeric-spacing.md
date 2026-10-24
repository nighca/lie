# 开局时长的中西文间距

2026-10-25。范围仅为 `App.vue` 的开局时长提示，例如“本局可询问8分钟”和“本局可询问5分30秒”。给该段落专属 `intro-duration` 类，并在组件 scoped CSS 显式设置 `text-autospace: normal`。

## 为什么用 CSS

[CSS Text Level 4](https://drafts.csswg.org/css-text-4/#text-autospace-property) 定义 `text-autospace` 控制中西文交界留白。`ideograph-numeric` 管理汉字与数字，`normal` 同时涵盖字母和数字。该间距属于排版，不是插入实际空格字符，因此原始文案、复制文本及读屏文案不变。规范定义保守的 `1/8ic` 间隔，不能当作固定像素或普通半角空格。

规范初始值与浏览器默认实现须区分：[WebKit 18.4 官方说明](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/#text-auto-space) 明确实现默认仍为 `no-autospace`，需要作者 opt in。[Mozilla Firefox 145 发布说明](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/145#css) 也记录了此属性的支持。

[MDN 浏览器兼容数据源](https://github.com/mdn/browser-compat-data/blob/main/css/properties/text-autospace.json)（本次查询2026-10-25）记录 `normal` 支持于 Chrome 140、Firefox 145、Safari 18.4，并指出三者当前默认仍为 `no-autospace`。特别是 Chrome 对 `ideograph-numeric` 单独值仍未支持，不能只因支持属性就假设其所有关键字可用。因此这里显式选择 `normal`，不使用 `auto`、`insert` 或 `replace` 等支持范围较窄的值。

## 范围与降级

不放在 `:root`、`body` 或通用 `.muted` 上，不改变首页、编辑器、表单、代码、JSON、故事、转写或草稿。时长格式化函数及其原始字符串不变，不批量塞空格，也不添加逐字 JS 处理。

旧浏览器忽略此属性，仍显示原文，可能没有额外视觉留白。本轮选择这种渐进增强，不加 span 包数字、margin 模拟或 JS polyfill：它们会增加时长格式化/DOM复杂度，且不属于已有明确的旧浏览器保证。若后续要求旧浏览器也严格保证留白，应单独确定支持基线后再选局部降级，不直接扩展全局。

## 验证边界

已有 App 测试覆盖自然时长格式及原文；CSS 视觉效果需要真实浏览器验证，JSDOM 的文本断言不证明排版留白。浏览器检查应记录：

- `CSS.supports('text-autospace', 'normal')`、`ideograph-numeric` 和 `getComputedStyle(element).textAutospace`。
- 同一字体/字号下，在独立临时测量节点比较相同原文的 `normal` 与 `no-autospace` 宽度；“问8分”有两处交界，不能只检查属性被接受。
- 正式开局页在桌面/391px的时长文本完整且无横溢；改为5分30秒仍正确。
- `textContent` 保持无插入空格；其他元素没有继承本专属规则。

这项改动不使用麦克风、真实语音或付费供应商；浏览器排版核验不代表真人语音验收。

### 本次自动检查

Node 24.22.1：现有 `test/App.test.ts` 17项通过（含10分钟、5分30秒的原文断言），Web `vue-tsc --noEmit`、Vite production build及60个生成素材检查通过，`git diff --check`通过。未增加只复述class/CSS声明的测试。

### 本次 IAB 代验与证据复核

子任务未开放IAB，由root协调有IAB的专项在独立5501构建预览完成检查；本任务随后阅读测量JSON并实际目检桌面/窄屏截图。只进入intro，未开始游戏或语音。

- 1280×878与391×844下，`scrollWidth`分别为1280/391，无水平溢出。窄屏截图为页面上部，时长在首屏之外；其排版数值由DOM测量核验，未声称该截图已展示完整时长区域。
- `CSS.supports`：`normal=true`、`no-autospace=true`、`ideograph-numeric=false`。专属时长computed为`normal`，普通`.muted`仍为`no-autospace`，未污染通用样式。
- 原文仍为`本局可询问8分钟`，没有插入实际空格。14px同字体的临时inline span测得normal/no-autospace宽度为110.296875/106.796875px，增加3.5px；“本局可询问5分30秒”为130.8046875/123.8046875px，增加7px。
- Range逐字结果与每个中西文边界约1.75px的增量一致：8分钟有两处，5分30秒有四处；这是当前字体/字号下的实测，不把1.75px硬编码进CSS。
- 临时测量节点已移除，没有改真实文字或游戏数据；console warn/error为空，viewport已重置，自建tab已关闭。

原始临时证据：`/private/tmp/lie-cjk-spacing/measurements.json`、`desktop.png`、`mobile.png`。这些是本机临时文件，核心测量已保存在本文，文件后续可能被清理。

仅本次IAB实测，未做独立Firefox/Safari或旧浏览器实机验收。旧浏览器忽略属性的行为仍是CSS兼容降级推断。
