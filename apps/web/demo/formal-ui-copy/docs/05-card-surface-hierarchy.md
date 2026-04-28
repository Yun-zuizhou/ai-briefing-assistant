# Card Surface Hierarchy 标准

## 这轮解决的问题

当前正式 UI 副本中的卡片体系已经存在，但层级表达还不够统一：

- `domain-card`、`page-panel`、`content-card`、`feedback-card` 都属于卡片承载面
- 但它们的层级表达不一致
- 大多数卡片还是直角边，容易显得偏草稿

这说明当前正式 UI 在卡片表面语言上：

- 已有体系
- 但还是半成品

## 本轮形成的正式标准

### 1. 卡片允许小圆角，但不能超过 8px

当前正式标准：

- `--radius-card-sm: 4px`
- `--radius-card-md: 6px`

使用原则：

- 一般内容卡、按钮、标签：`4px`
- 面板类、概览类、强调卡：`6px`

不允许直接跳到大圆角风格，否则会破坏当前纸面语义。

### 2. 卡片层级优先用“纸面偏移感”

当前正式标准：

- `--shadow-card-subtle`
- `--shadow-card-raised`
- `--shadow-card-soft`

使用原则：

- 普通卡片：轻偏移阴影
- 面板和整块容器：稍强偏移阴影
- 英雄卡、反馈卡：保留更柔和的体积阴影

### 3. 虚线只作为辅助层级，不是所有卡片的默认样式

当前建议：

- `surface-hero` 这类摘要卡保留虚线内框
- 普通内容卡不强制加虚线

原因：

- 如果所有卡片都叠虚线，会让层级反而混乱
- 这轮的目标是“稍微加一点层级”，不是把每块都做成装饰卡

## 这轮实际覆盖到的表面类型

- `page-panel`
- `page-stat-card`
- `page-entry-button`
- `trending-item`
- `domain-card`
- `domain-trend`
- `card`
- `card-bordered`
- `btn`
- `tag`
- `surface-hero`
- `subtle-panel`
- `feedback-card`
- `stats-strip`
- `content-card`

## 哪些写法仍然不进入标准

以下暂时不进入更高一级标准：

1. 超过 8px 的圆角
2. 漂浮感很强的大面积模糊阴影
3. 给所有卡片都叠虚线内框

这些都会明显冲淡当前正式 UI 的纸面结构感。

## 为什么适合迁回正式前端

这项标准非常适合后续迁回 `apps/web/src`，因为：

1. 影响面广，但改动集中在 token 和基础表面类
2. 能直接改善“草稿感”
3. 不改变业务结构和交互逻辑

## 迁回正式前端时的优先顺序

建议按这个顺序：

1. 卡片圆角和阴影 token
2. `page-panel / domain-card / content-card`
3. `surface-hero / feedback-card / stats-strip`
