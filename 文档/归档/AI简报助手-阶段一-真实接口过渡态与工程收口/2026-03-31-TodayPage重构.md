# TodayPage 重构

- 文档名称：TodayPage 重构
- 文档状态：进行中
- 建立时间：2026-03-31
- 对应任务：`T3-1 重构 HomePage 为 TodayPage`
- 代码落点：
  - `prototype/src/pages/TodayPage.tsx`
  - `prototype/src/pages/HomePage.tsx`
  - `prototype/src/App.tsx`
  - `prototype/src/pages/index.ts`

---

## 1. 本次重构目标

本次不是做完整视觉重做，而是先完成页面职责收束：

- 从“混合首页”
- 收束为“今日页”

重构重点：

1. 首屏明确回答“今天最重要的是什么”
2. 保留“因你关注而推荐”
3. 把内容拆成“值得知道的”和“值得行动的”
4. 增加“今日速记”入口

---

## 2. 本次已完成内容

### 2.1 新建 TodayPage

新增：

- `prototype/src/pages/TodayPage.tsx`

页面结构调整为：

1. 今日总述
2. 因你关注而推荐
3. 值得知道的
4. 值得行动的
5. 今日速记

### 2.2 保留兼容入口

`HomePage.tsx` 现改为转发到 `TodayPage`，避免已有引用立即断裂。

### 2.3 路由更新

新增：

- `/today`

同时：

- `/` 仍作为主入口，直接进入 `TodayPage`

---

## 3. 当前效果

相比旧首页：

- 删除了大量“热点趋势 + 摘要 + 卡片流”的重复表达
- 页面结构更接近“日报首页”
- 内容优先级更清楚

---

## 4. 当前仍未完成

本次仍是第一轮重构，尚未完成：

1. 使用真实聚合接口 `dashboard/today`
2. 使用结构化推荐理由
3. 将“转成待办”真正接入后端执行
4. 将“今日速记”真正接入 notes / history

因此当前状态应理解为：

- 页面结构已调整
- 数据闭环仍待后续任务接入

---

## 5. 下一步

TodayPage 第一轮收束完成后，建议下一步转入：

1. `T3-2` 重构 ChatPage 为快捷表达页
2. 同步规划对话执行如何接入真实 `todo / note / history`
