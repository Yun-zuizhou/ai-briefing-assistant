# UI资产现状与分类报告

- 建立日期：2026-04-28
- 涉及任务：T002（demo 价值分级）、T018（CSS 职责梳理）、T019（UI 组件能力表）、T020（业务组件边界）

---

## 1. T002 — Demo 页面价值分级

### 当前状态

`apps/web/src/demo/pages/` 共 6 个 demo 页面，总计约 2179 行。已通过 `DemoAppProvider` 独立状态、独立路由与正式前端隔离。

### 分级结果

| 页面 | 行数 | 分级 | 理由 |
|------|------|------|------|
| `ArticleReaderPage.tsx` | 591 | 保留参考 | 阅读器交互模式（展开/折叠、书签、分享）有可吸收的 UX 模式 |
| `StoryPage.tsx` | 161 | 保留参考 | 日/周/月报切换模式，与正式 `WeeklyReportPage`/`MonthlyReportPage` 对照可吸取布局思路 |
| `CollectionPage.tsx` | 378 | 保留参考 | 收藏筛选/删除交互模式，与正式 `CollectionsPage` 对照有参考价值 |
| `DecorPreviewPage.tsx` | 367 | 归档候选 | 纯 ASCII 装饰预览，无产品功能价值 |
| `DesignPreviewPage.tsx` | 310 | 归档候选 | 旧设计概念稿，与当前 UI 设计系统方向不一致 |
| `StylePreviewPage.tsx` | 426 | 归档候选 | 旧配色方案预览，当前 `design-tokens.css` 已接替此角色 |
| `MarksPage.tsx` | 156 | 归档候选 | "日志存档"简单展示，无独特交互模式 |

### 建议

- Demo 数据文件（`demo/data/*`）和 Context 保持现状，不迁移
- 4 个归档候选页面可在下一轮清洗中移入 `_archive_workspace` 或直接删除
- 3 个保留参考页面维持当前 demo 地位，不迁回正式路由

---

## 2. T018 — 页面 CSS 职责梳理

### 当前状态

`apps/web/src/styles/` 共 19 个 `.css` 文件 + 2 个 TS 文件（`design-tokens.ts`、`style-recipes.ts`），总计 9017 行 CSS。

### CSS 文件分类

**页面专属 CSS（13 个，6885 行）：**

| 文件 | 行数 | 对应页面 | 重叠风险 |
|------|------|----------|----------|
| `journal-feedback.css` | 833 | JournalPage, HelpFeedbackPage | 中 |
| `insights-pages.css` | 827 | GrowthPage, AiDigestLabPage | 中 |
| `report-pages.css` | 804 | Weekly/Monthly/AnnualReportPage | 低（三报告共享合理） |
| `auth-pages.css` | 759 | LoginPage, ProfilePage, SettingsPage | 低 |
| `today-page.css` | 643 | TodayPage | 低 |
| `hot-topics.css` | 584 | HotTopicsPage, ArticlePage | 中 |
| `history-pages.css` | 562 | HistoryLogsPage, HistoryBriefPage | 低 |
| `status-ui.css` | 519 | 跨页面状态/过渡态 | **高**（跨页面散落） |
| `preferences-pages.css` | 517 | InterestConfigPage, AiProviderSettingsPage 等 | 中 |
| `chat-page.css` | 490 | ChatPage | 低 |
| `shell.css` | 473 | App 壳/布局 | 中 |
| `actions-page.css` | 396 | ActionsPage | 低 |
| `help-about.css` | 356 | HelpFeedbackPage, AboutPage | 中 |
| `ai-digest.css` | 324 | AiDigestLabPage | 低 |
| `my-pages.css` | 213 | MyPage | 低 |

**基础设施 CSS（4 个，559 行）：**

| 文件 | 行数 | 角色 |
|------|------|------|
| `surfaces.css` | 431 | 卡片、面板、容器表面样式 |
| `navigation.css` | 135 | 底部导航 |
| `foundation.css` | 110 | 基础重置和全局变量 |
| `design-tokens.css` | 41 | 设计 token CSS 变量 |

**TS 工具（2 个，17130 字符）：**

| 文件 | 角色 |
|------|------|
| `design-tokens.ts` | 设计 token 定义（颜色、间距、圆角、阴影） |
| `style-recipes.ts` | 组合样式 recipe（cva 模式） |

### 发现的问题

1. **`status-ui.css`（519L）职责模糊**：跨页面散落的过渡态、加载态、空态样式，与 `LoadingSpinner`/`EmptyState`/`ErrorToast` 组件重叠。
2. **`journal-feedback.css` 最大（833L）**：承载 Journal 和 Feedback 两类不同页面，职责混在一起。
3. **`foundation.css` 偏薄（110L）**：很多全局基础样式被写入了各页面专属 CSS 而非 foundation。
4. **`style-recipes.ts`（8043 chars）已建立但使用面窄**：设计 token 和 recipe 已有，但页面 CSS 中仍大量手写样式。

### 建议

- 优先：`status-ui.css` 中与 UI 组件重叠的样式，确认哪些应下沉到组件层
- 中优：拆分 `journal-feedback.css` 为 `journal.css` + `feedback.css`
- 低优：将 `foundation.css` 中散落在页面 CSS 的基础变量收拢

---

## 3. T019 — UI 基础组件能力表

### 当前组件清单

| 组件 | 行数 | Props 导出 | 覆盖场景 |
|------|------|------------|----------|
| `Button` | 55 | 1（默认导出） | variant (primary/secondary/ghost/danger), size, loading, disabled |
| `Card` | 39 | 1 | padding, hover, onClick |
| `ConfirmModal` | 102 | 1 | title, message, confirmText, cancelText, onConfirm, onCancel, variant (danger/default) |
| `EmptyState` | 66 | 1 | icon, title, description, action |
| `ErrorToast` | 81 | 2（组件+hook） | message, onDismiss, autoDismiss |
| `Input` | 67 | 1 | label, error, icon, type |
| `LoadingSpinner` | 69 | 2（组件+页面级变体） | size, text, variant (inline/fullPage) |
| `SocialLoginButtons` | 66 | 1 | onGoogleLogin, onGithubLogin, isLoading |
| `Switch` | 30 | 1 | checked, onChange, disabled, label |
| `Tag` | 26 | 1 | children, variant, size |

### 能力缺口

| 缺失组件 | 当前页面中手写模式 | 影响页面数 |
|----------|-------------------|-----------|
| **List/ListItem** | 各页面手写 `<div className="...list-item">` | 8+ |
| **Panel/Section** | 各页面手写卡片容器 | 10+ |
| **Badge/徽标** | 内联 `<span>` + 页面 CSS | 4+ |
| **Tabs/TabBar** | HistoryLogsPage、SettingsPage 等处手写 | 3+ |
| **Tooltip** | 无或内联 title 属性 | 多处 |
| **Avatar** | LoginPage、ProfilePage 手写 | 2 |
| **Dropdown/Menu** | 未使用或内联 | 1-2 |

### 建议

- 高优先：抽取 `List/ListItem`，减少重复的列表容器手写
- 高优先：抽取 `Panel/Section`，统一页面分区容器
- 中优先：抽取 `Badge`、`Tabs`
- 低优先：`Tooltip`、`Avatar`、`Dropdown`

---

## 4. T020 — 业务组件边界判断

### 当前组件清单

| 组件 | 行数 | 子组件/导出数 | 边界清晰度 | 判断 |
|------|------|-------------|-----------|------|
| `today.tsx` | 291 | 11 个子组件 | **不清晰** | 过大，需拆分 |
| `common.tsx` | 72 | 3 个导出 | 清晰 | 合理 |
| `chat.tsx` | 62 | 3 个导出 | 清晰 | 合理 |
| `ContentListCard.tsx` | 57 | 1 个默认导出 | 清晰 | 合理 |

### `today.tsx` 详细分析

当前 `today.tsx` 承载了 11 个 Today 页面专属子组件：

- `TodaySection` / `TodaySectionHeader` — 页面分区容器（可归入 UI 基础组件 Panel）
- `TodayErrorState` / `TodayLoadingState` / `TodayEmptyCard` — 三态兜底（与 UI `EmptyState`/`LoadingSpinner`/`ErrorToast` 重叠）
- `TodaySummaryCard` / `TodayLeadCard` / `TodayContentCard` — 内容卡片（Today 专属，合理）
- `TodayFocusBar` / `TodayInfoBox` — 信息展示条（可泛化为 Badge/InfoBox）
- `TodayGrid` — 简单容器 wrapper

建议拆分为：
1. `TodayContentCard.tsx` + `TodaySummaryCard.tsx` + `TodayLeadCard.tsx`（Today 专属卡片，保留在 business/）
2. `TodayFocusBar` / `TodayInfoBox` → 评估是否泛化为 UI 基础组件
3. `TodaySection` / `TodayGrid` → 评估是否泛化为 UI 基础 `Panel` / `Grid`
4. 三态兜底 → 迁移到 UI 组件层 `EmptyState` / `LoadingSpinner` / `ErrorToast`

### 建议

- 重点：拆分 `today.tsx`（291 行 11 子组件 → 3-4 个独立文件 + UI 层归并）
- 保持：`common.tsx`、`chat.tsx`、`ContentListCard.tsx` 当前结构合理
