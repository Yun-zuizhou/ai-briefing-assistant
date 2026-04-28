# Cloudflare Workers 迁移方案

- 项目名称：AI简报助手（时代与我）
- 文档定位：技术决策与迁移规划
- 创建日期：2026-04-13
- 决策状态：已确认迁移

## 1. 决策背景

### 1.1 原方案问题

原计划使用 Railway 部署 Python FastAPI 后端，存在以下问题：

| 问题 | 说明 |
|------|------|
| 平台分散 | 后端 Railway + 数据库 Cloudflare D1 + 前端 Cloudflare Pages |
| 运维复杂 | 需要维护多个平台的账号、配置、监控 |
| 成本增加 | Railway 需要付费计划才能稳定运行 |
| 技术栈不统一 | Python 后端与 Cloudflare 生态割裂 |

### 1.2 迁移动机

| 优势 | 说明 |
|------|------|
| 平台统一 | 数据库 D1 + 后端 Workers + 前端 Pages 全在 Cloudflare |
| 边缘计算 | Workers 全球分布，低延迟 |
| 成本优化 | Workers 免费额度充足，D1 免费额度足够开发使用 |
| 运维简化 | 一个平台管理所有服务 |

### 1.3 技术约束

**Cloudflare Workers 支持的语言**：
- ✅ JavaScript (Node.js 兼容)
- ✅ TypeScript
- ✅ Rust (编译为 Wasm)
- ✅ Python (通过 Pyodide，但性能差)
- ❌ 原生 Python FastAPI

**结论**：需要将 Python FastAPI 后端重写为 TypeScript。

---

## 2. 迁移范围评估

### 2.1 当前后端模块清单

| 模块 | 文件 | 迁移复杂度 | 说明 |
|------|------|-----------|------|
| 主入口 | `app/main.py` | 中 | FastAPI 路由定义 |
| 配置 | `app/config.py` | 低 | 环境变量读取 |
| 数据库 | `app/database.py` | 中 | SQLAlchemy → D1 API |
| API 路由 | `app/api/` | 高 | 多个路由文件 |
| 服务层 | `app/services/` | 高 | 业务逻辑核心 |
| 模型层 | `app/models/` | 中 | SQLAlchemy → TypeScript 类型 |
| 爬虫 | `app/crawler/` | 高 | 需要适配 Workers 环境 |

### 2.2 API 端点清单

| 端点 | 方法 | 迁移优先级 | 说明 |
|------|------|-----------|------|
| `/api/v1/dashboard/today` | GET | P0 | 首页数据 |
| `/api/v1/actions/overview` | GET | P0 | 行动页数据 |
| `/api/v1/actions/check-in` | POST | P0 | 打卡功能 |
| `/api/v1/preferences/growth-overview` | GET | P0 | 成长页数据 |
| `/api/v1/content/by-ref` | GET | P0 | 内容详情 |
| `/api/v1/chat/*` | POST/GET | P1 | 聊天功能 |
| `/api/v1/reports/*` | GET | P1 | 报告功能 |
| `/api/v1/briefings/*` | GET | P1 | 简报功能 |
| `/api/v1/user-profiles/*` | GET/PUT | P2 | 用户配置 |

### 2.3 工作量估算

| 阶段 | 工作内容 | 估算工作量 |
|------|----------|-----------|
| 阶段一 | 项目初始化 + 核心路由 | 2-3 天 |
| 阶段二 | D1 数据库集成 | 1-2 天 |
| 阶段三 | P0 API 迁移 | 3-4 天 |
| 阶段四 | P1 API 迁移 | 2-3 天 |
| 阶段五 | 前端适配 + 测试 | 2-3 天 |
| **总计** | | **10-15 天** |

---

## 3. 分阶段迁移计划

### 阶段一：项目初始化（2-3 天）

**目标**：搭建 Cloudflare Workers 项目骨架

**任务清单**：
- [ ] 创建 Workers 项目结构
- [ ] 配置 TypeScript + Hono 框架
- [ ] 配置 wrangler.toml
- [ ] 实现基础路由框架
- [ ] 配置环境变量

**技术选型**：
- 框架：Hono（轻量级 Web 框架，类似 Express）
- 语言：TypeScript
- 数据库：Cloudflare D1

**目录结构**：
```
workers/
├── src/
│   ├── index.ts          # 入口
│   ├── routes/           # 路由
│   ├── services/         # 业务逻辑
│   ├── models/           # 类型定义
│   └── utils/            # 工具函数
├── wrangler.toml         # Workers 配置
├── package.json
└── tsconfig.json
```

### 阶段二：D1 数据库集成（1-2 天）

**目标**：完成 D1 数据库连接和查询

**任务清单**：
- [ ] 配置 D1 数据库绑定
- [ ] 实现数据库查询工具函数
- [ ] 迁移数据模型类型定义
- [ ] 测试数据库连接

### 阶段三：P0 API 迁移（3-4 天）

**目标**：迁移核心 API 端点

**任务清单**：
- [ ] `/api/v1/dashboard/today`
- [ ] `/api/v1/actions/overview`
- [ ] `/api/v1/actions/check-in`
- [ ] `/api/v1/preferences/growth-overview`
- [ ] `/api/v1/content/by-ref`

### 阶段四：P1 API 迁移（2-3 天）

**目标**：迁移次要 API 端点

**任务清单**：
- [ ] `/api/v1/chat/*`
- [ ] `/api/v1/reports/*`
- [ ] `/api/v1/briefings/*`
- [ ] `/api/v1/user-profiles/*`

### 阶段五：前端适配 + 测试（2-3 天）

**目标**：完成前端对接和端到端测试

**任务清单**：
- [ ] 更新前端 API_ORIGIN 配置
- [ ] 部署 Workers 到生产环境
- [ ] 部署前端到 Cloudflare Pages
- [ ] 端到端测试验证

---

## 4. 技术方案细节

### 4.1 框架选型：Hono

```typescript
// 示例代码
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/*', cors())

app.get('/api/v1/dashboard/today', async (c) => {
  const db = c.env.DB // D1 数据库绑定
  const result = await db.prepare('SELECT * FROM hot_topics').all()
  return c.json({ data: result.results })
})

export default app
```

### 4.2 D1 数据库查询

```typescript
// 查询工具函数
export async function queryOne<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const stmt = db.prepare(sql).bind(...params)
  const result = await stmt.first()
  return result as T | null
}

export async function queryAll<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const stmt = db.prepare(sql).bind(...params)
  const result = await stmt.all()
  return result.results as T[]
}
```

### 4.3 环境变量配置

```toml
# wrangler.toml
name = "ai-briefing-assistant"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "ai-briefing-assistant-prod"
database_id = "503a4b2f-b062-4ec5-be21-edfd0e7d8a2d"

[vars]
ENVIRONMENT = "production"
```

---

## 5. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Python → TypeScript 语法差异 | 中 | 使用类型定义，逐步迁移 |
| SQLAlchemy → D1 API 差异 | 中 | 封装查询工具函数 |
| Workers 执行时间限制 | 低 | P0 API 已验证可在限制内完成 |
| 爬虫功能受限 | 高 | 爬虫功能暂缓，后续用外部服务替代 |

---

## 6. 决策记录

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-04-13 | 放弃 Railway，迁移到 Cloudflare Workers | 平台统一、成本优化、运维简化 |

---

## 7. 下一步行动

1. **立即**：更新项目主线文档，记录迁移决策
2. **今天**：创建 Workers 项目骨架
3. **本周**：完成阶段一和阶段二
4. **下周**：完成 P0 API 迁移

---

## 8. 相关文档

- [项目核心总纲.md](/E:/python/杂谈-想法记录与实践/文档/项目核心总纲.md)
- [当前阶段总表.md](/E:/python/杂谈-想法记录与实践/文档/进行中/当前阶段总表.md)
- [技术现实清单.md](/E:/python/杂谈-想法记录与实践/文档/技术现实清单.md)
