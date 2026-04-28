# Chat纠偏对象边界扩至history

- 文档状态：进行中
- 建立时间：2026-04-04
- 所属阶段：阶段二 - Today / 内容层设计与事实层收束
- 作用：记录本轮将 Chat 后端最小纠偏链从直接 `todo / note` 对象，扩展到“指向 `todo / note` 的 history 记录”

---

## 1. 本轮目标

上一轮 `reclassify` 已支持：

1. `todo`
2. `note`

本轮继续沿同一主线推进，但不盲目扩到 `favorites`。

当前只做：

`让 history 中那些真实指向 todo / note 的记录，也能进入最小纠偏链。`

---

## 2. 为什么先扩 history，不先扩 favorites

当前判断是：

1. `history` 更接近 Chat 动作沉淀与后续回看链路
2. 它天然会承接“我当时做了什么、现在要不要改口径”
3. `favorites` 本质上更偏内容收藏，不属于当前 Chat 纠偏主线核心对象

因此，这轮先扩 `history` 是顺主线，不是乱扩范围。

---

## 3. 本轮已完成

### 3.1 后端 `reclassify` 已支持 `history`

当前在：

- [chat.py](/E:/python/杂谈-想法记录与实践/app/api/v1/chat.py)

已支持：

- `correction_from=history:id`

当前行为是：

1. 先定位这条历史记录
2. 如果它指向 `todo / note`
3. 再把纠偏请求转发到对应对象的最小真实纠偏逻辑

这意味着当前纠偏入口已经不只支持“直接对象”，而开始支持“通过历史记录进入纠偏”。

### 3.2 接口级验证已补到 `history`

当前在：

- [test_api_mainline.py](/E:/python/杂谈-想法记录与实践/tests/test_api_mainline.py)

已新增：

1. `history -> note -> create_todo` 的最小纠偏验证

### 3.3 接口级验证入口结果已更新

当前重新执行：

- `npm.cmd run test:api-mainline`

结果已提升为：

- `16 passed`

这说明当前接口级验证不只覆盖：

1. `chat.execute`
2. `chat.recognize`
3. `chat.reclassify(todo/note)`

也已开始覆盖：

4. `chat.reclassify(history -> note/todo)`

---

## 4. 当前正确口径

当前应更新为：

1. Chat 后端最小纠偏链当前已覆盖：
   - `todo`
   - `note`
   - 指向 `todo / note` 的 `history`
2. `favorites` 当前仍不纳入 Chat 纠偏主线
3. 当前接口级验证入口 `npm.cmd run test:api-mainline` 已稳定为 `16 passed`

---

## 5. 下一步建议

顺着当前主线，下一步最合理的是：

1. 再判断是否需要把 `favorites` 纳入另一条“内容归档纠偏”子线
2. 或者继续深化当前 Chat 纠偏结果表达，例如补“纠偏后旧对象状态说明”的前端呈现
