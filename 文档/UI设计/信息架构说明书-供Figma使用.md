# 信息架构说明书 — 供 Figma 设计使用

> 本文档定义每个页面的**内容字段、数据来源、与其他页面的关联**。
> 阅读顺序：先看"主链路全景图"建立整体认知，再做单页设计时查阅对应页面的数据卡片。

---

## 1. 主链路全景图

```text
┌─────────────────────────────────────────────────────┐
│                    进入与配置层                        │
│  /welcome → /login → /interest-config → /settings   │
└──────────────────────────┬──────────────────────────┘
                           │ 完成后进入主链路
┌──────────────────────────▼──────────────────────────┐
│                    每日主链路（底部导航）                │
│                                                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ 今日简报 │  │  对话   │  │  待办   │  │  成长   │  │
│  │ /today  │→│  /chat  │  │  /todo  │  │/growth  │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │
│       │            │            │            │        │
│  ┌────┴────┐       │       ┌────┴────┐       │        │
│  │ 我的    │←──────┴───────┴─────────┴───────┘        │
│  │  /me    │                                          │
│  └─────────┘                                          │
└─────────────────────────────────────────────────────┘
                           │ 从主链路进入
┌──────────────────────────▼──────────────────────────┐
│                    深层页面                            │
│                                                       │
│  内容阅读：/article ← 从 today / hot-topics 进入       │
│  热点探索：/hot-topics                                 │
│  收藏管理：/collections                                │
│  报告回看：/weekly-report, /monthly-report,            │
│           /annual-report ← 从 growth / me 进入         │
│  个人画像：/profile ← 从 me / growth 进入              │
│  日志回顾：/journal ← 从 me 进入                       │
│  历史记录：/history-brief, /history-logs              │
│  设置详情：/ai-provider-settings,                      │
│           /notification-settings ← 从 settings 进入     │
│  帮助关于：/help-feedback, /about                      │
└─────────────────────────────────────────────────────┘
```

**页面间数据传递**：内容引用通过 `contentRef`（全局唯一标识）跨页面传递。用户在 today 看到一篇文章 → 点击进入 /article（带 contentRef）→ 在 article 页追问 → 跳转 /chat（带 `sourceContentRef` 和 `presetInput`）。

---

## 2. 每个页面的数据卡片

### 2.1 /today — 今日简报（最核心页面）

**页面职责**：用户每天的第一眼。把后台聚合好的今日内容，按编辑优先级呈现给用户。

**内容区块与阅读顺序**（从上到下）：

| 序号 | 区块 | 数据字段 | 数据来源 | 说明 |
|------|------|----------|----------|------|
| 1 | 定位层 | `dateLabel`, `issueNumber` | `TodayPageData` | 日期、期号（如"第 47 期"） |
| 2 | 总述层 | `summary.summaryText`, `summary.moodTag` | `TodayPageData.summary` | 一段话概括今日内容全貌 |
| 3 | 主稿层 | `leadItem` | `TodayPageData.leadItem` | 今日最重要的一条，含标题+摘要+来源标签+主动作按钮 |
| 4a | AI简报区 | `aiBriefing` | `TodayPageData.aiBriefing` | LLM 生成的简报：引语+话题簇+推荐理由+不确定性说明。仅在 `aiBriefing.status === 'success'` 时显示 |
| 4b | 关注推荐 | `recommendedForYou[]` | `TodayPageData.recommendedForYou` | 按关注领域分组，每组有 `interestName` + `recommendationReason` + `topItems[]` |
| 4c | 值得知道 | `worthKnowing[]` | `TodayPageData.worthKnowing` | 按兴趣匹配的内容条目，每条有标题+摘要+来源+关联理由 |
| 4d | 值得行动 | `worthActing[]` | `TodayPageData.worthActing` | 可行动机会，每条有动作类型(apply/follow/submit/read_later/create_todo)+截止日+回报+下一步标签 |
| 5 | 辅助入口 | `extensionSlots[]` | `TodayPageData.extensionSlots` | 追问/速记/收藏/回看四种入口，每种带标题+描述+actionLabel |
| — | 速记入口 | `quickNoteEntry` | `TodayPageData.quickNoteEntry` | 一句话输入框，placeholder 是引导文案 |
| — | 数据新鲜度 | `freshness` | `TodayPageData.freshness` | 最新发布时间+来源数量（只做底部小字元信息，不抢占阅读区） |

**跳转关系**：

| 触发点 | 目标页面 | 携带数据 |
|--------|----------|----------|
| 点击推荐条目 / 值得知道条目 | `/article` | `contentRef` |
| 点击值得行动条目 | `/article` 或直接 `/todo` | `contentRef` 或 `actionType` |
| 点击"追问"辅助入口 | `/chat` | `sourceContentRef` + `presetInput` |
| 点击"速记"辅助入口 | 页面内输入框 | — |
| 点击"转待办"辅助入口 | `/todo` | `contentRef` |

**后端 API**：`apiService.getTodayPageData()` → `GET /api/v1/dashboard/today`

**状态覆盖**：
- 加载态：页面骨架（报头+摘要占位+卡片骨架）
- 空内容态（`worthKnowing.length === 0`）：引导文案 + "更新关注领域"按钮
- 部分数据态（`processingStage === 'partial'`）：标记"数据收束中"
- AI简报降级态（`aiBriefing.status === 'fallback'`）：显示规则生成的摘要，不显示置信度说明
- 错误态：重试按钮 + 错误原因

---

### 2.2 /chat — AI 对话助手

**页面职责**：用户用自然语言表达意图（记录想法、创建待办、追问简报内容、修改设置），AI 理解意图后执行对应操作。是最低成本的表达入口。

**内容区块**：

| 序号 | 区块 | 数据字段 | 数据来源 | 说明 |
|------|------|----------|----------|------|
| 1 | 报头 | — | 组件 | 编辑报头，显示"对话"标题 |
| 2 | 会话列表（侧栏） | `sessions[]` | `useChatLogic` | `ChatSessionSummary[]`，每项含 sessionId/title/status/消息数/最后活动时间 |
| 3 | 消息列表 | `messages[]` | `useChatLogic` | `ChatSessionMessage[]`，每条含 role(assistant\|user)/content/状态/意图 |
| 3a | 用户消息 | `role === 'user'` | — | 朱红底色气泡，白色文字 |
| 3b | 助手消息 | `role === 'assistant'` | — | 暖纸底色气泡。状态有7种：sending/recognized/pending_confirmation/confirmation/executed/error |
| 3c | 意图确认卡片 | `pendingConfirmation` | — | 当 AI 不确定意图时显示，列出候选意图供用户选择 |
| 3d | 执行结果卡片 | `latestActionSummary` | — | 操作执行后的结果摘要+变更日志+下一步链接 |
| 4 | 模式切换 | `composeMode` | — | "自由模式"/"记录模式"切换 |
| 5 | 输入区 | — | — | 文本输入框 + 发送按钮 + 快捷操作按钮 |

**消息中的关键信息**（设计时需展示）：

| 字段 | 显示位置 | 说明 |
|------|----------|------|
| `content` | 气泡主体 | 消息正文 |
| `messageState` | 气泡旁标签 | 当前状态（发送中/已识别/等待确认/已执行/出错） |
| `intentType` | 状态标签 | 识别到的意图类型（记录/待办/收藏/追问/设置） |
| `confidence` | 可选显示 | 意图置信度（内部使用，仅在调试页显示） |
| `resultSummary` | 结果卡片 | 操作执行后的自然语言摘要 |
| `deepLink` + `nextPageLabel` | 结果卡片底部 | 跳转到受影响页面的链接 |
| `changeLog[]` | 结果卡片内 | 实体变更列表（创建了哪些 todo/note/favorite） |

**跳转关系**：

| 触发点 | 目标 | 说明 |
|--------|------|------|
| 点击执行结果的 deepLink | `/todo`, `/journal`, `/collections` 等 | 跳转到受影响的实体页面 |
| 点击快捷操作 | 页面内 | 触发对应 intent |
| 页面加载时携带 `actionContext` | 页面内 | 从其他页面带入的预设输入和内容引用 |

**后端 API**：
- `POST /api/v1/chat/stream` — SSE 流式对话
- `GET /api/v1/chat/sessions` — 会话列表
- `GET /api/v1/chat/sessions/:id` — 会话消息
- `POST /api/v1/chat/confirm` — 确认意图
- `POST /api/v1/chat/reclassify` — 重新分类意图

**状态覆盖**：
- 空会话态：引导文案 + 自由输入框 + 模式说明
- 发送中：loading 动画
- 意图确认中：PendingConfirmationCard
- 执行成功：ResultSummaryCard + 跳转链接
- 执行失败：错误消息 + 重试
- 历史记录视图：消息列表 + 只读模式

---

### 2.3 /todo — 待办与行动管理

**页面职责**：用户管理待办事项、收藏待处理、机会跟进。是"阅读后的行动沉淀"。

**内容区块**：

| 序号 | 区块 | 数据字段 | 数据来源 | 说明 |
|------|------|----------|----------|------|
| 1 | 报头 | — | 组件 | 主页面报头"待办" |
| 2 | 筛选栏 | `filter` | 页面状态 | today / future / completed 三标签切换 |
| 3a | 今日待办 | `todayTodos[]` | `ActionsOverviewData` | `ActionTodoItem[]`，每项含标题/来源/截止标签/优先级/完成状态 |
| 3b | 后续待办 | `futureTodos[]` | `ActionsOverviewData` | 同上，非今日截止 |
| 3c | 已完成 | `completedTodos[]` | `ActionsOverviewData` | 同上，已完成 |
| 4 | 收藏待处理 | `savedForLater[]` | `ActionsOverviewData` | `SavedItem[]`，每项含标题/类型/来源/保存时间 |
| 5 | 机会跟进 | `followingItems[]` | `ActionsOverviewData` | `FollowingItem[]`，每项含标题/状态(new/watching/applied/waiting/completed)/截止日/进度/下一步 |
| 6 | 今日签到 | `checkedInToday`, `streakDays` | `ActionsOverviewData` | 签到状态+连续天数 |
| 7 | 优先行动 | `topPriority` | `ActionsOverviewData` | 最优先的1条建议行动 |
| 8 | 建议下一步 | `suggestedNextActions[]` | `ActionsOverviewData` | 多项建议行动 |
| 9 | 提醒摘要 | `reminderSummary` | `ActionsOverviewData` | 推送时间+即将提醒列表+免打扰状态 |

**跳转关系**：

| 触发点 | 目标 | 携带数据 |
|--------|------|----------|
| 点击待办项 | 详情/对话 | `todoId` |
| 点击收藏项 | `/article` | `contentRef` |
| 点击跟进项 | 详情 | `followId` |
| 点击优先行动 | 对应 deepLink | 由 `topPrimary.deepLink` 决定 |

**后端 API**：`apiService.getActionsOverview()` → `GET /api/v1/actions/overview`

**状态覆盖**：
- 加载态：骨架
- 空待办态：引导文案（"你还没有待办事项。可以从简报中把值得行动的内容转为待办"）
- 空收藏态：引导文案
- 空跟进态：引导文案
- 签到已完成态：签到按钮变为对勾 + "已签到 · 连续 N 天"
- 错误态：重试

---

### 2.4 /growth — 个人成长画像

**页面职责**：展示用户的成长轨迹——关键词变化、人格画像、历史足迹、报告入口。

**内容区块**：

| 序号 | 区块 | 数据字段 | 数据来源 | 说明 |
|------|------|----------|----------|------|
| 1 | 报头 | — | 组件 | 编辑报头"成长"（带黄历副标题） |
| 2 | 本周总述 | `weeklySummary` | `GrowthOverviewData` | 本周成长摘要 + 活跃兴趣变化 + 完成行动数 + 新增笔记数 |
| 3 | 关键词 | `keywords[]` | `GrowthOverviewData` | `GrowthKeywordItem[]`，每项含关键词/权重/趋势(up/down/stable) |
| 4 | 人格画像 | `persona` | `GrowthOverviewData` | `PersonaSnapshot`，含画像摘要+版本+更新时间 |
| 5 | 行动快照 | `checkedInToday`, `streakDays`, `completedTodos` | 通过 `ActionsOverviewData` 获取 | 签到状态+连续天数+已完成数 |
| 6 | 近期历史 | `recentHistoryItems[]` | `GrowthOverviewData` | `HistoryPreviewItem[]`，每项含类型(briefing/journal/action)+标题+日期 |
| 7 | 报告入口 | `reports[]` | `GrowthOverviewData` | `ReportEntryItem[]`：周报/月报/年报入口（available 标记是否可用） |

**跳转关系**：

| 触发点 | 目标 | 携带数据 |
|--------|------|----------|
| 点击周报入口 | `/weekly-report` | — |
| 点击月报入口 | `/monthly-report` | — |
| 点击年报入口 | `/annual-report` | — |
| 点击历史项 | history 对应页面 | — |
| 点击"查看完整画像" | `/profile` | — |

**后端 API**：
- `apiService.getGrowthOverview()` → `GET /api/v1/dashboard/growth`
- `apiService.getActionsOverview()` → `GET /api/v1/actions/overview`（获取签到和待办统计）

**状态覆盖**：
- 加载态：骨架
- 数据不足态：显示 fallback 文案（"这一阶段你已经把信息输入逐步转成了真实的记录与历史痕迹……"）
- 报告不可用态（`available === false`）：入口灰色，提示"暂无数据"

---

### 2.5 /me — 我的（个人中心）

**页面职责**：个人信息的导航中枢。展示基本信息+功能入口分组。

**内容区块**：

| 序号 | 区块 | 数据字段 | 数据来源 | 说明 |
|------|------|----------|----------|------|
| 1 | 报头 | — | 组件 | 编辑报头"我的" |
| 2 | 用户信息 | `username`, `email` | `AppContext.user` | 显示名+邮箱+头像首字母 |
| 3 | 入口分组1：系统设置 | 入口列表 | 页面内静态定义 | 设置 / AI服务设置 / 通知偏好（开发模式额外显示系统诊断） |
| 4 | 入口分组2：支持 | 入口列表 | 页面内静态定义 | 帮助反馈 / 关于 |
| 5 | 退出登录 | — | — | 退出按钮 |

每个入口项的数据结构：`{ label, description, path }`

**跳转关系**：

| 触发点 | 目标 |
|--------|------|
| 设置 | `/settings` |
| AI服务设置 | `/ai-provider-settings` |
| 通知偏好 | `/notification-settings` |
| 系统诊断（仅DEV） | `/system-diagnostics` |
| 帮助反馈 | `/help-feedback` |
| 关于 | `/about` |
| 退出登录 | 清除登录态 → `/welcome` |

**后端 API**：无独立 API，数据来自全局 `AppContext`。

**状态覆盖**：
- 未登录态：重定向到 `/welcome`
- DEV 模式：额外显示"系统诊断"入口

---

### 2.6 /article — 文章阅读详情

**页面职责**：内容深度阅读。展示原文/摘要/元信息/AI摘要，并提供追问、收藏、分享等行动入口。

**内容区块**：

| 序号 | 区块 | 数据字段 | 数据来源 | 说明 |
|------|------|----------|----------|------|
| 1 | 二级报头 | — | 组件 | 带返回按钮的报头 |
| 2 | 元信息 | `sourceName`, `publishedAt`, `author`, `categoryLabels[]`, `tags[]` | `UnifiedContentDetailData` | 来源/日期/作者/分类标签/标签 |
| 3 | 标题 | `title` | `UnifiedContentDetailData` | 文章主标题 |
| 4 | 正文/摘要 | `content` 或 `summary` | `UnifiedContentDetailData` | `detailState === 'formal'` 显示正文，`'partial'` 显示摘要 |
| 5 | AI摘要 | — | 异步获取 | 结构化的 AI 摘要（可选） |
| 6 | 相关推荐 | `relatedItems[]` | `UnifiedContentDetailData` | 相关条目列表，每项含标题/摘要/来源/关联原因 |
| 7 | 行动入口 | — | 页面内 | 打开原文/追问/收藏/分享 |

**跳转关系**：

| 触发点 | 目标 | 携带数据 |
|--------|------|----------|
| 打开原文 | 外部浏览器 | `sourceUrl` |
| 追问 | `/chat` | `sourceContentRef` + `sourceTitle` + `presetInput` |
| 收藏 | 页面内操作 | 调用收藏 API |
| 点击相关推荐 | `/article` | 新的 `contentRef` |
| 返回 | 来源页面 | — |

**后端 API**：`GET /api/v1/content/detail?contentRef=xxx`

**状态覆盖**：
- 加载态：骨架
- 内容不完整态（`detailState === 'partial'`）：标注"部分内容" + 缺失字段说明
- 无AI摘要态：不显示AI摘要区块
- 无相关推荐态：不显示相关推荐区块
- 错误态：重试

---

### 2.7 /hot-topics — 热点探索

**页面职责**：浏览公共热点话题，发现新内容。

**内容区块**：

| 序号 | 区块 | 数据字段 | 数据来源 | 说明 |
|------|------|----------|----------|------|
| 1 | 二级报头 | — | 组件 | 带返回按钮 |
| 2 | 热点列表 | `items[]` | `HotTopicListItem[]` | 每项含标题/摘要/来源/分类/标签/热度值/质量分/发布时间 |

**跳转**：点击条目 → `/article`（带 `contentRef`）

**后端 API**：`GET /api/v1/content/hot-topics`

**状态覆盖**：加载态、空数据态、错误态。

---

### 2.8 /journal — 日志回顾

**页面职责**：查看个人的记录、速记、表达的历史沉淀。

**内容区块**：

| 序号 | 区块 | 数据字段 | 数据来源 | 说明 |
|------|------|----------|----------|------|
| 1 | 二级报头 | — | 组件 | — |
| 2 | 统计摘要 | `summary` | `JournalOverviewData` | 表达次数/进展项数/沉淀项数/回看次数 + 摘要文案 |
| 3 | 最近笔记 | `recentNotes[]` | `JournalOverviewData` | `NoteApiItem[]`，每项含内容/来源类型/标签/时间 |
| 4 | 进展项 | `progressItems[]` | `JournalOverviewData` | 每项含标题/元信息/详情/链接 |
| 5 | 沉淀项 | `keptItems[]` | `JournalOverviewData` | 每项含标题/来源/详情/时间 |
| 6 | 回看区 | `review` | `JournalOverviewData` | 可回看数量+关键词+摘要 |

**后端 API**：`GET /api/v1/behavior/journal`

---

### 2.9 /collections — 收藏管理

**页面职责**：管理用户主动收藏的所有内容。按收藏类型分组展示。

**核心规则**：任何用户主动标记"我想保留/回看这个"的东西，都可以被收藏。收藏不是自动的，是用户主动触发的。

**4 种可收藏对象**：

| 类型 | 含义 | 从哪里收藏 | 收藏后在收藏区显示什么 |
|------|------|-----------|---------------------|
| 内容卡 | 一篇文章/热点/机会 | /today 条目、/hot-topics 列表、/article 详情页 | 标题 + 来源 + 摘要 + 原始链接 |
| 对话卡 | 一轮与 AI 的对话结果 | /chat ResultSummaryCard 底部 | 对话标题 + 日期 + 关键结论摘要 |
| 记录卡 | 用户随手记的一个想法 | /journal 记录卡右下角 | 记录内容 + 日期 + 来源标签 |
| 报告卡 | 一期周报/月报/年报 | /weekly-report 等报告页顶部 | 报告标题 + 周期 + 核心数据摘要 |

**每个页面需要加"收藏入口"的位置**：

| 页面 | 收藏什么 | 入口位置 |
|------|----------|----------|
| /article 文章详情 | 内容卡 | 文章标题右侧/底部操作栏 |
| /today 今日简报 | 内容卡（每条条目） | 条目卡右上角收藏图标 |
| /hot-topics 热点 | 内容卡（每条话题） | 话题卡右上角收藏图标 |
| /chat 对话 | 对话卡（执行结果后） | ResultSummaryCard 底部操作行，加"收藏这轮对话" |
| /journal 日志 | 记录卡（每条记录） | 记录卡右下角 |
| /weekly-report /monthly-report /annual-report | 报告卡 | 报告页顶部，标题旁"收藏本期" |

**内容区块**：

| 序号 | 区块 | 说明 |
|------|------|------|
| 1 | 二级报头 | 带返回按钮 |
| 2 | 类型筛选 | 全部 / 文章 / 对话 / 记录 / 报告 |
| 3 | 收藏列表 | 按筛选类型展示对应卡片。文章和记录用 ContentCard 样式；对话和报告用 SummaryCard 样式 |
| 4 | 单项操作 | 每个收藏项可删除，可点击跳转回原始出处 |

**收藏卡片结构**：

| 卡片中的信息 | 说明 |
|-------------|------|
| 类型标签 | 文章 / 对话 / 记录 / 报告 |
| 标题 | 原文标题 / 对话简介 / 记录内容首句 / 报告标题 |
| 来源/出处 | 来源名称 / 对话日期 / 记录日期 / 报告周期 |
| 收藏时间 | 用户点击收藏的时间 |
| 操作 | 删除收藏 / 查看原文 |

**后端 API**：`GET /api/v1/favorites`、`POST /api/v1/favorites`、`DELETE /api/v1/favorites/:id`

**状态覆盖**：
- 加载态：骨架
- 空收藏态（无任何收藏）：引导文案（"你还没有收藏任何内容。可以在简报、对话、日志中收藏你感兴趣的内容。"）
- 某类型为空态（如"无收藏的对话"）：该分组显示空提示

---

### 2.10 /profile — 个人画像详情

**页面职责**：详细的个人画像页，展示用户兴趣、行为模式、成长轨迹。

**内容区块**：

| 序号 | 区块 | 数据字段 | 说明 |
|------|------|----------|------|
| 1 | 二级报头 | — | — |
| 2 | 画像摘要 | 从 `GrowthOverviewData.persona` | 人格画像 |
| 3 | 关键词云 | `keywords[]` | 兴趣关键词及趋势 |

**后端 API**：`GET /api/v1/dashboard/growth`（复用成长页数据）

---

### 2.11 报告页组 — /weekly-report, /monthly-report, /annual-report

**页面职责**：周期性数据报告，展示统计、趋势、洞察和行动建议。

**内容区块**：

| 序号 | 区块 | 数据字段 | 说明 |
|------|------|----------|------|
| 1 | 报告报头 | `reportTitle`, `periodStart`, `periodEnd`, `generatedAt` | 报告标题+周期+生成时间 |
| 2 | 生成来源标记 | `generationSource` | 'rules'（规则生成）或 'llm'（AI生成） |
| 3 | 数据总览 | `overview` / `stats` | 关键数字（查看了/记录了/收藏了/完成了+连续天数） |
| 4 | 话题趋势 | `topicTrends[]`（周报/月报） | 每项含图标/标题/热度数据/热点事件/洞察/关注变化 |
| 5 | LLM 生成内容 | `llmBlocks` / `annualLlmBlocks` | AI 趋势解读+周期总结+下一步行动+证据索引 |
| 6 | 成长数据 | `growth`（周报/月报） | 数据统计+与上期对比+成长轨迹+精选想法+建议 |
| 7 | 关键词 | `keywords[]`（年报） | 年度关键词 |
| 8 | 兴趣变化 | `interests[]`（年报） | 年度兴趣分布 |
| 9 | 思考与行动（年报） | `thinkingSection`, `actionSection`, `closing` | 年度思考+行动回顾+总结寄语 |
| 10 | 数据质量 | `dataQuality` | 数据置信度(低/中/高)+不足标记+证据说明 |

**后端 API**：
- `GET /api/v1/reports/weekly`
- `GET /api/v1/reports/monthly`
- `GET /api/v1/reports/annual`

**状态覆盖**：
- 数据不足态（`dataQuality.insufficientData === true`）：提示数据量不够
- rules/llm 两种生成态的展示差异
- 无对比数据态（`comparison === null`）：不显示对比图表

---

### 2.12 /settings — 设置导航页

**页面职责**：设置项的总入口页，展示当前配置状态的摘要。

**内容区块**：

| 序号 | 区块 | 说明 |
|------|------|------|
| 1 | 二级报头 | — |
| 2 | AI服务摘要 | 当前 provider/model 摘要，入口到 `/ai-provider-settings` |
| 3 | 通知摘要 | 推送时间+免打扰状态摘要，入口到 `/notification-settings` |
| 4 | 关注配置入口 | 入口到 `/interest-config` |

**后端 API**：`GET /api/v1/preferences`

---

### 2.13 /interest-config — 关注配置页

**页面职责**：用户首次使用或后续调整时，配置自己的关注领域和兴趣。

**内容区块**：

| 序号 | 区块 | 说明 |
|------|------|------|
| 1 | 报头 | 引导式报头 |
| 2 | 兴趣选择区 | 可选/已选的兴趣标签组 |
| 3 | 确认按钮 | 保存并进入主流程 |

**后端 API**：`PUT /api/v1/preferences/interests`

---

### 2.14 /ai-provider-settings — AI 服务设置

**页面职责**：配置 LLM provider 和模型偏好。属于高级配置，不应成为普通用户主路径。

**后端 API**：`PUT /api/v1/preferences/ai-provider`

---

### 2.15 /notification-settings — 通知设置

**页面职责**：配置简报推送时间、免打扰时段和提醒方式。

**后端 API**：`PUT /api/v1/preferences/notifications`

---

### 2.16 辅助页面

| 页面 | 路由 | 职责 | 数据 |
|------|------|------|------|
| 欢迎页 | `/welcome` | 首次进入引导，产品介绍 | 静态内容 |
| 登录页 | `/login` | 账号登录/注册 | 表单 |
| 帮助反馈 | `/help-feedback` | FAQ + 反馈表单 | 静态 + 提交 API |
| 关于 | `/about` | 产品说明与版本 | 静态 |
| 历史简报 | `/history-brief` | 历史简报回顾 | `GET /api/v1/history/brief` |
| 历史日志 | `/history-logs` | 历史操作日志 | `GET /api/v1/history/logs` |

---

## 3. 跨页面数据流

### 3.1 核心引用链

```text
contentRef（全局内容标识符）贯穿整个产品：

后台聚合 → today.worthKnowing[].contentRef
                  → 点击 → /article?contentRef=xxx
                           → 追问 → /chat (sourceContentRef=xxx)
                                    → 执行动作 → /todo (新增待办, contentRef=xxx)
                           → 收藏 → /collections (新增收藏, contentRef=xxx)
                           → 速记 → /journal (新增笔记, contentRef=xxx)
```

### 3.2 用户闭环数据

```text
关注配置(/interest-config) → 兴趣标签
  ↓
今日简报(/today) → 按兴趣推荐内容
  ↓
阅读 + 行动(/article, /chat, /todo) → 行为日志
  ↓
沉淀(/journal, /collections) → 记录+收藏
  ↓
周期回顾(/growth, /reports) → 画像更新
  ↓
反哺次日简报（兴趣权重调整）
```

---

## 4. 设计时需要展示的关键状态

每个页面都至少需要覆盖以下状态，不能只设计"理想态"：

| 状态 | 说明 | 典型场景 |
|------|------|----------|
| 理想态 | 数据完整且可用 | 正常使用中 |
| 加载态 | 页面骨架/占位符 | 数据获取中 |
| 空内容态 | 无数据但有引导 | 新用户第一天使用 |
| 部分数据态 | 数据不完整 | 后台聚合未完成 |
| 降级态 | LLM 不可用时的替代 | AI简报降级为规则生成 |
| 错误态 | 数据获取失败 | 网络错误/服务不可用 |
| 极端内容态 | 标题过长/摘要过长/标签过多 | 需要截断或折叠 |

---

## 5. 与 Figma 设计直接相关的约束

1. **内容不是 Lorem ipsum** — 每个区块的文案必须反映真实的信息层级和编辑语气。参考 `文档/UI设计/` 下各页面的 UX 规格文档中的文案示例。

2. **阅读顺序 > 视觉对齐** — 用户是按"定位→总述→主稿→分组→辅助"的顺序消费信息，设计稿的信息架构必须体现这个优先级。

3. **每个区块的数据字段有明确定义**（见第2节），不要在设计中添加不存在的字段，也不要遗漏已定义的字段。

4. **页面间有数据传递关系**（contentRef, sourceContext），设计跳转交互时需要考虑这些参数如何携带。

5. **设计 tokens 在 `design-md/DESIGN.md`** — 颜色/字体/间距/圆角/阴影/动画/装饰密度均已在 YAML 中定义，设计时直接引用。
