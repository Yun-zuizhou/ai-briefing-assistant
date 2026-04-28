# Today 主链路 smoke 测试补强

- 文档状态：进行中
- 建立时间：2026-04-03
- 所属阶段：阶段二 - Today / 内容层设计与事实层收束
- 作用：记录当前默认 `pytest` 入口下，对 Today 主链路所补的 smoke 契约测试

---

## 1. 本轮补强目标

当前默认 `pytest` 虽然可信，但覆盖仍薄。

因此本轮不去引入新的重型测试基建，而是先补两组主链路 smoke 契约测试：

1. `Today -> Article -> Chat动作链路`
2. `user_interests -> preferences / dashboard / reports`

---

## 2. 本轮已补的测试

### 2.1 Today -> Article -> Chat动作链路

当前已新增对以下链路的回归验证：

1. `worth_acting` 可进入 `ArticlePage`
2. `ArticlePage` 的 `opportunity` 内容可继续进入 `ChatPage`
3. `ChatPage` 可接住 `presetInput / sourceContentRef / sourceTitle`

这条链路当前虽然仍是过渡态，但已经具备可回归的 smoke 契约测试。

### 2.2 兴趣事实层主读链路

当前已新增对以下链路的回归验证：

1. `preferences` 优先读取 `user_interests`
2. `dashboard` 优先读取 `user_interests`
3. `reports` 优先读取 `user_interests`

这意味着当前“兴趣事实层主读链路”已有一组最小回归锚点。

---

## 3. 当前判断

本轮完成后，默认 `pytest` 的意义已进一步提升为：

`不只是工程入口可信，还开始覆盖 Today 当前阶段最关键的主链路契约`

---

## 4. 当前仍未完成

当前仍未完成：

1. 真正基于 TestClient 的接口级集成测试
2. 数据驱动的内容排序断言
3. 详情页相关推荐的更细行为测试
4. Chat 执行动作的端到端闭环测试

因此当前正确表述应是：

`默认 pytest 已开始覆盖 Today 主链路，但仍属于轻量 smoke / 契约级补强，不等于测试体系已充分`
