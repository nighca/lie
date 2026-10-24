# 清晨三角色候选恢复与验证

本代候选基线 `f4338346e3ec20fd742f6a75ea4362f428c18b5b`，worktree `/Users/nighca/.codex/worktrees/three-character-qa-dawn/lie`，分支 `codex/three-character-qa-dawn`。旧候选目录消失且5504/5505无监听后，由独立环境owner重放已review30链至eacd93e，再附source `1f7bb995e6db44bf9b584171ef38313a1d02a4af`灰白部分QA记录至bfb2a33。旧a440候选refs保留，不操作。

候选 `bfb2a33954cf78ea9b92e2f1acd7ef66e2faef1c`在环境handoff时clean；后续动画QA创建授权untracked `apps/web/public/qa-three-character-iframe.html`，由动画owner最终删除，root不得擅清。环境handoff检查如下：。环境owner以Node24.22.1运行全仓379测试、类型、Web＋gateway构建、79资源strict及3专属strict均PASS；3package＋16PNG与旧候选source/public/dist逐字节相同，35旧静态资源不变，新Editor CSS保留。日志：`/private/tmp/lie-three-character-dawn-tests.log`、`/private/tmp/lie-three-character-dawn-types.log`、`/private/tmp/lie-three-character-dawn-build.log`。root实际review附加证据22行及6截图，无blocker；这些仍只是部分正式QA，不能代替最终正式游戏IAB。

纯local demo统一 `http://127.0.0.1:5504`，PID24833/PTY77092，gateway指127.0.0.1:1，HTTP200；旧5505不恢复。动画专项已获root通知实际WT/SHA/URL，在新5504继续正式页QA，不占全局viewport。候选尚未main/push/部署。后续main若有功能变化须重建影响审查。

## 有序提交

准确来源 `/private/tmp/lie-three-character-dawn-ordered-shas.txt`，前三十重建角色提交，末项仅部分QA证据：

1. `112ecf7db14ef4139f728a24b16e927847b5acec`
2. `4741014e8f903936dc50432ce318639359ffdf77`
3. `5874314d30bceee54f4e5db572f11f3e16312102`
4. `71abfa80b7023898dfffb473ec384c7530f8f85f`
5. `104a3602a79eaa8809cab73b51d06c0f8a8cafd1`
6. `e9cc3e9ac24168b45586403846dab4bacfc14688`
7. `de3482e31515b1027dfd91de1e209a50bdca3472`
8. `137276cb9612f17c12ac5ef422227c779a8bef27`
9. `e531915590e633715175f37afcedd4378bf1fea6`
10. `9de5280767870d31f02edc8e2d59993cd7b3ab20`
11. `17c60aa515057be0b5093543f9a4a705b5e1f90a`
12. `303bfcea82d741228ebd35c4aad7a2dd822b185e`
13. `4072864d3333a5562a7802169fb9d6e3f6a50b34`
14. `a5789635895ce2e35185e8b5fcba8993a6aed2dc`
15. `1962feb00105f035d474943fc50ecc1d24898b61`
16. `e7d6a74bc05e4f09268164c19af37bc7e9cf9ffb`
17. `328041b522a096d35b9ad06a75a29d348e590686`
18. `008ec0a008a1d387c8c0fd986b3f44880b180cad`
19. `52c5a7127bed4821727dccf9405a921c19d09aff`
20. `ecf542846ba01066c1c9f130f6170828ae0f8ae2`
21. `7711f402ca927cc0fea64e79c2959bdde5ce4cc2`
22. `2c26b61becdf9b025c1290c7ffb5fc0d99bf1430`
23. `efa855ea3b58c16e2f244087695bdae2eab998ea`
24. `33bef9de3ccd48dfd2a2954d5031a5ede8a69d28`
25. `6b49ae96650b2ee81e3bbdb5514b6c06a9d62371`
26. `2ad1738d2ff41aef7c67f7a28656de4314b48e11`
27. `6fda64ea9213e4c2dd170486ebde822037f440a2`
28. `63c3b1c5a8c806bcc389ff1152e29efaba4cd6fd`
29. `09f87ad325268b1a3c28685ee377af47a767b341`
30. `eacd93ebd705915a9023648c55e591ec65e00795`
31. `bfb2a33954cf78ea9b92e2f1acd7ef66e2faef1c`

本批状态核验07:03:31：main已新增fan至3a67735；本候选仍基于f433834，需后续重建/影响验证，动画正持5504 QA，勿动branch/runtime。

本批文档source base `3f52ee599c321e76528cc7c73d52777ca9f6c34d`，与当时当前main3a67735不同；root按最新main候选集成。新main组合候选由环境owner独立重建，5504 QA源不动。

## 新main组合候选（待正式QA交付）

独立review WT `/Users/nighca/.codex/worktrees/three-character-integrate-dawn/lie`，branch `codex/three-character-integrate-dawn`，base `3a677358cc5fc69f215f13c44d51c5a9643eab2c`，clean冻结HEAD `051c441027030b8795cc14d7d998d85f14f55dd9`。全组合382测试（Web186）、全类型、Web＋gateway构建79资源、3 strict/hash通过。root已实际review31 log/tree对应：design/packages/scripts/lock与bfb一致，apps/src/test与3a一致，fan四文件及Editor CSS保持main。未main/push/部署。

5504原QA服务仍以bfb＋授权临时壳运行，动画owner负责最终清理，不动branch/runtime；本组合仅review，不新起服务。动画最新部分证据为三角色391 iframe四态实际观察、灰失败四态static及解除恢复single canvas通过，plum同类收尾，尚无完整clean handoff，不视为整体PASS。

准确有序31来源 `/private/tmp/lie-three-character-integrate-dawn-ordered-shas.txt`：

1. `3e4be7cfeea0a1013dddf2533b7b050b20f7b62c`
2. `193262bbe4d5dafca9a14b332161e2762edef07b`
3. `cd8e22730ab6531b5bc7f91940d4542c55d4dca5`
4. `7d4a7d17258414bdfe0da96f8e29e092df79064c`
5. `392756e71f0169b02fb05f9c1323d0acea004b2f`
6. `eb2ce2bcc4cbf1d845edfe5ef1bdd6318f987bf7`
7. `2d3d4ebe702dd10978c24f50310ac2c0d5034e28`
8. `7e025b4c7bc319bb959d9b7f44813ade322ebcd2`
9. `1b4b5f085ed7118bcb55e27efe1d6243de29b399`
10. `bbaf4ccd95988fed1ef663a5217df3346b081fb1`
11. `b174033b9b59f055589e38f2fbbc2c4e79023e03`
12. `018dd8cc503e6b6dd080e9b2ab9582afb45863bf`
13. `0ba6f0670f7b844b04298fd4009b4af4cf62cfff`
14. `ba629bebcaf1680e4902b80e7698bce153bf6375`
15. `62ba690c32f08175565ccaa7a0396513e6fe55f3`
16. `acdfed31f91feb6ec381dce2254050db8864eca6`
17. `95d714e82324cc61d9a180b6a6f0793781df9712`
18. `18c7f62ac1f3c69163f274978a4299713b340ac0`
19. `bb148b6c6b10926bfd18e3e3502bcfefd51f503c`
20. `481967beb4ca73a18abdc6091c4d384789493603`
21. `c2ab082b040177433c0127d1979e625877d34855`
22. `311cded55e36d50cb1600a20ce36dc872014f284`
23. `7fb2fd4bd4aa21028ef757c9dc97542ff2d61371`
24. `5a2bf8f174dab1081e4dee93503e1c866fedfcea`
25. `5282d0333798f26367112d49ad89e22c0597ef27`
26. `cb4c283b426b142512c67b4f2cd40843962a5076`
27. `b85489e1c5dce3b3b5831e73a55cec0acaae8eaf`
28. `9596c9bc401ca2c489d7db1b67407d075901d1fb`
29. `0749f68da3e6a0a77ce7ee9e060091382acc9e2a`
30. `27cab50152344d2fd5f326d4264eeba81717e2fd`
31. `051c441027030b8795cc14d7d998d85f14f55dd9`

## 最终正式QA与本地集成

完整sourceQA：silver97548eaa、gray da1b0749→c4c3298e、plum a70eb0e；新增4提交仅34JPEG/3JSON/docs。root实际review四份full text/JSON/cancel trace、18新增关键图及旧gray六图，无blocker。三角色均desktop1280×720＋391 iframe四态通过；gray/plum失败四态static及unblock恢复单canvas，silver失败default/reduce四态及恢复通过；plum trace85032.303 canceled=true ERR_ABORTED，最终gray单canvas。direct game console空；iframe两条MutationObserver无source来源未知。true hidden/full waiting game400ms/更广race/真机touch未验，不把fake当live voice。

独立最后候选3cbe10323280cffa7106f0e5539c9caf75646852/base73通过382测试（Web186）、类型、Web＋gateway构建79/strict；源/包及35旧静态字节相同。root再以最新fb6ae85重建35链，对3cbe仅访问intake三docs差异，功能/资产逐字一致；clean main已实际ff `a4e9f7d1e04a8c0d58f0f7cbec335e686913d36c`，未push/部署。QA源bfb临时壳删除/status clean，tabs28—33关闭/overrides清；环境回证：PTY77092失效，Ctrl-C返回Unknown process id；PID24833不存在/5504无监听，原因未知，不能称本次成功Ctrl-C停服。8787 main-status实返a4e9f7d＝当时main，三包HTTP200/字节同generated，79资源＋manifest共80文件，其他服务未触。

最终准确35链来源 `/private/tmp/lie-three-character-integrated-reviewed-shas.txt`，保留source/candidate refs不重放：

1. `acf184ddd4177cb4480364565b9e74f455543217`
2. `5a036501021bf2cea2170dfca1133f1d38b3ecf6`
3. `5ee2f54d7dfc5f94dd4ee62cd19808e8da52cb76`
4. `8f6c11f440f23dc1d83c3a5587fdb384203184ab`
5. `f2b982bbdea2847d01dd6d04a6bfd536af6441d3`
6. `64eb6010592cc75e4a62fb4c498e3153f3ccd35d`
7. `7f432403331b59dcb4ac1bb69d879ef503bb4293`
8. `15b5c63d53d5d636e5837adeb9867c0edd63536e`
9. `e5c7c1f9198c4c3506ef12998bd39decc81e570d`
10. `ea6e718e714efcb96c10d6c16fefc23a8159ecb5`
11. `f9af94dca4a7a6bfd024655231e907b79150d172`
12. `f04445bc57202383f8ebb9731ed17042d506b279`
13. `cb797295634cacf0af68219f8b6c850627070484`
14. `9b7e29ae6b4d45e2c6959bfbfeca4dd0b15a56d8`
15. `88470dbb3394a0e5a5052b6714cd8ab9cc79ffa0`
16. `c35119d88293e3cf83a406b3d5320fc5cb6a08d0`
17. `8fb7c5160f2f2ec1cfcf22012bbceb24ba44ea9e`
18. `962841589d74c754753741a2b5f468f1024053fb`
19. `91d3e813226dea5ff386ef98ba67bad0b8a45033`
20. `f8ab9c7595db2be809cad839bccae73ca10a4341`
21. `ce3ecc06e1b73b0b51fbcedd5c126d163838da18`
22. `5c734733f45381dddc932a75fb9f74bcef7aac59`
23. `14681d4f17cd280342dc1802c30980ddd80e3f27`
24. `796dcacf016232a3e3a9117a4f3f3724c5c10eaf`
25. `e17ad8f5e0fe0d1ec7079f7c4d0dbfefece4ee31`
26. `89cfc0ff6915a43d8cce43b6339f81648cab9bdf`
27. `a6393fb5c62992c973e9b1e486aaaac6e3433012`
28. `b893d44abb18101366f2116f197d0f16d0bf16da`
29. `a8b96014ae042e9105ee98a33729441e2956c4ab`
30. `f597bf8c91df154244b0d37dc9d0b11a6ba64340`
31. `c829ff506fcb33ad649653a57f9568dc51b7dff4`
32. `145aa1bcfc0d168e1ca87b64d44fc120764c049d`
33. `71975329a2a5147de730c4966701c154d3fe2444`
34. `01b5c97a0155321ab9e5bac843d7b4cb3e89e724`
35. `a4e9f7d1e04a8c0d58f0f7cbec335e686913d36c`
