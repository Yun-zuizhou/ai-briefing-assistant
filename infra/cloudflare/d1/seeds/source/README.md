# D1 Seed Source

- 当前仓库里的 `seed*.sql` 均由脚本从本地 SQLite / mock 数据生成。
- 生成产物统一输出到 `../generated/`。
- 本目录预留给后续需要长期维护的手写种子或人工校正 SQL。

## 手写演示种子

- `seed.today-briefing-semantic-demo.sql`：简报页语义流演示数据。用于本地 D1，覆盖 `test@example.com` 的关注项、今日内容候选、处理结果、待办候选和 `briefings.payload`。
