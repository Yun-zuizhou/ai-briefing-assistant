# apps/edge-worker

当前正式在线后端主线。

## 目录角色

- 运行时：Cloudflare Workers + Hono
- 正式 API：`/api/v1/*`
- 正式数据库：Cloudflare D1
- 当前职责：承接正式前端 `apps/web` 的在线读写请求

## 本地配置

本地开发使用：

- `wrangler.toml`：非敏感默认配置
- `.dev.vars`：仅本地使用的 Workers 变量

首次执行：

1. `npm.cmd run setup`
2. 若 `apps/edge-worker/.dev.vars` 不存在，会从 `apps/edge-worker/.dev.vars.example` 自动生成

当前需要特别关注的本地变量：

- `INTERNAL_API_TOKEN`
  - 作用：保护内部执行器接口
  - 影响接口：
    - `POST /api/v1/system/ingestion-runs`
    - `POST /api/v1/system/ai-processing-runs`
- `SUMMARY_PROVIDER_ENABLED`
- `SUMMARY_PROVIDER_API_URL`
- `SUMMARY_PROVIDER_API_KEY`
- `SUMMARY_PROVIDER_MODEL`
 - `SUMMARY_PROVIDER_DEBUG_FALLBACK`
  - 作用：为 `POST /api/v1/content/consult` 提供最小咨询模型配置
  - 当前定位：只给“基于已生成摘要结果继续追问”的读侧咨询接口使用
  - 当前不代表 Workers 已承接摘要主执行器；阶段十六首版的摘要主执行仍以 Python 脚本链为准
  - `SUMMARY_PROVIDER_DEBUG_FALLBACK=true` 仅用于本地/联调环境，在 provider 未配置时生成明确标记的调试回答，不得作为正式结果口径

## 生产配置

生产环境不要把内部 token 写进仓库。

当前推荐做法：

1. 使用 Wrangler secret 单独配置
2. 当前真实线上对象是默认 Worker，而不是 `env.production` 分支
3. 后续轮换 secret 时，使用下面的命令：

```powershell
wrangler secret put INTERNAL_API_TOKEN
```

补充说明：

- `wrangler.toml` 里当前只保留非敏感 `vars`
- 默认 Worker `ai-briefing-assistant` 已完成 `INTERNAL_API_TOKEN` secret 配置
- 生产侧若未配置 `INTERNAL_API_TOKEN`，内部执行器接口会返回“未配置”而不是继续裸露开放
