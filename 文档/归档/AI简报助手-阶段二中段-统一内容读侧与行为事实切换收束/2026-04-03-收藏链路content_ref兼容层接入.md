# 收藏链路 content_ref 兼容层接入

- 文档状态：进行中
- 建立时间：2026-04-03
- 所属阶段：阶段二 - Today / 内容层设计与事实层收束
- 作用：记录 `favorites` 如何从 `item_type + item_id` 过渡到兼容统一内容引用 `content_ref`

---

## 1. 本轮处理的问题

当前统一内容层虽然已经有：

1. `content_ref`
2. `/api/v1/content/by-ref`
3. `Today / HotTopics / Collections -> ArticlePage`

但收藏链路仍停留在旧状态：

1. 后端 `favorites` 只认识 `item_type + item_id`
2. 前端收藏页每次都需要自己重新拼 `content_ref`
3. 收藏事实层还没有正式承认“统一内容引用”这件事

这会导致一个明显问题：

`统一内容读侧已经开始收口，但收藏层还没有开始对齐这条统一引用边界`

---

## 2. 本轮已完成的收束

### 2.1 后端

[favorites.py](/E:/python/杂谈-想法记录与实践/app/api/v1/favorites.py) 当前已补：

1. `FavoriteResponse` 新增 `content_ref`
2. `create_favorite` 已支持：
   - 旧方式：`item_type + item_id`
   - 新方式：`content_ref`
3. 若传入 `content_ref`，后端会先解析，再落回当前真实表结构

这次没有改表，也没有新建本地正式持久化方案。

当前仍然是：

`旧收藏表结构不变，但响应契约和写入入口已开始兼容统一引用`

### 2.2 前端

本轮已调整：

1. [page-data.ts](/E:/python/杂谈-想法记录与实践/prototype/src/types/page-data.ts)
2. [api.ts](/E:/python/杂谈-想法记录与实践/prototype/src/services/api.ts)
3. [CollectionsPage.tsx](/E:/python/杂谈-想法记录与实践/prototype/src/pages/CollectionsPage.tsx)
4. [ArticlePage.tsx](/E:/python/杂谈-想法记录与实践/prototype/src/pages/ArticlePage.tsx)
5. [HotTopicsPage.tsx](/E:/python/杂谈-想法记录与实践/prototype/src/pages/HotTopicsPage.tsx)

当前前端已改为：

1. 收藏响应优先使用后端返回的 `content_ref`
2. 新增收藏时，优先把当前页面已有的 `content_ref` 一起提交给后端
3. 收藏页不再只依赖页面层临时拼接引用键

---

## 3. 当前结构判断

本轮完成后，收藏链路已经进入：

`旧表结构承载 + 统一引用兼容层`

这意味着当前收藏层已经开始对统一内容层让路，但还没有真正完成内容事实层统一化。

---

## 4. 当前仍未完成

当前仍未完成：

1. `favorites` 表未正式落 `content_ref` 字段
2. 报告层还没有开始主读收藏里的统一内容引用
3. 历史层还没有与统一内容引用完全接轨
4. 统一内容实体层仍未正式化

因此本轮正确口径应为：

`收藏链路已进入 content_ref 兼容过渡态，但仍不是正式统一内容存储层`

---

## 5. 本轮验收结果

本轮已重新验收通过：

1. `pytest tests/test_dashboard_today.py`
2. 默认 `pytest`
3. 前端 `build`
4. 前端 `lint`

当前结果为：

1. `13 passed`
2. `19 passed, 1 skipped`
3. 前端构建通过
4. 前端 lint 通过

---

## 6. 当前最合理的下一步

在收藏兼容层接住 `content_ref` 之后，下一步最合理的是：

1. 让 `reports` 开始认识统一内容引用
2. 或继续把历史链路对齐到统一内容引用

当前不建议直接跳到：

1. `contents` 重表
2. 大规模迁移收藏表
3. 内容层全面重构

