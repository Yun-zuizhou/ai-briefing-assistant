# 2026-04-19-ArticlePage与HotTopics研发态文案清理

- 文档状态：进行中
- 记录日期：2026-04-19
- 记录类型：当前主线执行记录
- 目标：清掉正式前端中仍直接暴露给用户的“过渡态 / 真实接口过渡态 / 统一引用”研发口径，优先收口 `ArticlePage`，并顺手补齐 `HotTopicsPage` 同类文案。

## 1. 这轮为什么要做

当前阶段的明确要求之一，是继续清页面级最影响体感的产品尾差，不回到对象扩面或旧接口拼装。

本轮实际命中的用户可见问题有两类：

1. `ArticlePage` 仍直接向用户展示“当前详情仍处于过渡态”这类研发口径。
2. `HotTopicsPage` 弹层仍直接展示“真实接口过渡态”“统一内容引用”这类内部表达。

这些信息虽然对研发排障有意义，但不适合作为正式产品文案继续留在用户主路径上。

## 2. 本轮实际改动

### 2.1 `ArticlePage`

文件：

- `apps/web/src/pages/ArticlePage.tsx`

本轮处理：

1. 把“当前详情仍处于过渡态”改成更面向用户的“当前内容仍在持续补充”。
2. 把正文缺失提示改成“先查看摘要、来源和相关推荐，稍后再回来继续阅读”，不再强调研发态判断。
3. 把 `AI 摘要` 中直接暴露的 `detailStateReason` 改成用户可理解的说明语气。
4. 把相关推荐卡片右上角原本直接显示的 `contentRef` 内部标识，改成普通信息标签，不再把引用键直接暴露在页面上。

### 2.2 `HotTopicsPage`

文件：

- `apps/web/src/pages/HotTopicsPage.tsx`

本轮处理：

1. 删除“当前热点详情已切到真实接口过渡态”文案。
2. 删除弹层内直接展示的“统一内容引用”。
3. 改为只说明当前可先查看摘要、来源和分类信息，更完整解读会继续补充。

### 2.3 第二轮补充清理

文件：

- `apps/web/src/pages/ChatPage.tsx`
- `apps/web/src/pages/CollectionsPage.tsx`
- `apps/web/src/pages/HistoryLogsPage.tsx`

本轮继续处理：

1. `ChatPage` 的动作上下文卡片，不再直接展示 `sourceContentRef`，改成“已自动带上原内容上下文”的用户表达。
2. `CollectionsPage` 已移除列表卡片底部直接展示的“统一引用”。
3. `HistoryLogsPage` 已移除原始时间线卡片内直接展示的 `content_ref`，改成“已关联原始内容，可继续查看详情”的说明。

### 2.4 第三轮补充清理

文件：

- `apps/web/src/pages/ChatPage.tsx`
- `apps/web/src/pages/WeeklyReportPage.tsx`
- `apps/web/src/pages/MonthlyReportPage.tsx`
- `apps/web/src/pages/AnnualReportPage.tsx`

本轮继续处理：

1. `ChatPage` 中 `sourceContext / matchedBy / confidence` 的展示已改成更面向用户的自然语言，不再直出内部枚举和技术判断口径。
2. 周报 / 月报 / 年报中的数据可信度，已从原始 `low / medium / high` 值改成中文展示：`低 / 中 / 高`。

## 3. 当前结果判断

本轮之后，可以确认：

1. `ArticlePage` 当前最明显的研发态提示已从用户正面文案中移除。
2. `HotTopicsPage` 弹层中的接口态和引用键暴露已同步收口。
3. `ChatPage / CollectionsPage / HistoryLogsPage` 当前已同步收掉一批内部引用字段展示点。
4. `ChatPage` 的识别过程元信息与三类报告页的可信度表达，当前也已经完成一轮产品化清理。
5. 这轮属于用户可见主路径变化，应继续同步到阶段总表、子纲、总纲与承接卡。

## 4. 验证

本轮已执行：

1. `npm.cmd --prefix apps/web run build`

结果：

1. 构建已连续三轮通过。

## 5. 下一步入口

当前这条尾差收口后，页面层下一步更适合回到：

1. 继续补身份与权限链的人工验收与截图级证据。
2. 继续补 `Today / Actions / Growth / My / Weekly` 的真实页面验收。
3. 再按同样标准清理正式页面里其他仍直接暴露内部字段的展示点。
