# 第二批第二阶段：Growth 与 Profile 真实接口过渡态

- 文档状态：进行中
- 建立时间：2026-04-02
- 所属阶段：第二批缺失事实层接入的第二阶段

---

## 1. 本轮目标

把以下页面从 `AppContext` 主驱动进一步切到真实接口过渡态：

1. `GrowthPage`
2. `ProfilePage`

---

## 2. 本轮实现策略

本轮没有直接上完整 `user_profiles` 持久化表，而是先补了一个：

- 真实画像聚合接口

接口位置：

- `GET /api/v1/preferences/profile`

其作用不是作为最终正式画像模型，而是先让 Growth / Profile 两页摆脱纯前端 context 拼装。

这意味着本轮实现仍属于：

`真实接口过渡态`

而不是最终正式态。

---

## 3. 本轮新增与修改

### 3.1 后端

修改：

1. `app/api/v1/preferences.py`

新增能力：

1. 基于真实数据聚合返回：
   - active_interests
   - notes_count
   - favorites_count
   - completed_todos
   - total_todos
   - history_count
   - radar_metrics
   - persona_summary
   - growth_keywords

当前聚合数据来源：

1. `users.interests`
2. `notes`
3. `favorites`
4. `todos`
5. `history_entries`

### 3.2 前端

修改：

1. `prototype/src/services/api.ts`
2. `prototype/src/pages/GrowthPage.tsx`
3. `prototype/src/pages/ProfilePage.tsx`

新增前端接口方法：

1. `getUserProfile`

---

## 4. 本轮结果

### 4.1 `GrowthPage`

已完成：

1. 活跃兴趣改为从真实画像接口读取
2. 一句话画像改为从真实画像接口读取
3. 关键词优先使用真实画像接口返回
4. 记录数与历史数优先以真实接口事实层为准

当前判断：

`GrowthPage 已进一步摆脱 AppContext 主驱动，进入更完整的真实接口过渡态。`

### 4.2 `ProfilePage`

已完成：

1. 雷达图改为基于真实接口聚合数据绘制
2. 数据概览改为真实记录 / 收藏 / 待办 / 关注数量
3. AI 用户画像描述改为真实接口聚合文案
4. 成长关键词改为真实接口聚合结果

当前判断：

`ProfilePage 已从纯前端统计展示态，进入真实接口过渡态。`

---

## 5. 当前边界

本轮必须明确的边界是：

### 已成立

1. `GrowthPage` 和 `ProfilePage` 的主数据源已经不再是纯 `AppContext`
2. 页面现在主要依赖真实接口聚合结果

### 尚未成立

1. `user_profiles` 独立画像表尚未正式落地
2. 画像文案还不是“正式画像生成链路”的产物
3. 报告体系仍未接入真实 `reports`

因此，本轮正确表述应该是：

`Growth 与 Profile 已进入真实接口过渡态，但画像事实层仍是实时聚合过渡方案，不是最终正式画像体系。`

---

## 6. 验证结果

本轮已完成：

1. 前端构建验证通过
   - `npm.cmd run build`
2. 后端偏好接口文件 Python 语法编译通过

当前没有新增构建阻塞。

---

## 7. 下一步建议

当前最合理的继续方向已经进一步收缩为：

1. `Reports` 系列接入真实 `reports` 事实层
2. `ArticlePage` 接统一内容引用规则
3. 然后再集中处理 `Today / Chat / 内容聚合层`

---

## 8. 本轮一句话结论

本轮完成后，成长中心相关的两个关键页面已经不再主要依赖前端 context：

`GrowthPage 和 ProfilePage 已进入真实接口过渡态。`
