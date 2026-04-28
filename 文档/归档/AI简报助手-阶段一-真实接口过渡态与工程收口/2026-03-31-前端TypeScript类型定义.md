# 前端 TypeScript 类型定义

- 文档名称：前端 TypeScript 类型定义
- 文档状态：进行中
- 建立时间：2026-03-31
- 对应任务：`T2-3 定义前端 TypeScript 类型`
- 代码落点：
  - `prototype/src/types/page-data.ts`
  - `prototype/src/services/api.ts`

---

## 1. 本次落地内容

本次已完成第一轮前端类型定义，覆盖：

1. 当前后端真实列表响应类型
   - `ApiListResponse<T>`
   - `HotTopicListItem`
   - `OpportunityListItem`

2. 4 个主页面聚合类型
   - `TodayPageData`
   - `ChatPageData`
   - `ActionsOverviewData`
   - `GrowthOverviewData`

3. 对话执行和识别相关类型
   - `IntentRecognitionData`
   - `ChatExecuteResult`

4. 聚合页面子模块类型
   - 今日页摘要、推荐、值得知道、值得行动
   - 行动页待办、收藏、跟进、提醒
   - 成长页成长摘要、关键词、画像、历史、报告

## 2. 当前作用

这批类型的作用是：

1. 先把主页面聚合结构固定下来。
2. 为后续 `T2-4` 的 Pydantic 响应模型提供前端对齐目标。
3. 为后续 `T2-5` API 路径统一提供调用层类型约束。

## 3. 当前限制

这轮类型定义已经可用，但仍有两类内容是“预留型”：

1. 新聚合接口类型已定义，但后端接口尚未实现：
   - `getTodayPageData`
   - `getActionsOverview`
   - `getGrowthOverview`
   - `executeChat`

2. 旧接口路径尚未修正，类型已经收紧，但路径统一属于下一任务阶段。

## 4. 下一步

下一步应直接进入：

1. `T2-4` 定义后端 Pydantic 响应模型
2. `T2-5` 统一 API 路径和接口命名
