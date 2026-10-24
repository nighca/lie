from pathlib import Path
import json
from PIL import Image

root = Path(__file__).parent
labels = {'silver-bun':'银发盘发','salt-pepper-beard':'花白胡须','plum-crop':'紫色短卷','mint-puffs':'薄荷双丸子','ochre-freckles':'暖黄雀斑'}
template = (root.parent/'state-studies/coral-bob-v2/index.html').read_text()
for identity, label in labels.items():
    folder = root/identity
    sources = json.loads((folder/'sources.json').read_text())
    html = template.replace('顾遥',label).replace('四态加强版','四态完整化').replace('候选，待确认','素材待 review，未接入').replace('同一身份与服装；这次让表情和手部姿势一起说话。','同一身份与服装；沿用已批准的四态姿势力度。').replace('说话手势横向更宽，接入前需验证容器不会截手；本轮不覆盖上一版、不接入应用。','三态使用紧凑手势；接入前检查同组统一尺度和切换，当前不改运行时。')
    if identity=='silver-bun': html=html.replace('默认图原样沿用','默认沿 root 已 review 修订')
    (folder/'index.html').write_text(html)
    rows=[]
    for state in ['default','listening','waiting','speaking']:
        im=Image.open(folder/'assets'/f'{state}.png')
        assert im.format=='PNG' and im.mode=='RGBA' and im.size==(1254,1254) and im.getchannel('A').getextrema()==(0,255)
        bbox=im.getchannel('A').point(lambda x:255 if x>32 else 0).getbbox()
        rows.append(f'| {state} | {bbox} |')
    provenance='\n'.join(f'| `{state}.png` | `{source}` |' for state,source in sources.items())
    default_note='默认经过一次原图引用编辑，经 root 目检接受为东亚年长女性原创美术设定；三态独立引用该修订默认。盘发、衣服、圆润体型保留，不根据真实人物推断族裔。早期默认修订原始记录已在先行提交，当前延续该结果，未再次生成默认。' if identity=='silver-bun' else '默认沿已认可原图逐字节复制；三态各一次独立引用默认，不重做默认，不沿上一态继续重绘。'
    (folder/'README.md').write_text(f'''# {label}（{identity}）四态素材

{default_note}

[四态及表情近看](preview.jpg)，[原生排版源](index.html)。保留同一身份、体型、发型、衣服和原色，聆听靠耳手势、等待托下巴/支肘、说话张口并胸前掌心解释，均是静态对话活动，不表示罪责、可信度、模型推测情绪或实时口型。**资源交付待 root review，未改正式 manifest/runtime/voice。**

## 实际来源和 prompts

2026-10-24，内置 `image_gen.imagegen` 原图引用编辑，均 `transparent_background: true`。输入图先实际 view；每态完整实际 prompt 保存在 `prompts/`。PNG原样复制，未裁切、抠图、缩放、调色或用脚本编辑位图。生成次数：本套三态各一次；silver另外默认一次，全批共16次上限，全部成功，无额外重试/变体。

| 输出（assets下） | 原始来源 |
| --- | --- |
{provenance}

`sources.json`保存同样路径；相对默认来源均相对仓库根目录，绝对生成来源仅是制作记录，项目资源已实际复制，不依赖本机生成目录运行。

## 实际QA与边界

四图逐张 view：身份和服装保持，完整头发/脸部与活动手势入画，无明显额外手掌/多肢。手指采用卡通简化和自然遮挡，未逐像素锁定，肩线/手臂/衣褶会自然变化。新四态与已批准 coral-bob v2 力度一致；青少年形象保留普通日常装束和原有年龄比例，不成人化。

全部 PNG1254×1254/RGBA/alpha0–255。默认未重做的四套已校验逐字节一致；silver是上述已review修订。alpha>32可见包围盒如下，供检查透明边界；**不要据此逐图缩放/居中**。运行时应同组统一画布尺度、top对齐并contain，后续接入人员仍需在实际A容器检查状态切换和活动手势，不能从静态图宣称零跳位或覆盖所有屏幕。

| 状态 | bbox(left,top,right,bottom) |
| --- | --- |
'''+'\n'.join(rows)+'''

预览图为内置浏览器渲染HTML后的原始JPEG；下排面部放大只用于展示，未修改PNG。人物半身/下垂手的运行时裁切由统一容器控制，不承诺全身始终可见。本套不绑定案件姓名、秘密、职业或心理/道德倾向。完整注册和音色由后续实施owner负责，当前仅交可复用素材。
''')

head='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>五套完整化素材索引</title><style>*{box-sizing:border-box}body{margin:0;padding:28px;width:1280px;background:#fff18a;color:#111b45;font-family:system-ui,-apple-system,'PingFang SC',sans-serif}h1{font-size:28px;margin:0 0 8px}p{font-size:13px;color:#52607a;margin:0 0 20px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}a{color:inherit;text-decoration:none;background:#fffef7;border:2px solid #111b45;border-radius:20px;text-align:center;overflow:hidden;padding:12px}img{display:block;width:100%;height:300px;object-fit:contain}h2{font-size:17px;margin:10px 0 4px}small{font-size:11px;color:#52607a}.note{margin-top:24px;line-height:1.8}</style><h1>五套预置形象 · 四态完整化</h1><p>默认／聆听／等待／说话已备齐；点击人物查看同组四态及面部近看。尚未替换正式运行时资源。</p><div class="grid">'''

(root/'index.html').write_text(head+''.join(f'<a href="{identity}/index.html"><img src="{identity}/assets/default.png" alt="{label}"><h2>{label}</h2><small>{identity}</small></a>' for identity,label in labels.items())+'</div><p class="note">银发盘发默认按用户指定方向修订并经root review；其余四套默认不变。<br>所有状态使用同身份、同衣服、紧凑活动手势；静态状态不代表可信度或实时口型。</p></html>')
print('Built five self-contained previews and source/QA READMEs')
