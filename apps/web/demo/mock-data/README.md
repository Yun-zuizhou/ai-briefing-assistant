# 简报助手App 虚拟数据

> 本文件夹包含简报助手App开发和测试所需的虚拟数据

---

## 数据结构概览

```
mock-data/
├── hot-topics/              # 热点资讯数据
│   └── hot-topics.json      # 22条热点资讯
├── opportunities/           # 机会信息数据
│   └── opportunities.json   # 22条机会信息
├── learning-resources/      # 学习资源数据
│   └── learning-resources.json  # 22条学习资源
├── briefings/               # 简报数据
│   ├── morning-briefing.json    # 晨间简报示例
│   └── evening-briefing.json    # 晚间简报示例
└── user-data/               # 用户数据
    ├── todos.json           # 待办事项
    ├── thoughts.json        # 想法记录
    ├── favorites.json       # 收藏内容
    ├── achievements.json    # 成就徽章
    ├── user-settings.json   # 用户设置
    └── user-profile.json    # 用户画像
```

---

## 数据说明

### 1. 热点资讯（HotTopic）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 唯一标识 |
| title | string | 标题 |
| summary | string | 简报摘要（100字以内） |
| source | string | 来源平台 |
| source_url | string | 原文链接 |
| categories | array | 分类标签 |
| published_at | datetime | 发布时间 |
| guide_questions | array | 引导问题 |
| hot_comments | array | 热门评论 |

**数据量**：22条

**分类覆盖**：
- AI技术、大模型
- 远程工作、职场
- 科技硬件、VR/AR
- 政策法规
- 编程开发

### 2. 机会信息（Opportunity）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 唯一标识 |
| title | string | 标题 |
| summary | string | 简报摘要 |
| source | string | 来源平台 |
| source_url | string | 原文链接 |
| type | string | 类型：parttime/submission/contest/job |
| reward | string | 薪资/奖励 |
| location | string | 地点 |
| requirements | array | 要求 |
| deadline | string | 截止日期 |

**数据量**：22条

**类型分布**：
- parttime（兼职）：8条
- job（全职）：6条
- submission（征稿）：4条
- contest（比赛）：4条

### 3. 学习资源（LearningResource）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 唯一标识 |
| title | string | 标题 |
| summary | string | 简报摘要 |
| source | string | 来源平台 |
| source_url | string | 原文链接 |
| category | string | 分类 |
| tags | array | 标签 |
| difficulty | string | 难度：beginner/intermediate/advanced |
| format | string | 格式：article/video/course |
| duration | string | 预计时长 |

**数据量**：22条

**难度分布**：
- beginner（入门）：10条
- intermediate（进阶）：8条
- advanced（高级）：4条

### 4. 简报数据（Briefing）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 唯一标识 |
| user_id | int | 用户ID |
| briefing_date | date | 简报日期 |
| briefing_type | string | 类型：morning/evening |
| info_tracking | object | 信息追踪模块 |
| todo_reminders | object | 待办提醒模块 |
| personal_narrative | object | 个人叙事模块 |
| behavior_stats | object | 行为统计 |
| streak_days | int | 连续打卡天数 |

**数据量**：2条（晨间+晚间）

### 5. 用户数据

#### 待办事项（Todo）
- 5条待办示例
- 包含pending和completed状态
- 关联机会信息和学习资源

#### 想法记录（Thought）
- 5条想法示例
- 包含AI自动标签
- 关联简报来源

#### 收藏内容（Favorite）
- 5条收藏示例
- 覆盖机会、资讯、资源三种类型

#### 成就徽章（Achievement）
- 4个徽章示例
- 包含获取条件和时间

#### 用户设置（UserSettings）
- 推送时间设置
- 内容偏好设置
- 关注主题列表

#### 用户画像（UserProfile）
- 兴趣领域
- 行为统计
- 成长轨迹描述
- 等级系统

---

## 使用示例

### 加载热点资讯数据

```javascript
import hotTopics from './mock-data/hot-topics/hot-topics.json';

// 获取AI相关热点
const aiTopics = hotTopics.filter(topic => 
  topic.categories.includes('AI')
);

// 获取最近3天的热点
const recentTopics = hotTopics.filter(topic => {
  const publishDate = new Date(topic.published_at);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  return publishDate >= threeDaysAgo;
});
```

### 生成简报

```javascript
import hotTopics from './mock-data/hot-topics/hot-topics.json';
import opportunities from './mock-data/opportunities/opportunities.json';
import learningResources from './mock-data/learning-resources/learning-resources.json';

function generateMorningBriefing(userId) {
  return {
    briefing_type: 'morning',
    info_tracking: {
      hot_topics: hotTopics.slice(0, 3),
      opportunities: opportunities.filter(o => o.type === 'parttime').slice(0, 2),
      learning_resources: learningResources.slice(0, 1)
    },
    // ... 其他模块
  };
}
```

### 模拟用户互动

```javascript
import todos from './mock-data/user-data/todos.json';
import thoughts from './mock-data/user-data/thoughts.json';

// 用户回复简报创建待办
function createTodoFromReply(userReply, relatedContent) {
  return {
    content: extractActionFromReply(userReply),
    related_type: relatedContent.type,
    related_id: relatedContent.id,
    related_title: relatedContent.title,
    status: 'pending'
  };
}

// 用户回复简报记录想法
function createThoughtFromReply(userReply) {
  return {
    content: userReply,
    tags: generateTagsWithAI(userReply),
    sentiment: analyzeSentiment(userReply)
  };
}
```

---

## 数据更新策略

| 数据类型 | 更新频率 | 说明 |
|----------|----------|------|
| 热点资讯 | 每日 | 模拟真实热点更新 |
| 机会信息 | 每周 | 保持截止日期有效 |
| 学习资源 | 每月 | 添加新资源 |
| 用户数据 | 实时 | 根据用户行为更新 |

---

## 注意事项

1. **虚拟数据**：所有数据均为虚拟生成，用于开发和测试
2. **链接格式**：原文链接为虚拟格式，实际开发需替换为真实链接
3. **时间设置**：截止日期设置为当前日期之后，确保数据有效性
4. **数据关联**：用户数据中的关联ID指向对应数据文件中的记录

---

*版本：v1.0*
*创建日期：2026年3月13日*
