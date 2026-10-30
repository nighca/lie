# 历史资料补存的已发布版本

提交 `ca7f37f9c04530e124ade2e38c4f3f8d9bcab7df` 已普通推送。[CI40444791243](https://github.com/nighca/lie/actions/runs/40444791243) 与 [CD40444941027](https://github.com/nighca/lie/actions/runs/40444941027) 均 attempt1 / success；实际 deploy 步骤运行成功。产物12707564882恢复校验256文件，Worker版本 `43f0991b-333a-4feb-b09b-3bb99a0f4e3d`。

[汇总](result.json)、[CI](ci-final.json)、[CD](cd-final.json)、[产物](artifacts.json)、[部署摘录](deploy-evidence.txt) 来自当次只读监测。62个改动全属docs，50份来源身份、6JSON、92本地链接及whitespace通过；运行输入与f8c4e2b相同，复用已有TLS/标题测试，未新增线上浏览器/真实模型验收。归档成功不等暂停方案获批。

此证据在主协调收尾时补入本地main。用户明确要求收尾提交不push，因此本归档提交本身没有远端CI/CD，也不是新的线上版本。v1.0.0标签继续指向f8c4e2b，未移动。
