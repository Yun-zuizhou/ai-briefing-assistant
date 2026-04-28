# 报告链路 content_ref 兼容层接入

- 文档状态：进行中
- 建立时间：2026-04-03
- 所属阶段：阶段二 - Today / 内容层设计与事实层收束
- 作用：记录 `reports` 如何开始认识统一内容引用 `content_ref`

---

## 1. 本轮处理的问题

在收藏链路开始兼容 `content_ref` 之后，报告层仍停留在旧状态：

1. `weekly / monthly` 里的热点项只有标题和描述
2. 报告页虽然能展示“本周热点 / 月度热点”
3. 但这些热点项还不能继续进入统一详情页

这说明当前报告层还没有真正接入统一内容读侧。

---

## 2. 本轮已完成的收束

### 2.1 后端

[reports.py](/E:/python/杂谈-想法记录与实践/app/api/v1/reports.py) 当前已补：

1. 报告热点项开始尝试生成 `content_ref`
2. 当前优先来源顺序为：
   - 先从 `favorites` 命中的收藏项生成 `content_ref`
   - 若收藏未命中，再尝试使用 `history_entries.ref_type + ref_id`
3. `ReportHotSpot` 已新增可选 `content_ref`

当前这一步仍然不是正式报告事实层，只是：

`报告热点项开始兼容统一内容引用`

### 2.2 前端

本轮已调整：

1. [WeeklyReportPage.tsx](/E:/python/杂谈-想法记录与实践/prototype/src/pages/WeeklyReportPage.tsx)
2. [MonthlyReportPage.tsx](/E:/python/杂谈-想法记录与实践/prototype/src/pages/MonthlyReportPage.tsx)
3. [page-data.ts](/E:/python/杂谈-想法记录与实践/prototype/src/types/page-data.ts)

当前周报 / 月报中的热点项，如果后端返回了 `contentRef`，前端就能：

1. 显示“查看热点详情”
2. 直接跳转到：
   - `/article?ref=...`

也就是：

`Report -> content_ref -> ArticlePage`

这条统一读取链路已经开始成立。

---

## 3. 当前结构判断

本轮完成后，报告层已经不再只是：

`聚合文本展示`

而是开始进入：

`聚合展示 + 统一内容详情跳转`

这意味着阶段二统一内容层的读侧，已经从：

1. Today
2. HotTopics
3. Collections

继续推进到了：

4. Reports

---

## 4. 当前仍未完成

当前仍未完成：

1. 报告层并不是所有热点项都一定能产出 `content_ref`
2. 当前热点项 `content_ref` 仍主要依赖收藏 / 历史命中，不是正式报告内容事实层
3. 年报链路还没有继续补详情跳转
4. `contents` 实体层仍未正式化

因此本轮正确口径应是：

`报告链路已进入 content_ref 兼容过渡态，但还不是正式统一报告事实层`

---

## 5. 本轮验收结果

本轮重新验收结果：

1. `pytest tests/test_dashboard_today.py` 通过，结果 `14 passed`
2. 默认 `pytest` 通过，结果 `20 passed, 1 skipped`
3. 前端 `build` 通过
4. 前端 `lint` 通过

补充说明：

`pytest tests/test_api_mainline.py`

在当前默认环境里仍是跳过态，这不是本轮新增回归，而是当前环境事实未变。

---

## 6. 当前最合理的下一步

在报告链路开始兼容 `content_ref` 之后，下一步最合理的是：

1. 让 `history` 链路开始对齐统一内容引用
2. 或继续补 `reports` 的更稳定热点事实来源

当前仍不建议直接跳到：

1. `contents` 重表
2. 报告事实层全面重构
3. 大规模 D1 数据迁移

