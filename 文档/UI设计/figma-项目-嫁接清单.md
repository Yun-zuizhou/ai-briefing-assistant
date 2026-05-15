# Figma → 项目 嫁接连载清单

> 每个组件的改动分为三级：
> - **L1 直接采用**：figma 的布局/结构直接在项目中实现（只改 CSS，不改逻辑）
> - **L2 融合改造**：figma 的视觉 + 项目的逻辑（组件结构保留，样式对齐 figma）
> - **L3 保留不动**：figma 没有或项目远优于 figma 的（不动）

---

## 0. 通用组件层（所有页面都会用到）

| Figma 组件 | 目标项目组件 | 级别 | 做什么 |
|-----------|-------------|------|--------|
| `PageHeader` | `Masthead` + `SecondaryHeader` | **L2** | 保留项目的装饰体系（ornament/divider/meta），但参考 figma 的 Header 结构：icon + title + subtitle + badge + actions 的排列方式更干净。把 Masthead 的 ornament 降为可选，默认用 figma 的简洁布局 |
| `PageContainer` | `PageLayout` + `PageContent` | **L2** | 保留项目的 layout variant 系统（main/secondary/auth/report），但内边距和间距参考 figma（`px-4 py-6 space-y-6`→你的 `page-stack gap:16px` 基本一致，不需大改） |
| `InfoCard (level A/B/C)` | `surfaces.css` 中的卡片体系 | **L1** | 这正是文档里定义的 A/B/C 容器密度——figma 把它实现成了组件 prop。在项目中把 `.card` / `.surface-hero` / `.page-notice-card` 统一到一个 `InfoCard` 组件 |
| `BottomNav` | `TabBar` | **L2** | 保留项目的 4 种 variant 和 localStorage 存储逻辑，但图标和布局参考 figma（Figma 的 nav 按钮排列更均匀） |
| `Card` | `ui/Card` | **L2** | 项目 Card 组件未使用。启用它，对齐 figma 的 variant 命名（default/bordered/elevated→保留，增加 outlined） |
| `Badge` | `Tag` + `StatusBadge` | **L2** | Figma 的 Badge 更灵活（6 variants + size）。项目中把 Tag 和 StatusBadge 合入一个 Badge 组件 |

---

## 1. /today 今日简报

| Figma 做得好的 | 级别 | 怎么做 |
|---------------|------|--------|
| Header 结构：Calendar 图标 + 日期 + 简报标题 + 进度 badge | **L1** | 直接用。替换当前 Masthead 的 ornament-heavy 结构 |
| Daily Summary 用 InfoCard B 级 | **L1** | 已经在文档规范里，但项目代码未执行。改成 `<InfoCard level="B">` |
| 主稿 + 分组阅读的卡片间距 | **L1** | Figma 的 `space-y-5` 间距更舒适，改 CSS |
| 条目的 action 按钮（收藏、追问、详情）排列 | **L1** | Figma 把 3 个按钮均匀排在卡片底部，比当前项目的单按钮好 |
| 值得行动区的 Badge 标记紧急度 | **L1** | 项目用文字标记，改用 Badge 组件 |

| 项目需要保留的 | 级别 | 为什么 |
|---------------|------|--------|
| 今日总述的编辑文案风格 | **L3** | Figma 用 mock 数据，项目有真实的 summaryText + moodTag |
| extensionSlots 辅助入口 | **L3** | Figma 只有简单的按钮，项目有追问/速记/收藏/回看四种入口 |
| quickNoteEntry 速记入口 | **L3** | Figma 没有 |
| AI 简报区块 | **L3** | Figma 没有，项目的 aiBriefing 是核心功能 |
| 数据新鲜度 freshness 元信息 | **L3** | Figma 没有 |

---

## 2. /chat 对话

| Figma 做得好的 | 级别 | 怎么做 |
|---------------|------|--------|
| Header：Sparkles 图标 + "AI 助手" + 状态 + 新对话/更多菜单 | **L1** | 替换当前装饰报头为功能导向的 header |
| 消息气泡的样式更干净 | **L1** | 保留项目的 assistant/user 双色体系，但调整 padding 和圆角对齐 figma |
| 快捷操作网格（对话短时显示 2×2 grid） | **L2** | 项目用 ModeChips 单行，改成 figma 的 grid 布局 |
| 输入框的 placeholder 和模式提示 | **L1** | Figma 的 placeholder 文案更好 |
| ConversationSummaryCard 内联显示 | **L2** | 项目在独立面板，figma 在对话流里。建议两个都保留：对话流里显示 compact 版，历史面板显示完整版 |

| 项目需要保留的 | 级别 | 为什么 |
|---------------|------|--------|
| 意图识别全部交互 | **L3** | PendingConfirmationCard、ResultSummaryCard、纠正按钮、changeLog——这是项目的灵魂 |
| 7 种 ChatMessageState | **L3** | Figma 只有 user/assistant，项目有完整状态机 |
| ComposeMode 系统 | **L3** | 项目的 5 种模式切换是核心功能 |
| 消息底部操作（复制/重新生成/删除） | **L3** | Figma 没有 |
| ChatEditorialShell 滚动联动报头 | **L3** | Figma 是静态 header |

---

## 3. /todo 待办

| Figma 做得好的 | 级别 | 怎么做 |
|---------------|------|--------|
| 统计概览 InfoCard（行动转化率 + 数字） | **L1** | 项目没有这个总览块，加上 |
| 筛选按钮（全部/待完成/已完成）的 pill 样式 | **L1** | 项目用文字 tab，改成 figma 的 pill button |
| 待办卡片的结构：checkbox + 标题 + 描述 + 截止日 badge + 来源 | **L1** | 比项目当前的紧凑列表更清晰 |
| 已完成项的视觉区分（strikethrough + muted） | **L1** | 项目有状态但视觉差异不够 |

| 项目需要保留的 | 级别 | 为什么 |
|---------------|------|--------|
| 签到打卡区 | **L3** | Figma 没有，项目有 checkedInToday + streakDays |
| 提醒摘要 | **L3** | Figma 没有 |
| 收藏待处理 + 机会跟进 | **L3** | Figma 合并成了简单的待办列表 |
| 优先行动 + 建议下一步 | **L3** | Figma 没有 |

---

## 4. /growth 成长

Figma 对这个页面投入了大量设计，整体布局和信息架构明显优于项目当前版本。**整个页面的区块组织方式应该全盘采纳**，然后在每个区块中接入项目的真实数据和逻辑。

### 页面整体结构（从 figma 采纳）

```
PageHeader（用户画像摘要）
  ├── 头像 + persona 标签 + 特质进度条 + 关键词标签
  └── Badge：优秀/良好

PageContainer
  ├── 打卡记录 InfoCard (B级)
  │   ├── 连续天数 + 累计打卡
  │   └── 本周 7 天勾选格
  ├── 数据概览 Section
  │   └── 2×2 grid：已读文章 / 完成待办 / 连续天数 / 行动转化率
  ├── 个人洞察 Section
  │   └── 洞察卡片列表（正面/建议分类 + Badge）
  └── 关注领域分布 Section (B级)
      └── 条形图列表（领域名 + 篇数 + 百分比 + 进度条）
```

### 逐区块嫁接方案

| Figma 区块 | 级别 | 怎么做 | 数据从哪来 |
|-----------|------|--------|-----------|
| Header：头像 + persona 标签 + 特质进度条 | **L1** | 直接用。persona 标签用 `persona.personaSummary` 的前 6 字；特质条用静态预设（学习力/执行力/探索欲等），数值从 growth 数据计算 | `GrowthOverviewData.persona` + `keywords` |
| 关键词标签区 + 管理入口 | **L1** | 直接用。keywords 渲染为 Badge，"管理"链接到 `/interest-config` | `GrowthOverviewData.keywords` |
| 打卡记录 InfoCard（B级） | **L1** | 直接用。连续天数 + 累计打卡 + 7 天勾选格 | `ActionsOverviewData.checkedInToday` + `streakDays`（需要补一个 weekly 打卡数组） |
| 数据概览 2×2 grid | **L1** | 直接用。数字来自真实数据 | `GrowthOverviewData` 的 stats + `ActionsOverviewData` |
| 个人洞察卡片（正面/建议分类） | **L2** | 结构采纳，文案由项目后端生成或规则推导 | 当前数据不足，需要新增一个简单的规则引擎或 LLM 生成 |
| 关注领域分布条形图 | **L1** | 直接用。百分比从 keywords 的 weight 计算 | `GrowthOverviewData.keywords`（需要增加 count 字段或从其他数据汇总） |

| 项目需要保留的 | 级别 | 为什么 |
|---------------|------|--------|
| 本周总述文案 | **L3** | Figma 用 mock 数据，项目的 `weeklySummary.growthSummary` 是真实内容 |
| 人格画像详情（personaSummary + personaVersion + updatedAt） | **L3** | 保留在 `/profile` 详情页，growth 页只放摘要 |
| 报告入口（周报/月报/年报） | **L3** | Figma 挪到了 MePage，但 growth 页底部放报告入口更合理——读完成长数据直接看报告 |
| 近期历史项 | **L3** | Figma 没有，保留在 growth 页底部 |

---

## 5. /me 我的

| Figma 做得好的 | 级别 | 怎么做 |
|---------------|------|--------|
| 头像 + 用户名 + 加入日期 + 统计三数字 | **L1** | 比项目当前的简单文字好 |
| 菜单项的结构：icon + label + description + badge + chevron | **L1** | 项目的 NavigationEntryCard 结构类似但不如 figma 的丰富 |
| 分组标题 + 分组卡片 | **L1** | 项目已有分组，但视觉不够清晰 |
| 退出登录放在底部 | **L1** | 项目已有，位置一致 |

| 项目需要保留的 | 级别 | 为什么 |
|---------------|------|--------|
| 装饰页脚 | **L3** | Figma 没有，项目的 PageFooterDecorative 是风格特征 |
| DEV 模式下的系统诊断入口 | **L3** | Figma 没有 |

---

## 6. /collections 收藏（新增子页面）

| Figma 做得好的 | 级别 | 怎么做 |
|---------------|------|--------|
| 类型筛选 pill（全部/文章/话题/对话） | **L1** | 直接采用。项目目前没有筛选 |
| 搜索框 + tag 搜索 | **L1** | 直接采用 |
| 收藏卡片的 hover 操作（分享/删除） | **L2** | 保留项目的 ConfirmModal 确认删除，hover 时显示操作按钮 |
| Badge 标记类型 | **L1** | 直接采用 |

| 项目需要保留的 | 级别 | 为什么 |
|---------------|------|--------|
| 4 种可收藏对象（内容/对话/记录/报告） | **L3** | Figma 只有 3 种，缺少记录和报告 |
| ConfirmModal 删除确认 | **L3** | Figma 直接删除没有确认 |

---

## 7. /conversation-history 对话历史（新增子页面）

| Figma 做得好的 | 级别 | 怎么做 |
|---------------|------|--------|
| ConversationCalendar 日历组件 | **L1** | 直接采用双模式设计。项目没有日历组件 |
| 折叠式日期分组 + 总结优先 | **L1** | 项目的 historyLogs 是平铺列表，改用折叠分组 |
| 日历中圆点标记（有总结 vs 有对话） | **L1** | 直接采用 |

| 项目需要保留的 | 级别 | 为什么 |
|---------------|------|--------|
| historyLogs 的事件轨迹（系统日志） | **L3** | Figma 只有对话，没有系统操作日志。两者并存：日历视图看对话，日志视图看操作 |
| historyBrief 的周期报告入口 | **L3** | Figma 只有对话历史 |

---

## 执行优先级

### 第一批（CSS 级改动，最快见效）
1. 通用组件：InfoCard A/B/C 体系、Badge 合并、Card 启用
2. 5 个主页面：间距、布局对齐 figma（改 CSS，不动逻辑）
3. 所有页面的 Header：参考 figma 结构简化 Masthead

### 第二批（新增组件）
4. ConversationCalendar 日历组件
5. Collections 筛选 + 搜索
6. Growth 打卡热力图

### 第三批（交互升级）
7. Chat 消息气泡样式对齐 + 快捷操作 grid
8. Todo 统计总览 InfoCard
9. Me 菜单项样式升级
