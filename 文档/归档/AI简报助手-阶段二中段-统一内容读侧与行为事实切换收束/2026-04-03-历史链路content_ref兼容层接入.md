# 历史链路 content_ref 兼容层接入

- 文档状态：进行中
- 建立时间：2026-04-03
- 所属阶段：阶段二 - Today / 内容层设计与事实层收束
- 作用：记录 `history` 如何开始对齐统一内容引用 `content_ref`

---

## 1. 本轮处理的问题

在收藏链路、报告链路都开始兼容 `content_ref` 之后，历史链路仍停留在旧状态：

1. `history` 只暴露 `ref_type + ref_id`
2. 历史页只能看文本记录
3. 历史事件还不能沿统一内容读侧继续进入详情页

这意味着当前统一内容层虽然已经覆盖：

1. Today
2. HotTopics
3. Collections
4. Reports

但还没有覆盖：

5. History

---

## 2. 本轮已完成的收束

### 2.1 后端

[history.py](/E:/python/杂谈-想法记录与实践/app/api/v1/history.py) 当前已补：

1. `HistoryResponse` 新增可选 `content_ref`
2. `get_history` 已开始按：
   - `hot_topic`
   - `article`
   - `opportunity`
   这三类 `ref_type`
   自动生成 `content_ref`
3. `create_history` 已支持直接传 `content_ref`

当前仍保持旧兼容：

`ref_type + ref_id`

并没有改动当前真实历史表结构。

### 2.2 前端

[HistoryLogsPage.tsx](/E:/python/杂谈-想法记录与实践/prototype/src/pages/HistoryLogsPage.tsx) 当前已补：

1. 当历史事件带有 `content_ref` 时，页面显示统一引用
2. 历史事件可直接点击“查看详情”
3. 跳转到：
   - `/article?ref=...`

也就是：

`History -> content_ref -> ArticlePage`

这条统一读取链路已经开始成立。

---

## 3. 当前结构判断

本轮完成后，统一内容读侧已继续推进到：

1. Today
2. HotTopics
3. Collections
4. Reports
5. History

这意味着当前阶段“统一内容层”的真正稳定面，已经不再只是 Today 详情问题，而是开始进入：

`多入口共用同一条内容读取链路`

---

## 4. 当前仍未完成

当前仍未完成：

1. 历史表未正式落 `content_ref` 字段
2. 历史链路的 `content_ref` 目前仍是兼容推导，不是正式事实字段
3. `todo / note` 这类历史事件当前仍不会生成 `content_ref`
4. `contents` 实体层仍未正式化

因此当前正确口径应为：

`历史链路已进入 content_ref 兼容过渡态，但还不是正式统一历史事实层`

---

## 5. 本轮验收结果

本轮已重新验收通过：

1. `pytest tests/test_dashboard_today.py` 通过，结果 `15 passed`
2. 默认 `pytest` 通过，结果 `21 passed, 1 skipped`
3. 前端 `build` 通过
4. 前端 `lint` 通过

---

## 6. 当前最合理的下一步

在历史链路开始对齐统一内容引用之后，下一步最合理的是：

1. 继续补统一内容读侧的测试和边界说明
2. 或开始整理哪些入口已经可以视为“统一内容读侧稳定过渡态”
3. 再进一步收束“现在是否进入 `contents` 实体化”的时机判断

当前仍不建议直接跳到：

1. `contents` 重表
2. 全量历史层重构
3. 大规模数据迁移

