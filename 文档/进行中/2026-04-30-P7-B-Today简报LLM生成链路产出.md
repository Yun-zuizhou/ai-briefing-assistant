# P7-B Today 简报 LLM 生成链路产出

- 建立日期：2026-04-30
- 文档状态：进行中
- 所属主线：[2026-04-30-P7-LLM产品化与运维化收口计划.md](./2026-04-30-P7-LLM产品化与运维化收口计划.md)
- 上游清单：[2026-04-30-P7-A-AI状态统一接入清单.md](./2026-04-30-P7-A-AI状态统一接入清单.md)
- 文档定位：记录 Today/briefings 的 LLM 简报 payload、生成入口、展示接入和验证结果
- 并行边界：本文档只记录 P7-B 并行产出，不替换 `当前阶段总表.md` 和 P4 页面迁移文档

---

## 1. 本批目标

把 Today 当前“结构化聚合 + briefing payload 读取”的基础，推进到可承载正式 LLM 简报文本块的状态。

本批不新增数据库字段，不引入新表，继续复用：

- `briefings.title`
- `briefings.summary_text`
- `briefings.payload`
- `briefings.status`
- `briefings.generated_at`

---

## 2. 已完成内容

### 2.1 契约新增

更新文件：

- `packages/contracts/src/page-data.ts`

新增类型：

- `TodayAiBriefingSourceRef`
- `TodayAiBriefingCluster`
- `TodayAiBriefingBlock`

`TodayPageData` 新增可选字段：

```ts
aiBriefing?: TodayAiBriefingBlock
```

字段口径：

| 字段 | 含义 |
|---|---|
| `version` | 当前为 `llm-today-briefing-v1` |
| `provider/model` | 生成模型信息 |
| `status` | `success` 或 `fallback` |
| `leadSummary` | 今日简报总述 |
| `topicClusters` | LLM 主题归并 |
| `recommendationReasons` | 推荐理由 |
| `uncertainties` | 不确定项 |
| `generatedAt` | 生成时间 |

### 2.2 后端生成服务

新增文件：

- `apps/edge-worker/src/services/briefing/llm-briefing.ts`

能力：

1. 构建 `llm-today-briefing-v1` prompt。
2. 输入：
   - 用户关注领域
   - `worthKnowing`
   - `worthActing`
   - `recommendedForYou`
3. 输出：
   - `leadSummary`
   - `topicClusters`
   - `recommendationReasons`
   - `uncertainties`
4. 限制：
   - 只返回严格 JSON。
   - `sourceIndexes` 只能引用候选来源数组下标。
   - LLM 不输出完整页面 payload。
5. 调用走 `loggedChatCompletion`。
6. 失败时不阻断 Today，保留原规则聚合结果。

### 2.3 Dashboard Today 接入

更新文件：

- `apps/edge-worker/src/routes/dashboard.ts`

新增行为：

1. 普通读取：
   - 继续读取最新 `briefings.payload`。
   - 如果 payload 内存在 `aiBriefing`，安全规范化后透出到 `TodayPageData.aiBriefing`。
   - 如果不存在，保持原 Today 规则聚合。
2. 显式刷新：
   - `GET /api/v1/dashboard/today?refresh=1`
   - 在有用户 provider 或 env summary provider 时，尝试生成今日 AI 简报。
   - 生成成功后 upsert 到 `briefings` 今日 `morning` 记录。
   - 写入 `payload.aiBriefing`、`payload.leadItem`、`payload.dailyAngle`、`payload.extensionSlots`。
   - `summary_text` 使用 `aiBriefing.leadSummary`。
3. 调用日志：
   - `feature=today_briefing_generation`
   - `requestRef=today_briefing:{userId}:{date}`

回退：

- Provider 不存在、调用失败、输出非法时，不写坏 payload，不影响原 `/dashboard/today`。

### 2.4 前端展示接入

更新文件：

- `apps/web/src/services/api.ts`
- `apps/web/src/pages/TodayPage.tsx`

前端行为：

1. API 校验器支持 `aiBriefing`。
2. Today 概览区在有 `aiBriefing` 时展示：
   - `AI 简报已生成` 或 `规则简报`
   - provider/model
   - 最多 2 个主题归并卡片
   - 每个主题展示来源数量
3. 无 `aiBriefing` 时页面保持原有 Today 展示。

---

## 3. 当前边界

1. 本批没有做后台队列化。
2. 本批没有新增普通用户显式“重新生成今日简报”按钮。
3. `refresh=1` 当前作为开发/验收入口存在，后续可接到统一 AI 状态按钮。
4. 历史简报页还没有正式消费 `aiBriefing`，下一批应补历史只读态展示。
5. 信息源整理仍是候选集归并解释，没有让 LLM 接管全量排序。

---

## 4. 验证结果

已通过：

```powershell
npm.cmd run typecheck
```

目录：

- `apps/edge-worker`

已通过：

```powershell
npx.cmd vitest --run tests/dashboard.route.test.ts
```

结果：

- 1 个测试文件通过。
- 4 个测试通过。

新增测试覆盖：

- `briefings.payload.aiBriefing` 能被 `/dashboard/today` 安全透传。

已通过：

```powershell
npm.cmd run build
```

目录：

- `apps/web`

说明：

- 首次 sandbox 内运行 vitest 时 esbuild 子进程被 `EPERM` 拦截，已按权限规则在沙箱外复跑通过。

---

## 5. 下一步入口

1. 给 Today 页面接统一 AI 状态按钮，触发 `dashboard/today?refresh=1`。
2. 历史简报页读取 `briefings.payload.aiBriefing` 并进入 `readonly` 状态。
3. 补失败样本在诊断页的跳转或 invocation id 复制。
4. 继续推进 P7-C：来源去重、主题归并、可信度解释和推荐理由生成。
