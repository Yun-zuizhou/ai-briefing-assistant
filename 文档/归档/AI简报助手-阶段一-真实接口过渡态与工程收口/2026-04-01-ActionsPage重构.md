# ActionsPage 重构

- 文档名称：ActionsPage 重构
- 文档状态：进行中
- 建立时间：2026-04-01
- 对应任务：`T3-3 重构 Todo/收藏/跟进为 ActionsPage`
- 代码落点：
  - `prototype/src/pages/ActionsPage.tsx`
  - `prototype/src/pages/TodoPage.tsx`
  - `prototype/src/App.tsx`
  - `prototype/src/pages/index.ts`
  - `prototype/src/services/api.ts`
  - `prototype/src/types/page-data.ts`

---

## 1. 本次目标

本次目标是先把“待办页”从单一任务页推进为“行动中心”的第一轮版本。

优先完成：

1. 读取真实 `todos`
2. 读取真实 `favorites`
3. 把页面总览收束为行动中心

---

## 2. 本次已完成内容

### 2.1 新建 ActionsPage

新增：

- `prototype/src/pages/ActionsPage.tsx`

页面当前包含：

1. 行动节律卡
2. 行动总览统计
3. 待办筛选
4. 待办列表
5. 收藏待处理列表

### 2.2 路由与兼容

新增：

- `/actions`

同时保留：

- `/todo`

但 `/todo` 现在转发到 `ActionsPage`，用于兼容旧入口。

### 2.3 真实接口接入

已接入：

- `getTodos()`
- `updateTodo()`
- `deleteTodo()`
- `getFavorites()`

这意味着行动页第一轮已经从纯 mock 驱动转为“真实待办 + 真实收藏”驱动。

---

## 3. 当前仍未完成

本次仍未完成：

1. 跟进中的机会区
2. 提醒摘要区的真实接入
3. 统一 `ActionsOverview` 聚合接口
4. 收藏动作的页面内创建入口

因此当前状态应理解为：

- 行动中心结构已经开始成立
- 但仍是过渡版本，不是最终聚合页

---

## 4. 下一步

ActionsPage 第一轮完成后，建议下一步转入：

1. GrowthPage 重构
2. 或直接开始让成长页读取 `notes / history` 真实数据
