# P7 Today 自动简报生成 Cron 接入产出

- 建立日期：2026-04-30
- 文档状态：进行中
- 所属主线：[2026-04-30-P7-LLM产品化与运维化收口计划.md](./2026-04-30-P7-LLM产品化与运维化收口计划.md)
- 上游关联：[2026-04-30-P7-B-Today简报LLM生成链路产出.md](./2026-04-30-P7-B-Today简报LLM生成链路产出.md)
- 文档定位：记录 Today AI 简报从手动 refresh 扩展到 Worker Cron 自动生成入口
- 并行边界：本文档为新增并行产出，不替换 `当前阶段总表.md`，不修改其他人的阶段文档

---

## 1. 背景

链路审查指出：

`GET /dashboard/today?refresh=1` 已能手动生成 Today AI 简报，但没有后台自动生成入口。用户不主动刷新时，可能长期看到规则简报或旧简报。

本批不采用 `GET /today?auto=true`，原因是：

1. 自动生成属于后台任务语义，不应挂在普通读请求上。
2. 公开 GET 自动触发会放大误触发和成本风险。
3. Cloudflare Workers 已提供 Cron Trigger，更适合每日简报生成。

---

## 2. 本批目标

1. 抽出可复用的 Today AI 简报生成与持久化函数。
2. 手动 refresh 与 Worker Cron 共用同一条生成主链路。
3. Cron 每天自动扫描 active morning schedules。
4. 已生成当天 AI 简报的用户自动跳过。
5. 写入 `briefing_dispatch_logs`，保留调度执行记录。
6. 保持软配额、provider fallback、失败回退逻辑不变。

---

## 3. 已完成改动

### 3.1 生成编排复用

更新文件：

- `apps/edge-worker/src/routes/dashboard.ts`

新增导出：

- `generateAndPersistTodayBriefingForUser()`
- `runTodayBriefingCron()`

生成函数行为：

1. 读取当天已有 ready briefing。
2. 非 force 场景下，如果当天已有 `aiBriefing`，直接跳过。
3. 读取热点、机会、用户兴趣和最新简报 payload。
4. 构建推荐、值得知道、值得行动候选项。
5. 解析用户 provider，失败时回退环境 summary provider。
6. 调用 `generateTodayBriefingBlock()`。
7. 写回 `briefings.payload.aiBriefing`、`leadItem`、`dailyAngle`。

### 3.2 Cron runner

更新文件：

- `apps/edge-worker/src/routes/dashboard.ts`

`runTodayBriefingCron()` 行为：

1. 查询 `briefing_schedules` 中 active morning schedules。
2. 默认最多处理 20 个用户，代码层上限 50。
3. 对每个用户调用 `generateAndPersistTodayBriefingForUser({ force: false })`。
4. 单用户失败不阻断后续用户。
5. 每个 schedule 写入 `briefing_dispatch_logs`：
   - `success`
   - `skipped`
   - `error`

### 3.3 Worker scheduled handler

更新文件：

- `apps/edge-worker/src/index.ts`

变化：

1. 保留 `app` 命名导出，方便测试继续用 Hono app。
2. 默认导出改为 Worker handler object：
   - `fetch()`
   - `scheduled()`
3. `scheduled()` 使用 `ctx.waitUntil()` 执行 Cron runner。
4. 顶层不吞异常，让 Worker Cron 能记录真实失败状态。

### 3.4 Wrangler Cron 配置

更新文件：

- `apps/edge-worker/wrangler.toml`

新增：

```toml
[triggers]
crons = ["15 0 * * *"]
```

含义：

- Cloudflare Cron 使用 UTC。
- `15 0 * * *` 约等于北京时间每日 08:15。

---

## 4. 当前边界

1. 当前 Cron 以 active morning schedules 作为用户范围。
2. 当前没有严格按每个用户的 `schedule_time` 分钟级触发，只在每日 08:15 统一生成。
3. 当前没有队列化，Cron runner 在一次 scheduled event 内顺序处理用户。
4. 当前没有全局熔断；仍依赖 P7-D 的用户级软配额。
5. 当前没有推送通知，只生成并持久化 Today AI 简报。

---

## 5. 验证结果

已通过：

```powershell
npm.cmd --workspace apps/edge-worker run typecheck
```

已通过：

```powershell
npx.cmd vitest --run tests/dashboard.route.test.ts tests/index.route.test.ts
```

结果：

- 2 个测试文件通过。
- 6 个测试通过。

新增测试覆盖：

1. active morning schedule 会被 Cron runner 扫描。
2. Cron runner 能调用 LLM provider 并写入 `briefings`。
3. Cron runner 会写入 `briefing_dispatch_logs`。
4. Hono app 命名导出仍能支撑 index route 测试。

---

## 6. 下一步建议

1. 增加按用户 `schedule_time` 分桶执行，避免所有用户固定 08:15。
2. 接入 Queues，把多用户生成从 Cron event 中拆到后台队列。
3. 诊断页增加 Cron dispatch 样本与失败原因跳转。
4. 后续若用户量扩大，再加入全局 provider 熔断和重试退避。
