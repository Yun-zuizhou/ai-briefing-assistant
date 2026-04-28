# ChatExecute 真实回写

- 文档名称：ChatExecute 真实回写
- 文档状态：进行中
- 建立时间：2026-04-01
- 对应任务：阶段 3 与阶段 4 之间的关键衔接任务
- 代码落点：
  - `app/api/v1/chat.py`
  - `app/main.py`
  - `prototype/src/hooks/useChatLogic.ts`

---

## 1. 本次目标

本次目标不是一次性做完整对话系统，而是先让对话动作不再只停留在前端本地状态。

优先打通：

1. 创建待办
2. 记录想法
3. 更新关注
4. 同步写入历史

---

## 2. 已完成内容

## 2.1 新增后端路由

新增：

- `POST /api/v1/chat/recognize`
- `POST /api/v1/chat/execute`

其中：

- `recognize` 返回结构化识别结果
- `execute` 负责真实写入和标准化反馈

## 2.2 当前已支持的真实回写

### create_todo

- 写入 `todos`
- 写入 `history_entries`

### record_thought / fragmented_thought

- 写入 `notes`
- 写入 `history_entries`
- 增加 `user.total_thoughts`

### add_interest / remove_interest

- 写入 `users.interests`
- 写入 `history_entries`
- 在真实写入成功后，同步镜像到共享虚拟兴趣状态，供 Today 页当前聚合读取

### set_push_time

- 当前先写入 `history_entries`
- 设置持久化本身仍待后续专门设置模型接入

## 2.3 前端接入方式

当前 `useChatLogic.ts` 已改为：

1. 先调用 `recognizeIntent`
2. 再调用 `executeChat`
3. 若执行失败，再回退到本地动作摘要

这意味着：

- 识别和执行已经具备后端入口
- 前端执行反馈开始优先采用真实后端结果

---

## 3. 当前限制

本次仍然不是完整闭环，主要限制有：

1. `processIntent()` 仍保留本地状态更新逻辑，用于过渡期 UI 兼容
2. `set_push_time` 仍未真正写入专门设置模型
3. 行动页、成长页尚未切换为真实聚合接口读取
4. Today 页当前仍通过共享虚拟兴趣状态生成推荐，后续仍需与真实数据库事实层统一

因此当前状态应理解为：

- 对话写入能力已存在
- 页面读取真实写入结果仍待后续聚合接口接入

---

## 4. 下一步

最直接的后续是：

1. 开始行动页或成长页重构，并优先读取真实数据
2. 将阶段 4 的联调验证从“概念可见”推进到“刷新后仍成立、重进应用后仍成立”
3. 先完成 `Chat -> interest -> TodayPage` 的第一轮接口验证，再决定是否统一 Today 页兴趣来源
