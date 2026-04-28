# Page Content Rhythm 标准

## 这轮解决的问题

当前正式 UI 副本虽然已经有稳定的 `Viewport Shell / App Shell`，但正文区仍然存在这些问题：

- 页面内普遍依赖零散的 `margin: 16px` 和内联 `display: grid`
- 同一种区块标题、说明盒、入口列表在不同页面重复手写
- 首页、成长、我的、预览页的纵向节奏不一致
- 页面内容虽然沿用同一视觉语言，但看起来仍然像草稿拼装

这说明当前正式 UI 里：

- 壳层体系是成熟的
- 正文布局体系是半成品

## 本轮形成的正式标准

### 1. `PageBody`

作用：

- 统一正文整体的底部安全区
- 让页面内容自然以区块堆叠
- 避免每个页面单独补底部留白

适用范围：

- 所有使用 `PageContent` 的主链页面

### 2. `PageSection`

作用：

- 统一区块上下间距
- 沿用已有 `section` 分隔线语言
- 让每一屏的信息颗粒感更明确

适用范围：

- 首页区块
- 成长页内容分组
- 我的页入口分组
- 预览页说明块

### 3. `PageSectionHeader`

作用：

- 统一“标题 + 副说明 + 弱操作”的结构
- 避免各页面继续手写不同版本的 section header

适用范围：

- 所有二级正文区块

### 4. `PagePanel`

作用：

- 统一暖纸信息面板
- 替代页面内散写的 `padding + background + border`
- 作为正文布局中的基础承载单元

当前支持：

- `default`
- `plain`
- `accent`

## 目前哪些页面已经开始接入

- `src/pages/TodayPage.tsx`
- `src/pages/GrowthPage.tsx`
- `src/pages/MyPage.tsx`
- `src/pages/PreviewPage.tsx`

## 仍然暂不进入正式标准的写法

以下仍保留为页面局部或业务局部，不应现在上升成全局标准：

1. `TodayActionCard`
   - 这是首页“值得行动的”业务卡，不等同于所有内容卡
2. 今日推荐区的兴趣关联文案
   - 属于首页推荐逻辑，不适合作为全站公共组件
3. `GrowthPage` 的用户徽标圆形数字块
   - 目前只服务成长页身份感表达，还不是通用统计组件
4. `PreviewPage` 的入口按钮组合
   - 仍属于预览页局部导航，不是正式产品全局入口模式

## 迁回正式前端时的优先顺序

建议迁回 `apps/web/src` 时按这个顺序：

1. `PageBody`
2. `PageSection`
3. `PageSectionHeader`
4. `PagePanel`
5. `TodayPage` 的业务收口

原因：

- 先迁骨架，能一次性修正多页正文节奏
- 再迁首页业务块，风险更低，收益更集中
