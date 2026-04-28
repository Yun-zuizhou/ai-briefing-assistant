# user_interests 接轨方案

- 文档状态：进行中
- 建立时间：2026-04-03
- 所属阶段：阶段二 - Today / 内容层设计与事实层收束
- 作用：明确 `user_interests` 如何从表设计锚点进入当前代码现实

---

## 1. 当前事实

当前项目里，“兴趣”还没有真正进入独立关系表主链路。

当前真实状态是：

1. 后端主读写仍在 `users.interests`
2. `chat.py` 在写入 `users.interests` 后，会同步镜像到虚拟兴趣状态
3. `dashboard.py`、`reports.py`、`preferences.py` 当前都仍从 `users.interests` 读取
4. 前端 `InterestConfigPage`、`GrowthPage`、Chat 相关链路都依赖 `/api/v1/preferences/interests`

因此当前问题不是“有没有兴趣体系”，而是：

`兴趣体系已经存在，但事实层还停留在 users 表内嵌字段，而不是 user_interests 关系层。`

---

## 2. 为什么 user_interests 是当前最优先的正式接轨对象

`user_interests` 同时影响 5 条关键链路：

1. InterestConfig 配置链路
2. Chat 添加/移除关注链路
3. Today 推荐链路
4. Growth / Profile 画像链路
5. Reports 回顾链路

也就是说，只要这张表接得对，当前阶段至少有一半以上“内容事实层”会开始变稳。

---

## 3. 当前不应怎么做

当前不应直接做：

1. 一刀把所有读取都改到 `user_interests`
2. 立刻删除 `users.interests`
3. 一上来就做复杂迁移和全量回填脚本

原因：

1. 当前 `preferences / chat / dashboard / reports` 都依赖 `users.interests`
2. 当前还存在虚拟兴趣状态兜底链路
3. 直接切主读容易把 Today / Chat 过渡态打断

---

## 4. 当前建议的三步过渡关系

### 第一步：模型落位

先落：

1. `app/models/user_interest.py`
2. 让当前代码库正式承认 `user_interests` 是下一步主事实层

本轮已完成。

### 第二步：双写不切主读

下一轮建议做：

1. `preferences.py` 更新兴趣时，同时写：
   - `users.interests`
   - `user_interests`
2. `chat.py` 添加/移除兴趣时，同时写：
   - `users.interests`
   - `user_interests`

但读取仍先保持：

- 主读 `users.interests`
- 失败或为空时，再考虑 `user_interests`

这样做的目的是：

`先让新表开始积累真实数据，但不立即打断当前主链路`

当前状态更新：

`preferences.py` 与 `chat.py` 的双写已开始落地，但主读仍保持在 users.interests。`

### 第三步：逐步切主读

等双写稳定后，再按顺序切主读：

1. `preferences.py`
2. `dashboard.py`
3. `reports.py`
4. `chat.py`

最终再考虑让 `users.interests` 退化为兼容字段或迁移缓存。

当前状态更新：

1. `/api/v1/preferences/interests` 已改为优先读取 `user_interests`
2. `/api/v1/preferences/profile` 中 `active_interests` 已改为优先读取 `user_interests`
3. 当 `user_interests` 为空时，仍回退到 `users.interests`

这意味着当前已经从“双写不切主读”进入：

`preferences 先切主读，旧字段继续保留回退`

---

## 5. 当前最合理的落地顺序

### 本轮

1. 正式创建 `UserInterest` 最小模型骨架
2. 把本方案写入进行中文档

### 下一轮

1. 给 `preferences.py` 增加双写逻辑
2. 给 `chat.py` 增加双写逻辑
3. 不切主读

### 再下一轮

1. 先让 `/preferences/interests` 改为优先读 `user_interests`
2. 再让 `dashboard.py / reports.py` 跟进

当前状态更新：

1. `/preferences/interests` 主读切换已完成
2. 下一步不再是继续改 `preferences.py`
3. 下一批应进入 `dashboard.py / reports.py` 的兴趣事实层接轨

---

## 6. 当前结论

`user_interests` 现在不该被当成“以后再说的规划表”，而应该被视为阶段二第一批正式接轨对象。`

但它当前最正确的接法不是“立即全量切换”，而是：

`先模型落位 -> 再双写 -> 再逐步切主读`

截至当前，这条路径已推进到：

`模型落位 -> 双写 -> preferences 主读切换完成 -> dashboard / reports 待接`
