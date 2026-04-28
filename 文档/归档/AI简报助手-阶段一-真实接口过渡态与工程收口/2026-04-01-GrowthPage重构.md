# GrowthPage 重构

- 文档名称：GrowthPage 重构
- 文档状态：进行中
- 建立时间：2026-04-01
- 对应任务：`T3-4 重构 MyPage 为 GrowthPage`
- 代码落点：
  - `prototype/src/pages/GrowthPage.tsx`
  - `prototype/src/pages/MyPage.tsx`
  - `prototype/src/App.tsx`
  - `prototype/src/pages/index.ts`
  - `prototype/src/services/api.ts`
  - `prototype/src/types/page-data.ts`

---

## 1. 本次目标

本次目标是先把“我的页”从功能列表推进为“成长中心”的第一轮版本。

优先完成：

1. 读取真实 `notes`
2. 读取真实 `history`
3. 把成长页结构收束为：
   - 成长摘要
   - 最近关键词
   - 一句话画像
   - 历史回顾
   - 报告入口

---

## 2. 本次已完成内容

### 2.1 新建 GrowthPage

新增：

- `prototype/src/pages/GrowthPage.tsx`

页面当前包含：

1. 成长身份卡
2. 本周成长摘要
3. 最近记录关键词
4. 一句话画像
5. 历史回顾
6. 报告入口

### 2.2 路由与兼容

新增：

- `/growth`

同时保留：

- `/me`

但 `/me` 现在转发到 `GrowthPage`，用于兼容旧入口。

### 2.3 真实接口接入

已接入：

- `getNotes()`
- `getHistory()`

这意味着成长页第一轮已经从纯 mock 驱动转为“真实记录 + 真实历史”驱动。

---

## 3. 当前仍未完成

本次仍未完成：

1. 真实画像接口接入
2. 真实成长聚合接口 `growth/overview`
3. 真实报告索引元数据
4. 关注变化与行为统计的自动聚合

因此当前状态应理解为：

- 成长中心结构已经开始成立
- 但仍是过渡版本，不是最终聚合页

---

## 4. 下一步

GrowthPage 第一轮完成后，建议下一步转入：

1. 阶段 4 的主闭环联调准备
2. 补齐真实聚合接口，逐步替换过渡态文案
