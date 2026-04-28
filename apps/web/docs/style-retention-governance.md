# Style Retention Governance (UI)

## Goal

在结构重构过程中保留现有视觉人格（复古纸面风），避免出现“代码更干净但风格走样”。

## Non-Negotiables

1. 字体分工不变：
   - 标题身份层：`--font-serif-cn`
   - 正文与操作层：`--font-sans-cn`
   - 装饰微文案层：`--font-latin-elegant`
2. 装饰强度三档不变：`subtle` / `classic` / `rich`
3. 纸面语汇不变：暖纸底色、金线/虚线、菱形点缀、轻偏移阴影
4. 二级页面默认不展示底部主导航（保留层级清晰度）
5. 颜色与字体 token 以 `src/styles/design-tokens.css` 为唯一基线

## Typography Decision

### Navigation Label Decision

导航标签保持 sans（可读性优先），并通过 token 管控而非硬编码：

- `--font-nav-label`
- `--text-nav-label`
- `--tracking-nav-label`

这保证后续可以按实验切换字体策略，但不会在组件里散落重复定义。

## Ornament Decision

1. 装饰预算以“信息密度”为优先：
   - 高信息密度页面：默认 `subtle` 或 `classic`
   - 品牌感入口页面：允许 `classic` 或 `rich`
2. 摘要/英雄块可保留强化装饰（虚线内框、光泽、装饰角）
3. 常规内容卡默认降装饰，避免“全卡片都高装饰”导致层级失真

## Delivery Plan

### P0 (Now)

1. 修正页面层级默认值：`secondary` 隐藏底部导航
2. 导航字体 token 化并移除硬编码字体栈
3. 统一导航字体决策文档，避免“代码与规范冲突”

### P1 (Next)

1. 拆分 `index.css`（按 shell/navigation/surfaces/pages，已完成 `shell.css`、`navigation.css`、`surfaces.css`、`foundation.css`、`auth-pages.css`、`my-pages.css`、`journal-feedback.css`、`help-about.css`、`hot-topics.css`、`today-page.css`、`chat-page.css`、`actions-page.css`、`history-pages.css`、`ai-digest.css`、`report-pages.css`、`status-ui.css`、`preferences-pages.css`、`insights-pages.css` 抽离，并迁移对应移动端覆盖规则；下一步继续抽离剩余 page-scoped 规则）
2. 抽离装饰 token 到单一来源，减少重复色值与边框定义
3. 建立“页面级装饰预算”清单（每页允许的高装饰块数量）

### P2 (Later)

1. 把 `domain-card / tag / btn` 的常用样式收口到可复用组件层
2. 增加视觉回归基线（关键页面截图）防止风格漂移
3. 做可控 A/B：导航 serif vs sans（仅实验，不影响默认）
