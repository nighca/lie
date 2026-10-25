# 奶油色语音提示与首页滚动发布核验

发布SHA `8aa7ec967dfad45bf1646cdd27c6d909bebec437`；CI40180923871/attempt1、CD40181053281均success，精确产物/digest/Worker见[result](result.json)、[CD](cd.json)、[工件](artifacts.json)及[部署摘录](deploy-evidence.txt)。

正常TLS首页与引用JS/CSS字节、长期缓存及新规则见[线上身份](online.json)与[只读探针](static-probe.py)。压缩CSS使用等价width>=621px，首轮匹配器修正后通过，非产品故障。此发布核验不使用浏览器/provider；另一次实际Chrome＋受控fake transport补验见[组合验收](../../voice-connection-notice/combined-native-qa/README.md)，二者不互相冒充。

root已实际读六份完整材料并检查关联/JSON/脚本，归档不重新网络请求/部署；原始完整CD日志未入库，仅保留必要无凭据摘录。后续归档批会推进main，不以此旧SHA冒充新部署。
