# rss_articles分片执行与Article接入D1设计

- 文档状态：进行中
- 建立时间：2026-04-04
- 所属阶段：阶段二 - Today / 内容层设计与事实层收束
- 作用：在 `article` 内容流水线分层已经明确后，继续细化 `rss_articles` 的分片执行方案，以及 `content/by-ref` 的 `article` 分支如何按“原始事实层”方式接到 D1 主读

---

## 1. 当前问题已经收敛到哪里

当前数据库切换主线中，唯一尚未进入实现的核心项是：

1. `content/by-ref` 的 `article` 分支

而它当前未切到 D1 的直接原因，不再是抽象层面的“内容层还复杂”，而是两个更具体的问题：

1. `rss_articles` 当前仍是重包
2. `article` 分支当前还没有按“原始事实层”方式接 D1 主读

因此，当前下一步不再讨论：

- 要不要切 `article`

而是只讨论：

1. `rss_articles` 怎么分片执行
2. `article` 分支怎么先从原始事实层稳定读

---

## 2. `rss_articles` 分片执行设计

## 2.1 当前目标

当前目标不是：

1. 重做 `rss_articles` 表结构
2. 重做 RSS 抓取链路
3. 同时把加工结果层和读侧投影层全部建完

当前目标只是：

1. 让 `rss_articles` 能以稳定、可重试、可中断恢复的方式进入 D1
2. 为 `article` 分支的 D1 主读提供最小原始事实基础

## 2.2 分片原则

当前分片应固定遵守：

1. 只按单表 `rss_articles` 分片
2. 只拆执行批次，不改字段结构
3. 只解决重包执行问题，不顺手改内容层架构
4. 分片结果必须可重复生成
5. 分片执行必须可单片重放

## 2.3 分片单位

当前建议按：

- 固定条数分片

而不是按文件大小或人工估算切片。

原因：

1. 条数更稳定
2. 更适合后续重放与定位
3. 便于明确“第几片失败”

## 2.4 分片命名

当前后续执行时，应采用固定命名：

1. `seed.content.rss_articles.part01.sql`
2. `seed.content.rss_articles.part02.sql`
3. `seed.content.rss_articles.part03.sql`
4. 依此递增

## 2.5 分片执行规则

当前后续执行时，应固定为：

1. 允许只执行某一片
2. 允许从某一片继续
3. 默认顺序是 `part01 -> part02 -> part03 ...`
4. 不再把所有 part 重新拼成一个超级命令作为默认入口

## 2.6 分片完成判定

当前后续执行时，`rss_articles` 分片完成至少应满足：

1. 所有 part 已成功执行
2. 可通过最小计数或抽样校验确认 D1 中存在对应文章事实
3. `article` 分支可以稳定读取至少一条真实 D1 文章详情

---

## 3. `article` 分支接入 D1 的设计

## 3.1 当前接入目标

当前 `article` 分支接入 D1 的目标，不是一步做到最终正式内容层，而是：

`让 article 分支先从 D1 中的原始事实层稳定读`

也就是：

1. 标题可读
2. 摘要可读
3. 正文可读
4. 来源可读
5. 标签 / 分类可读

当前先不要求：

1. 正式独立加工结果层
2. 正式独立读侧投影层
3. 更深的相关推荐正式化

## 3.2 当前接入方式

当前建议与 `hot_topic / opportunity` 一致：

1. 新增 `D1ContentStore` 中的 `article` 读取能力
2. 在 `content.py` 中给 `article` 分支补 `D1_USE_CLOUD_AS_SOURCE=true` 的主读分支
3. 本地 SQLite 分支保留不动

## 3.3 当前 `related_items` 口径

当前 `article` 分支进入 D1 时，不建议一步扩成全量内容层相关推荐系统。

当前更合理的是：

1. 先保持现有相关推荐思路
2. 但只使用已经稳定进入 D1 的内容层对象：
   - `hot_topics`
   - `opportunities`
   - 已进入 D1 的 `rss_articles`

也就是说：

- 相关推荐可以继续存在
- 但当前不应因为 `article` 切换而重写相关推荐体系

## 3.4 当前 `content_ref` 契约

当前继续保持：

- `article:{id}`

不改 `content_ref / by-ref` 契约。

## 3.5 当前切换边界

当前 `article` 分支切 D1 时，不应顺手触及：

1. RSS 管理接口
2. Today 推荐算法
3. 统一 `contents` 实体化
4. 报告层正式内容化

---

## 4. D1 当前承接 `article` 的正确层级

基于前一份 [Article内容流水线分层设计.md](/E:/python/杂谈-想法记录与实践/文档/进行中/2026-04-04-Article内容流水线分层设计.md)，当前 D1 对 `article` 的正确承接层级应固定为：

- 原始事实层

更准确地说：

- `rss_articles` 作为原始事实层 + 轻加工字段混合过渡表

当前不应被写成：

1. D1 已经承接了 article 的最终内容层
2. D1 已经承接了 article 的正式读侧投影层
3. Article 内容系统已经正式收束完成

---

## 5. 当前最小正确实现顺序

如果后续进入实现，当前最小正确顺序应为：

1. 先把 `rss_articles` 分片生成逻辑落地
2. 再把 `rss_articles` 分片执行入口落地
3. 再完成分片 apply 与抽样验证
4. 然后才给 `content/by-ref` 的 `article` 分支补 D1 主读分支
5. 最后再把 `article` 分支加入云端专项验证

也就是说：

`先让 D1 里有稳定原始事实，再让 article 接口去读。`

---

## 6. 当前结论

当前下一步若要继续推进 `article`，最小正确方案已经明确：

1. `rss_articles` 先按固定条数分片
2. 分片只解决执行问题，不改变表结构
3. `article` 分支先按原始事实层接 D1
4. 当前不追求一步建成最终内容层

这意味着：

`下一步可以进入 rss_articles 分片实现设计后的实际实现阶段，但实现时必须严格先做分片，再接 article 主读。`

---

## 7. 当前已执行结果

基于本设计，当前已经完成：

1. `rss_articles` 分片生成已落地，当前固定按 200 条 statements 一片生成：
   - `seed.content.rss_articles.part01.sql`
   - `seed.content.rss_articles.part02.sql`
   - `seed.content.rss_articles.part03.sql`
   - `seed.content.rss_articles.part04.sql`
   - `seed.content.rss_articles.part05.sql`
   - `seed.content.rss_articles.part06.sql`
2. `apply_d1_remote.py` 已支持顺序执行全部 `rss_articles` 分片
3. 通过复用单个 HTTP 客户端，D1 分片执行链路已明显稳定，`part06` 单片验证已能在可接受时间内完成
4. 全部 `rss_articles` 分片已完成远端 apply，总计 1132 条 statements
5. `D1ContentStore` 已补 `article` 原始事实读取能力
6. `content/by-ref` 的 `article` 分支已按“原始事实层”方式接入 D1 主读
7. 当前 `article` 分支 D1 下的 `related_items` 已恢复：
   - `hot_topics`
   - `opportunities`
   - 已进入 D1 的 `rss_articles`

### 当前验收结果

1. `npm.cmd run test:api-mainline` 通过，结果为 `16 passed`
2. `python scripts/verify_d1_behavior_mainline.py` 通过，当前已把 `article` 分支纳入云端主线专项验证

### 当前正确口径

当前应更新为：

1. `content/by-ref` 的 `article` 分支已完成 D1 主读切换实现与专项验证
2. `rss_articles` 当前已在 D1 中以“原始事实层 + 轻加工字段混合过渡表”的方式稳定成立
3. 当前数据库切换主线中，行为事实接口、行为聚合接口、轻内容接口与 `article` 重内容分支都已完成 D1 主读切换实现与专项验证
4. 当前尚未完成的，已经不再是“数据库切换主线”，而是后续是否继续推进更正式的内容加工层、读侧投影层或统一内容实体化
