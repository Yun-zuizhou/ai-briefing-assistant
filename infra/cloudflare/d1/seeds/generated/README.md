# Generated Seeds

**生成物，勿手工编辑。**

- 生成命令：`npm run db:d1:prepare`
- 生成源：`infra/cloudflare/d1/seeds/source/` + D1 migrations
- 生成日期：2026-04-16（最近一次）
- 总体积：约 15MB（16 files）

## 版本策略

当前全部文件已在 Git 中追踪。后续可评估：

1. 如果 seed 生成稳定且可复现 → 移入 `.gitignore`，依赖 `setup` 命令重新生成
2. 如果 seed 内容需人工审核/调整 → 调整在 `source/` 层完成，重新生成后提交

## 文件说明

| 文件 | 大小 | 说明 |
|------|------|------|
| `seed.master.sql` | 4.7K | 主入口，include 所有子文件 |
| `seed.generated.sql` | 6.8M | 聚合生成文件 |
| `seed.content.sql` | 2.0M | 内容聚合 |
| `seed.remote.sql` | 2.0M | 远程数据聚合 |
| `seed.content.rss_articles.sql` | 1.9M | RSS 文章聚合 |
| `seed.content.rss_articles.part01-07.sql` | 1.8M | RSS 文章分片 |
| `seed.content.hot_topics.sql` | 66K | 热点话题种子 |
| `seed.content.opportunities.sql` | 9.7K | 机会种子 |
| `seed.content.rss_sources.sql` | 8.3K | RSS 来源种子 |
| `seed.content.derived.sql` | 5.1K | 派生内容种子 |
