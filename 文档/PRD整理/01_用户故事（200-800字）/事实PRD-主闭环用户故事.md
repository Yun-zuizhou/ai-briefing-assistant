# 事实PRD（用户故事版）- AI简报助手主闭环

- 文档类型：用户故事（事实版）
- 快照日期：2026-04-23
- 方向依据：`文档/项目核心总纲.md`、`文档/项目功能文档.md`
- 实现依据：`apps/web/src/App.tsx`、`apps/web/src/services/api.ts`、`apps/edge-worker/src/routes/*`

## 1. 用户故事
作为一个在信息过载中希望“更快看懂今天、立刻转成行动、并能持续回看成长”的登录用户，我希望在同一个系统里完成“今日信息浏览 -> 对话转化 -> 行动执行 -> 历史复盘”，并且每一步都写入正式后端与正式数据库，而不是停留在前端临时状态。

## 2. 验收标准（事实口径）
1. Given 未登录访问受保护页面，When 访问 `/today`、`/chat`、`/actions` 等路由，Then 前端统一跳转 `/welcome`。
2. Given 用户已登录，When 前端请求 `/api/v1/dashboard/today`，Then 能返回 Today 聚合数据（值得知道/值得行动/推荐）。
3. Given 用户在 Today 点击内容卡片，When 打开 `/article?ref=...`，Then 前端通过 `/api/v1/content/by-ref` 获取统一内容详情。
4. Given 用户在 Today/内容页触发“转成待办”，When 进入对话并执行，Then 后端调用 `/api/v1/chat/execute` 写入真实对象链（非前端假写）。
5. Given 用户在行动页点“今日打卡”，When 调用 `/api/v1/actions/check-in`，Then 返回 `checkedInToday/streakDays` 并在后续读取 `/actions/overview` 时可见。
6. Given 用户进入历史简报并选择某条报告，When 前端调用 `/api/v1/reports/weekly|monthly|annual?report_id=...`，Then 能按 `report_id` 读取历史对象。

## 3. 简要说明
- 该故事已由“Cloudflare Workers + D1 + Pages”主链承接，Python `app/` 当前定位是离线/参考链，不是在线主后端。
- 当前主门槛是 `npm.cmd run check`；`文档/进行中/当前测试与验收总表.md` 记录最近事实结果（2026-04-22：通过）。
- 当前仍需继续补的是人工验收证据、资源级权限覆盖和部分体验尾差，而不是回退到 mock 或旧接口拼装。

## 4. 证据来源
- `文档/项目核心总纲.md`
- `文档/技术现实清单.md`
- `文档/进行中/当前阶段总表.md`
- `apps/web/src/App.tsx`
- `apps/web/src/services/api.ts`
- `apps/edge-worker/src/index.ts`
