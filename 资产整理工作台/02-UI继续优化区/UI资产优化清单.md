# UI 资产优化清单

- 建立日期：2026-04-28
- 作用：区分当前稳定 UI 资产、继续优化页面、候选 demo 资产和待抽象组件。

## 当前稳定资产

| 资产 | 路径 | 当前判断 | 后续动作 |
|---|---|---|---|
| 设计 token | `apps/web/src/styles/design-tokens.css` / `design-tokens.ts` | 已成型 | 继续作为基础样式事实源 |
| 样式 recipe | `apps/web/src/styles/style-recipes.ts` | 已成型 | 用于沉淀复用样式语言 |
| UI 基础组件 | `apps/web/src/components/ui` | 可继续加强 | 建组件能力表 |
| Layout 组件 | `apps/web/src/components/layout` | 可继续稳定 | 保持页面壳一致 |
| 图标 | `apps/web/src/components/icons` | 可用 | 建图标用途表 |

## 继续优化页面

| 页面 | 路径 | 当前关注点 | 优先级 |
|---|---|---|---|
| Today | `apps/web/src/pages/TodayPage.tsx` | 每日重点、推荐、行动入口、移动端验收 | 高 |
| Actions | `apps/web/src/pages/ActionsPage.tsx` | 主行动、后续建议、任务来源表达 | 高 |
| Journal | `apps/web/src/pages/JournalPage.tsx` | 个人沉淀闭环、来源追溯、编辑能力 | 高 |
| My | `apps/web/src/pages/MyPage.tsx` | 入口分组、账号区、个人沉淀入口 | 中 |
| Chat | `apps/web/src/pages/ChatPage.tsx` | 写入边界、失败态、消息体验 | 高 |
| Reports | `Weekly/Monthly/AnnualReportPage.tsx` | 可信度口径、指标定义、真实数据表达 | 中 |
| Growth | `apps/web/src/pages/GrowthPage.tsx` | 画像关键词和成长表达 | 中 |

## 待抽象组件方向

| 组件方向 | 当前来源 | 价值 | 状态 |
|---|---|---|---|
| 内容列表卡 | Today / Actions / Article 相关推荐 | 降低重复卡片结构 | 待盘点 |
| 行动型内容卡 | Today 值得行动 / Actions 后续跟进 | 统一机会到行动的展示 | 待盘点 |
| 摘要面板 | Today 今日总述 / Growth 摘要 | 统一重点判断表达 | 待盘点 |
| 空状态 | Today / Actions / Reports | 统一无数据体验 | 待盘点 |
| 标签胶囊 | Today / Growth / My / Profile | 区分兴趣、状态、风险、摘要点 | 待盘点 |
| 页面报头 | Today / Growth / My / Chat | 控制报头重量和使用边界 | 待盘点 |

## demo 吸收规则

1. demo 页面不直接迁回正式路由。
2. 只吸收成熟的布局、组件和视觉语言。
3. 吸收前必须写清楚对应正式页面。
4. 吸收后应删除或归档重复 demo 资产，避免双维护。
