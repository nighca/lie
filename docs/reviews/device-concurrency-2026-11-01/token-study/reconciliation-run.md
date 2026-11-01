# 首轮创建状态：单次只读核对回执

2026-11-01。父owner实际审查`reconcile.mjs`及4项离线检查后，给予总协调批准的单次只读turn。执行前再次核SHA256为`b94d9390b9cf2f3e4d8f9ec3e0e3354389d99dfb6c29c5f43fc22457168cbec7`，与审查一致。

实际采用项目专用Node24.22.1、`--use-system-ca`、`--execute-readonly-approved`，exec设置`require_escalated`，理由限定为用户token验证失败后的资源状态收尾核对。没有自动审批拒绝。exec session51027最终exit0，无后台请求、WS、服务或其他消费者残留，结束后释放turn。

[原始安全投影](reconciliation-result.json)只有四字段：

```json
{"httpStatus":200,"businessCode":0,"match":0,"hasMore":false}
```

只请求一次固定`GET /xiaozhi/agent/list?limit=20`，按原0600私密state内的完整唯一名称在内存精确匹配。`hasMore=false`依据成功响应的`nextCursor=null`；`match=0`表示该完整响应快照未发现此次名称。没有扫描后续页、输出账户清单/ID/名称/正文、重试、创建、删除、OTA或WS。

因为没有匹配，原state不更新`agentId`，也不改createAttempted或cleanupComplete；[首轮失败result](result.json)保持原样。无需据本次结果尝试DELETE未知资源。此回执支持“本次核对快照中未发现待清理的测试Agent”，不声称首轮请求从未抵达、精确网络cause已找回或供应商全部日志已擦除。此核对没有验证token；后续独立[第二轮](run-02.md)验证了新T1共享，原固定token和生产secret仍未验证。
