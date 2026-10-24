# Waiting 局部呼吸复验

2026-10-24；用户认为waiting整人左右晃，其他状态无问题。本次仅针对waiting；未把用户对其他状态的认可等同于整个角色最终批准，正式资源仍未激活。

source `ebbf81f82ad72c45c0a1fef633a4bdc1c34e6196`，实际parent `9133ca3aaa013c819d92170e09ef5da81bd7253d`。取消waiting全身body位移与head-root侧转。waiting-torso拆成腰以上呼吸层与body-root固定下身层；同源PNG、y842—858重叠，以y850为锚纵向±0.6%，17个四分之一秒正弦采样key、4秒周期。头手与上身继续共父链，嘴随头走。其余三clip、全部非waiting旧node及素材字节保持相同。

发起者读取完整diff与装配/播放器周边实现，实际5355桌面全身实播，5354 waiting1s/3s腰部与脸部放大复看；未见整身侧摆、明显脸部拉伸、腰缝、嘴移位或手下巴脱接。最后17key版本重新加载5355实播通过。当前用户478px页亦已实际重新加载银发waiting，width=scrollWidth=478；无横向溢出，console error/warn为空。原生截图silver-waiting-breath-*，未编辑像素。极值截图在最终正弦插值前拍摄，幅度/装配/极值完全相同；final-live与user是最终17key数据。没有本次391实测或真实语音声明。

独立只读QA已审完整增量、精确比较其他三clip/非waiting node/assets，并实际运行check.mjs通过；该检查在25ms采样中断言body及下身全部transform固定、头无横摆、实际纵向呼吸、嘴互斥、loop与中断连续。worker实际source audit及全父链32相位waiting腰线alpha覆盖检查通过；QA阅读源码确认有界非空断言，未重复耗时Python检查。数值覆盖不证明颜色重影、抗锯齿或所有过渡帧艺术效果。

检查后关闭自建tab；本次未设置共享viewport。5354临时服务停止，保留用户5355与其他共享预览服务。用户仍需判断waiting观感，未合入main、push或激活。
