# AI简报助手（时代与我）

当前仓库已收口为“运行层归位 + 共享契约单点化”的结构：

- `apps/web`：正式前端（Vite + React）
- `apps/edge-worker`：正式在线后端（Cloudflare Workers + Hono）
- `app`：Python 离线/参考/验证后端
- `packages/contracts`：前后端共享页面契约
- `infra/cloudflare/d1`：D1 migrations 与 seeds
- `tools/scripts`：统一脚本入口
- `var/local`：本地 SQLite
- `var/logs`：本地日志

推荐一键命令：

- `npm.cmd run task:init`
- `npm.cmd run task:start`
- `npm.cmd run task:start:fast`
- `npm.cmd run task:start:web`
- `npm.cmd run task:start:python:lite`
- `npm.cmd run task:verify`
- `npm.cmd run task:access:d1`
- `npm.cmd run task:access:workers`
- `npm.cmd run task:access:consult`
- `npm.cmd run task:data:prepare`

命令规范与完整清单见：

- [文档/命令规范/README.md](/E:/python/杂谈-想法记录与实践/文档/命令规范/README.md)
- [文档/命令规范/常用一键命令.md](/E:/python/杂谈-想法记录与实践/文档/命令规范/常用一键命令.md)

阶段十六当前支持的真实 provider 选项包括：

- `deepseek`
- `openai`
- `nvidia`
- `anthropic`
- `gemini`
- `zhipu`
- `qwen`
- `local`

当前正式 Cloudflare 入口只认 `apps/edge-worker/wrangler.toml`。
