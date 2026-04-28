# dashboard 与 reports 兴趣事实层接轨

- 文档状态：进行中
- 建立时间：2026-04-03
- 所属阶段：阶段二 - Today / 内容层设计与事实层收束
- 作用：记录 `dashboard.py / reports.py` 如何从旧兴趣字段推进到 `user_interests` 主读

---

## 1. 本轮处理的问题

上一轮已完成：

1. `preferences.py` 兴趣配置链路优先读取 `user_interests`
2. `preferences/profile` 中 `active_interests` 已优先读取 `user_interests`

但 `Today / Reports` 曾停留在旧状态：

1. `dashboard.py` 曾主读 `users.interests`
2. `reports.py` 曾主读 `users.interests`
3. 这会导致兴趣配置页、Today 页、报告页对“当前真实兴趣”的理解不一致

---

## 2. 本轮已完成的接轨

### 2.1 Today

`/api/v1/dashboard/today` 现已改为：

1. 主读 `user_interests`
2. 若 `user_interests` 为空，则进入空兴趣正式态，不再回退读取 `users.interests`
3. 旧字段只保留影子同步职责，不再参与正式主读

这意味着当前 Today 兴趣来源顺序已明确为：

`正式态(user_interests) -> 空兴趣正式态`

### 2.2 Reports

`weekly / monthly / annual` 现已改为：

1. 主读 `user_interests`
2. 若 `user_interests` 为空，则保持空兴趣正式态，不再回退到 `users.interests`

这意味着报告页与兴趣配置页的事实层口径已开始对齐。

---

## 3. 当前结构判断

本轮完成后，兴趣事实层的接轨顺序已经推进为：

1. `preferences` 主读切换完成
2. `dashboard` 主读切换完成
3. `reports` 主读切换完成

当前仍未完成的是：

1. 清理 `users.interests` 的读侧兼容职责
2. 为 `user_interests` 补更强的真实业务测试
3. 进一步把 Today 的推荐排序、内容加工、内容整合建立在统一内容层之上

---

## 4. 当前结论

当前项目不再只是“把 `user_interests` 表接进来了”，而是已经把这张表推进到了：

`兴趣配置 -> Today -> Reports`

三条关键读取链路的主事实层位置。

但这仍然不是“兴趣体系完全收口”，因为：

1. 旧字段 `users.interests` 仍保留影子同步职责
2. Today 的内容层问题仍然不只是兴趣来源问题
3. `Chat` 的正式消息持久化与统一内容层仍未完成
