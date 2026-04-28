# Cloudflare D1 正式数据接管说明

## 1. 这份文档的目的

这份文档用于把项目的数据口径正式收束为：

- 云端正式数据：Cloudflare D1
- 本地数据文件 / 本地 SQLite / 虚拟状态：仅允许作为历史遗留、开发兜底或一次性迁移输入

从这一步开始，项目的正式数据不再以本地文件和本地数据库为准。

---

## 2. 本次沿用的正式数据结构

本次不是重新设计一套新结构，而是优先沿用仓库里已经落地的模型与接口。

主要来源：

- `app/models/user.py`
- `app/models/hot_topic.py`
- `app/models/opportunity.py`
- `app/models/todo.py`
- `app/models/favorite.py`
- `app/models/note.py`
- `app/models/history.py`
- `app/models/rss_source.py`
- `app/models/rss_article.py`

在此基础上，只补了当前产品文档已经明确需要、但本地 SQLite 里尚未正式建表的内容：

- `user_settings`
- `user_profiles`
- `briefings`

对应的 D1 初始化迁移文件：

- `infra/cloudflare/d1/migrations/0001_init_schema.sql`

---

## 3. 当前仓库里已有的本地数据方案

### 3.1 本地 SQLite

- `var/local/info_collector.db`

当前实际存在的数据表：

- `users`
- `hot_topics`
- `opportunities`
- `todos`
- `rss_sources`
- `rss_articles`

### 3.2 mock-data 文件

- `apps/web/demo/mock-data/hot-topics/hot-topics.json`
- `apps/web/demo/mock-data/opportunities/opportunities.json`
- `apps/web/demo/mock-data/briefings/*.json`
- `apps/web/demo/mock-data/user-data/favorites.json`
- `apps/web/demo/mock-data/user-data/thoughts.json`
- `apps/web/demo/mock-data/user-data/user-profile.json`
- `apps/web/demo/mock-data/user-data/user-settings.json`

### 3.3 共享虚拟状态

- `app/services/data/virtual_data.py`

这部分当前还在为以下接口提供兜底：

- `GET /api/v1/todos`
- `GET /api/v1/favorites`
- `GET /api/v1/notes`
- `GET /api/v1/history`
- `GET /api/v1/dashboard/today`
- `POST /api/v1/chat/execute` 的异常回退分支

---

## 4. 这些本地数据方式以后如何处理

### 可以继续保留，但不再是正式数据源

- `info_collector.db`
- `mock-data/`
- `app/services/data/virtual_data.py`

### 它们以后只能用于

- 一次性迁移现有数据到 D1
- 开发阶段接口失败时的临时兜底
- 页面设计演示
- 历史参考

### 它们以后不能再用于

- 作为线上或正式验收数据
- 人工修改后当成“项目正式数据”
- 新增正式内容、正式收藏、正式记录、正式简报

---

## 5. 本次为 D1 准备了什么

### 5.1 Cloudflare 配置

- `apps/edge-worker/wrangler.toml`

### 5.2 D1 迁移

- `infra/cloudflare/d1/migrations/0001_init_schema.sql`

### 5.3 一次性导入脚本

- `tools/scripts/generate_d1_seed.py`

这个脚本会把当前仓库里已经存在的正式或已确认数据整理成 D1 可执行 SQL：

- 优先读取 `info_collector.db`
- 优先读取 `var/local/info_collector.db`
- 若本地 SQLite 对应表为空，则补读 `mock-data`
- 生成文件：
  - `infra/cloudflare/d1/seeds/generated/seed.generated.sql`

---

## 6. 推荐执行顺序

1. 创建 D1 数据库
2. 将真实的 `database_id` 写回 `apps/edge-worker/wrangler.toml`
3. 执行迁移
4. 运行 `python tools/scripts/generate_d1_seed.py`
5. 将 `infra/cloudflare/d1/seeds/generated/seed.generated.sql` 导入 D1
6. 在 Cloudflare 控制台或 `wrangler d1 execute` 中验收表与数据

---

## 7. 验收口径

本次验收不再看本地 `info_collector.db` 是否有数据，而是看：

1. Cloudflare D1 中是否存在目标表
2. Cloudflare D1 中是否已经导入现有正式数据
3. 后续所有“正式新增数据”是否都写入 D1

---

## 8. 当前限制说明

仓库已经完成了 D1 的配置、迁移文件和导入脚本准备。

真正创建 Cloudflare D1 数据库并执行迁移，还需要：

- 可用的 Cloudflare 登录态，或
- 可用的 Cloudflare API Token / Account 权限

如果本机没有现成凭据，就需要通过 `wrangler login` 或等价方式完成授权后再执行。
