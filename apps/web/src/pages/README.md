# Page Contracts

Pages are product interfaces, not styling containers. Each core page must state its
UX intent, data owner, frontend API entry, component owner, style owner, and non-goals.

Current UX planning entry:

- `文档/进行中/2026-05-01-UX主流程与页面职责规划.md`
- `文档/进行中/2026-05-01-UX收口索引与开发检查清单.md`

Use this order when changing a page:

1. Use the UX checklist to decide whether the change actually needs UX review.
2. Update this page contract when the user task, hierarchy, or data need changes.
3. Update shared contracts when the page needs new backend data.
4. Update backend domain services and routes.
5. Update `services/apiDomains/*` and expose through `services/api.ts`.
6. Update the page composition through component public interfaces.
7. Put styles in the owning stylesheet instead of `index.css`.

For a new managed page, start from:

- `tools/templates/page/Page.template.tsx`
- `tools/templates/page/usePageLogic.template.ts`
- `tools/templates/page/PageStyle.template.css`
- For information-dense pages, use `tools/templates/information-page/*` instead of
  inventing a page-local reading structure.

Do not invent a fresh page structure before checking whether the template already covers
the page shell, loading/error/empty states, page-owned class prefix, and page logic hook.

## Information-Dense Pages

Use the information page template for pages like Briefing, Reports, Hot Topics, Growth,
and any page that mixes many content items, generated summaries, metadata, and actions.

The required reading contract is:

1. Overview: what changed overall, written for the user.
2. Primary story: the single most important item.
3. Grouped reading: user-facing groups and their report cards.
4. Auxiliary entries: notes, chat entry, follow-up actions, or secondary navigation.
5. Hidden processing data: provider/model names, debug seeds, ranking internals,
   raw recommendation explanations, processing traces, and other metadata.

Do not map backend fields one-to-one into sections. Page logic should translate raw data
into this reading contract before JSX renders it.

## TodayPage / Briefing

- Route: `/today`, implemented by `TodayPage.tsx`.
- UX intent: present a daily personal briefing, like a newspaper, with headline summary, user-interest reports, selected public hotspots, quick note, and conversation entry.
- Product name: 简报. Keep the technical route/component name until a dedicated rename is worth the migration cost.
- Single-page UX spec: `文档/进行中/2026-05-01-BriefingPage简报页UX规格.md`.
- Primary hierarchy: masthead, headline summary, interest-area reports, selected hotspots, quick note, briefing-scoped conversation entry.
- Required states: loading, empty/fallback, load error, ready with generated briefing, ready without generated briefing.
- Data contract: `TodayPageData` from `packages/contracts/src/page-data/dashboard.ts`.
- Backend owner: `apps/edge-worker/src/services/dashboard`.
- Frontend API: `apiService.getTodayPageData()`, implemented in `services/apiDomains/dashboard.ts`.
- Component owner: `components/business` Today exports, `components/today` TodayEditorialShell, and `components/decor`.
- Style owner: `styles/today-page.css`.
- Non-goals: todo lifecycle management, action planning, content ranking internals, AI briefing generation internals, preview decor experiments, global shell ownership.

## ChatPage

- Route: `/chat`, implemented by `ChatPage.tsx`.
- UX intent: let the user ask, confirm, execute, and review assistant-driven actions without losing context.
- Primary hierarchy: conversation state, action context, pending confirmation, execution result, session records.
- Required states: hydrating, empty conversation, typing/streaming, pending confirmation, execution result, read error.
- Configuration chain: `文档/进行中/2026-05-01-Chat配置系统信息链路UX规格.md`.
- Data contract: Chat request and SSE event protocol from `packages/contracts/src/page-data/chat.ts`.
- Backend owner: `apps/edge-worker/src/services/chat`.
- Frontend API: chat methods on `apiService`, implemented in `services/apiDomains/chat.ts`.
- Component owner: `components/chat`, with formal decor only through `components/decor`.
- Style owner: `styles/chat-page.css`.
- Non-goals: generic behavior action design, provider resolution details, raw SSE parsing inside page JSX, preview-only decor.

## ArticlePage

- Route: `/article`, implemented by `ArticlePage.tsx`.
- UX intent: provide a focused reading detail surface for content opened from Briefing, Hot Topics, Collections, History, or Reports.
- Product name: 阅读详情.
- Single-page UX spec: `文档/进行中/2026-05-01-ArticlePage阅读详情页UX规格.md`.
- Primary hierarchy: source/title, partial-detail notice, actions, summary, body, tags, related items, opportunity handoff.
- Required states: loading by `contentRef`, no active article, partial detail, ready detail, action error, favorite state.
- Data contract: content detail and favorite contracts from `packages/contracts/src/page-data/content.ts` and `packages/contracts/src/page-data/dashboard.ts`.
- Backend owner: `apps/edge-worker/src/services/content` plus favorites route/service for collection state.
- Frontend API: `apiService.getContentDetailByRef()`, `apiService.getFavorites()`, `apiService.createFavorite()`, `apiService.deleteFavorite()`.
- Component owner: `components/business/article` and `components/layout`.
- Style owner: `styles/article-page.css`.
- Non-goals: daily ranking, briefing generation, todo lifecycle management, raw detail-fetching inside JSX, replacing Chat confirmation flows.

## HotTopicsPage

- Route: `/hot-topics`, implemented by `HotTopicsPage.tsx`.
- UX intent: let the user browse a small set of public hot topics and decide whether to read or save them.
- Product name: 热点探索.
- Single-page UX spec: `文档/进行中/2026-05-01-HotTopics热点探索页UX规格.md`.
- Primary hierarchy: page explanation, public topic list, topic observation modal, read/save actions.
- Required states: loading, load error, empty list, ready list, modal open, collect success/failure.
- Data contract: hot topic and favorite contracts from content and behavior APIs.
- Backend owner: hot topic/content routes and favorites service.
- Frontend API: `apiService.getHotTopics()`, `apiService.getFavorites()`, `apiService.createFavorite()`, `apiService.deleteFavorite()`.
- Component owner: `components/business/hotTopics.tsx` and `components/layout`.
- Style owner: `styles/hot-topics.css`.
- Non-goals: replacing Briefing, changing interest configuration directly, action lifecycle management, full trend analytics.

## ActionsPage / Todo

- Routes: `/actions` and `/todo` semantics, implemented by `ActionsPage.tsx` where routed.
- UX intent: manage action lifecycle across today, future, completed, following items, and saved-for-later content.
- Product name: 待办.
- Single-page UX spec: `文档/进行中/2026-05-01-ActionsTodo待办页UX规格.md`.
- Primary hierarchy: top priority, filter chips, todo list, following items, saved-for-later content, rhythm/check-in.
- Required states: loading, load error, no top priority, empty filtered list, ready with todos, check-in done.
- Data contract: `ActionsOverviewData` from `packages/contracts/src/page-data/behavior.ts`.
- Backend owner: `apps/edge-worker/src/services/behavior`.
- Frontend API: `apiService.getActionsOverview()`, todo update/delete methods, `apiService.checkInToday()`.
- Component owner: `components/business/actions` and `components/layout`.
- Style owner: `styles/actions-page.css`.
- Non-goals: article reading, briefing explanation, full collection browsing, profile/report generation, Chat execution confirmation UI.

## WelcomePage

- Route: `/welcome`, implemented by `WelcomePage.tsx`.
- UX intent: introduce the product value quickly before login without becoming a second landing page system.
- Primary hierarchy: masthead, slide deck, progress dots, primary/secondary onboarding action.
- Required states: first slide, intermediate slide, final slide, touch dragging, login handoff.
- Data contract: static onboarding copy owned by the auth business component.
- Backend owner: none.
- Frontend API: route state passthrough to LoginPage through `useWelcomePageLogic`.
- Component owner: `components/business` auth exports and `components/layout`.
- Style owner: `styles/auth-pages.css`.
- Non-goals: account authentication, preview decor experiments, remote content loading, page-local carousel framework.

## InterestConfigPage

- Route: `/interest-config`, implemented by `InterestConfigPage.tsx`.
- UX intent: configure the user's briefing priorities so future briefings can emphasize relevant domains instead of generic public trends.
- Product name: 配置关注.
- Single-page UX spec: `文档/进行中/2026-05-01-InterestConfig关注配置页UX规格.md`.
- Primary hierarchy: masthead, purpose explanation, selected count, interest groups, submit action.
- Required states: loading existing interests, read error, no selection, saving, save failure, saved and redirected.
- Data contract: user interests from preferences APIs.
- Backend owner: `apps/edge-worker/src/services/preferences` and interest-related routes.
- Frontend API: `apiService.getUserInterests()`, `apiService.updateUserInterests()`.
- Component owner: `components/business/interestConfig.tsx` and `components/layout`.
- Style owner: `styles/auth-pages.css`.
- Non-goals: daily content consumption, public hot-topic exploration, collection management, notification settings, AI Provider setup.

## LoginPage

- Route: `/login`, implemented by `LoginPage.tsx`.
- UX intent: authenticate an existing user or create a new account, then return the user to the intended protected page or onboarding flow.
- Primary hierarchy: product masthead, login/register mode switch, auth form, development-only account presets, submit feedback.
- Required states: login, register, validation errors, submitting, auth resolved redirect, submit failure.
- Data contract: auth request/response contracts from the backend auth routes and app context session state.
- Backend owner: `apps/edge-worker/src/routes/auth.ts` and auth utilities.
- Frontend API: `AppContext` auth methods.
- Component owner: `components/business` auth exports and `components/ui`.
- Style owner: `styles/auth-pages.css`.
- Non-goals: profile editing, notification settings, AI Provider setup, daily briefing consumption.

## SettingsPage / NotificationSettingsPage

- Routes: `/settings`, `/notification-settings`.
- Implementations: `SettingsPage.tsx`, `NotificationSettingsPage.tsx`.
- UX intent: make system configuration visible, verifiable, and editable without duplicating ownership across pages.
- Single-page UX spec: `文档/进行中/2026-05-01-Settings配置落点UX规格.md`.
- Primary hierarchy for Settings: AI API entry, notification summary entry, appearance preferences, reminder preferences, configuration footnote.
- Primary hierarchy for Notification Settings: configuration notice, briefing push times, do-not-disturb, reminder methods, save result.
- Required states: loading settings, settings read error, local pending edits, saved confirmation, sync failure.
- Data contract: `UserSettingsPayload` from frontend API and behavior settings backend.
- Backend owner: `apps/edge-worker/src/services/behavior` settings store and settings routes.
- Frontend API: `apiService.getUserSettings()`, `apiService.updateUserSettings()`.
- Component owner: `components/business/settings.tsx` and `components/layout`.
- Style owner: `styles/preferences-pages.css`.
- Non-goals: interest onboarding, AI key security form details, account authentication, todo reminder lifecycle.

## Report Pages

- Routes: `/weekly-report`, `/monthly-report`, `/annual-report`.
- Implementations: `WeeklyReportPage.tsx`, `MonthlyReportPage.tsx`, `AnnualReportPage.tsx`.
- UX intent: turn accumulated behavior and content evidence into reviewable periodic summaries.
- Page-group UX spec: `文档/进行中/2026-05-01-Reports周期回看页组UX规格.md`.
- Primary hierarchy: report period, generated summary blocks, evidence/source references, refresh/generation state.
- Required states: loading, generated report, generation fallback, source-empty, load error.
- Data contract: report payloads from `packages/contracts/src/page-data/reports.ts`.
- Backend owner: `apps/edge-worker/src/services/reports`.
- Frontend API: report methods on `apiService`, implemented in `services/apiDomains/reports.ts`.
- Component owner: page-local composition plus shared `components/business` widgets when reused.
- Style owner: `styles/report-pages.css`.
- Non-goals: direct LLM block generation in pages, report source SQL, provider/quota plumbing, Today content selection.

## HistoryBriefPage

- Route: `/history-brief`, implemented by `HistoryBriefPage.tsx`.
- UX intent: provide a report archive entry for weekly, monthly, and annual reports without duplicating daily history logs.
- Product name: 历史简报.
- Page-group UX spec: `文档/进行中/2026-05-01-Reports周期回看页组UX规格.md`.
- Primary hierarchy: archive explanation, search, loading/error state, available reports, unavailable report slots.
- Required states: loading, load error, no available reports, available report list, unavailable report list.
- Data contract: report entry list from report APIs.
- Backend owner: `apps/edge-worker/src/services/reports`.
- Frontend API: `apiService.getReports()`.
- Component owner: `components/business/historyBrief.tsx` and `components/layout`.
- Style owner: `styles/history-pages.css`.
- Non-goals: daily event timeline, report body rendering, report generation internals, settings or action management.

## GrowthPage

- Route: `/growth`, implemented by `GrowthPage.tsx`.
- UX intent: show the user's recent behavior pattern and growth direction as a navigable overview.
- Primary hierarchy: profile/growth summary, radar or metrics, recent activity facts, navigation entries.
- Layout composition: `PageLayout` -> `Masthead` -> `PageContent` -> `PageStack` -> `PageSection` with `PageGrid` for report navigation.
- Required states: loading, ready, sparse-data fallback, load error.
- Data contract: growth/profile shapes from `packages/contracts/src/page-data/preferences.ts`.
- Backend owner: `apps/edge-worker/src/services/preferences`, with behavior facts from `services/behavior`.
- Frontend API: growth/profile methods on `apiService`, implemented in `services/apiDomains/preferences.ts`.
- Component owner: `components/business` navigation and metric widgets.
- Style owner: `styles/insights-pages.css`.
- Non-goals: report generation, raw behavior SQL, profile LLM generation details, page-specific global utilities.

## ProfilePage

- Route: `/profile`, implemented by `ProfilePage.tsx`.
- UX intent: explain how the system currently understands the user through recent behavior, profile summary, key judgments, keywords, and traceable sources.
- Product name: 我的画像.
- Single-page UX spec: `文档/进行中/2026-05-01-Profile我的画像页UX规格.md`.
- Primary hierarchy: update status, recent behavior distribution, data overview, profile explanation, key judgments, growth keywords, source references.
- Required states: loading, profile ready, sparse-data fallback, generation unavailable, generation in progress, generation success, generation failure.
- Data contract: `UserProfilePayload` from preferences/profile APIs.
- Backend owner: `apps/edge-worker/src/services/profile-generation.ts` and `services/preferences`.
- Frontend API: `apiService.getUserProfile()`, `apiService.generateUserProfile()`.
- Component owner: `components/business/profile.tsx` and `components/layout`.
- Style owner: `styles/insights-pages.css`.
- Non-goals: account settings, report generation, action lifecycle management, daily briefing composition, AI Provider secret editing.

## JournalPage / CollectionsPage / HistoryLogsPage

- Routes: `/log`, `/collections`, `/history-logs`.
- Implementations: `JournalPage.tsx`, `CollectionsPage.tsx`, `HistoryLogsPage.tsx`.
- UX intent: separate active expression, active saving, and automatic history traces so personal archive pages do not collapse into one generic records area.
- Page-group UX spec: `文档/进行中/2026-05-01-PersonalArchive个人沉淀页组UX规格.md`.
- Product names: 我的记录, 我的收藏, 历史日志.
- Primary hierarchy for Journal: recent deposit summary, active thoughts, action echoes, recent deposits, long-term review links.
- Primary hierarchy for Collections: search, loading/error/empty state, saved content list, source/detail action, opportunity follow-up handoff.
- Primary hierarchy for History Logs: archive explanation, loading/error state, daily archives, raw timeline, content detail handoff.
- Required states: loading, partial data, empty archive, read error, delete confirmation, saved item with follow-up state.
- Data contract: notes, favorites, history, actions overview, and journal overview contracts from `types/page-data`.
- Backend owner: `apps/edge-worker/src/services/behavior`, history routes, and journal overview services.
- Frontend API: notes, favorites, history, actions overview, and journal overview methods on `apiService`.
- Component owner: `components/business/journal.tsx`, `collections.tsx`, `historyLogs.tsx`, plus layout components.
- Style owner: `styles/journal-feedback.css`, `styles/insights-pages.css`, `styles/history-pages.css`.
- Non-goals: profile generation, report generation, settings editing, full todo lifecycle management inside archive pages.

## MyPage

- Route: `/me`, implemented by `MyPage.tsx`.
- UX intent: provide a stable personal hub for settings, saved areas, support, and account-related navigation.
- Primary hierarchy: identity/account summary, personal navigation entries, settings/support exits.
- Required states: authenticated ready state and safe fallback for missing profile details.
- Data contract: app context user state plus settings/profile contracts when surfaced.
- Backend owner: auth and preferences/behavior services depending on the surfaced capability.
- Frontend API: `AppContext` for auth state and `apiService` domain methods for settings/profile actions.
- Component owner: `components/business` navigation entries and `components/layout`.
- Style owner: `styles/my-pages.css`.
- Non-goals: implementing settings forms inline, duplicating profile generation, raw account mutation logic.

## Contract Rule

If a page change cannot be described inside one of the contracts above, decide whether it is:

- a new page contract;
- a component promotion;
- a backend/domain capability;
- a shared data contract change;
- or a preview experiment that must stay isolated.

Do not solve unclear ownership by adding page styles to `index.css`, deep-importing component
implementation files, or shaping backend data directly inside page JSX.
