# `app`

Python 离线/参考/验证链目录。

## 当前角色

1. 这里不再是正式在线主后端。
2. 当前正式在线后端是 `apps/edge-worker`。
3. 这里继续承担：
   - 离线/参考实现
   - 行为与数据链路验证
   - 工具脚本依赖的 Python 主包

## 目录说明

- `api/v1/`
  - Python 参考接口与旧验证链入口
- `services/`
  - Python 侧领域逻辑、D1/SQLite 读写与兼容层
- `models/`
  - SQLAlchemy 模型
- `crawler/`
  - 采集与离线处理逻辑

## 使用边界

1. 不要把 `app/` 重新抬回正式在线主链。
2. 新的正式在线能力优先落到：
   - `apps/edge-worker`
   - `infra/cloudflare/d1`
   - `packages/contracts`
3. 如果修改这里，默认应以“离线参考 / 验证稳定性 / 兼容层”为目标，而不是扩正式 API 面。

## 当前后续方向

`app/` 是否进一步归位，当前以：

- `文档/归档/AI简报助手-app迁移评估与正式态候选/2026-04-16-app迁移安全评估.md`
- `文档/归档/AI简报助手-app迁移评估与正式态候选/2026-04-16-app正式态架构与兜底清退方案.md`

为准。
