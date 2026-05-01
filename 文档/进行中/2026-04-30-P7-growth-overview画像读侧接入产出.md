# P7 growth-overview 画像读侧接入产出

- 建立日期：2026-04-30
- 文档状态：进行中
- 所属主线：[2026-04-30-P7-LLM产品化与运维化收口计划.md](./2026-04-30-P7-LLM产品化与运维化收口计划.md)
- 上游关联：[2026-04-30-P7-D-LLM成本与软配额治理产出.md](./2026-04-30-P7-D-LLM成本与软配额治理产出.md)
- 文档定位：记录成长总览页优先读取 LLM 用户画像的读侧收口
- 并行边界：本文档为新增并行产出，不替换 `当前阶段总表.md`，不修改其他人的阶段文档

---

## 1. 背景

链路审查指出：

`GET /preferences/growth-overview` 仍通过 `buildPersonaSummary()` 和 `buildGrowthKeywords()` 生成固定模板，没有读取 `user_profiles` 表中已经生成的 LLM 画像。

这会导致：

1. 个人画像页可以看到 LLM 画像。
2. 成长总览页仍展示规则模板。
3. 同一用户在不同页面看到的画像口径不一致。

---

## 2. 本批目标

本批只做读侧收口：

1. `growth-overview` 优先读取最新 `user_profiles`。
2. 有 LLM 画像时使用 `summary` 作为 `persona.personaSummary`。
3. 有 `profile_data.growthKeywords` 时使用 LLM 关键词。
4. 返回 `personaVersion` 和 `updatedAt`，方便前端后续展示 AI 状态。
5. 无画像、画像字段缺失或 JSON 解析失败时，继续回退原规则模板。

本批不做：

1. 不新增 LLM 调用入口。
2. 不改变 `user_profiles` 表结构。
3. 不修改成长总览页 UI 展示样式。
4. 不引入后台任务或自动生成。

---

## 3. 已完成改动

### 3.1 路由读侧接入

更新文件：

- `apps/edge-worker/src/routes/preferences.ts`

行为变化：

1. `growth-overview` 并行读取：
   - 用户兴趣
   - 画像统计
   - 连续活跃天数
   - 最近简报、笔记、机会跟进
   - 最新 `user_profiles`
2. 解析 `profile_data` 中的 `growthKeywords`。
3. 优先级：
   - `personaSummary`: `latestProfile.summary` > `buildPersonaSummary()`
   - `keywords`: `profile_data.growthKeywords` > `buildGrowthKeywords()`
   - `personaVersion`: `latestProfile.version` > `v1`
   - `updatedAt`: `latestProfile.generated_at` > `undefined`

### 3.2 回归测试

更新文件：

- `apps/edge-worker/tests/preferences.route.test.ts`

新增覆盖：

1. 当 `user_profiles` 有最新画像时，`growth-overview` 返回 LLM summary。
2. 当 `profile_data.growthKeywords` 存在时，成长关键词来自 LLM 画像。
3. 返回 `personaVersion` 与 `updatedAt`。
4. 原有无活跃兴趣的规则 fallback 测试保持通过。

---

## 4. 当前边界

1. 成长总览页前端目前主要消费 `personaSummary` 和 `keywords`，尚未显式展示 `personaVersion` / `updatedAt`。
2. `growth-overview` 不主动触发画像生成，仍依赖 `/profile/generate` 或后续后台任务生成画像。
3. 如果历史 `profile_data` 非法或没有 `growthKeywords`，会自动回退规则关键词。
4. 当前没有把 `keyInsights` 放入 `GrowthOverviewData`，避免扩大契约面。

---

## 5. 验证结果

已通过：

```powershell
npm.cmd --workspace apps/edge-worker run typecheck
```

已通过：

```powershell
npm.cmd --workspace apps/web run build
```

说明：

- 默认沙箱下 `web build` 曾触发 Vite/Rolldown 绝对路径错误。
- 已在沙箱外重跑通过。

已通过：

```powershell
npx.cmd vitest --run tests/preferences.route.test.ts
```

结果：

- 1 个测试文件通过。
- 7 个测试通过。

---

## 6. 下一步建议

1. 前端成长总览页可增加“画像更新时间”或 AI 生成状态提示。
2. 后续如果做后台画像生成，可让 `growth-overview` 的数据更加稳定。
3. 信息源整理进入主流程前，先确认 `growth-overview` 不再暴露模板化画像口径。
