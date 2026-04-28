# 「时代与我」AI信息助手 - 项目结构

> 本文档提供项目的完整代码结构概览和快速导航索引。

---

## 📁 项目根目录

```
e:\python\杂谈-想法记录与实践/
├── app/                      # 🔧 后端应用 (FastAPI)
├── prototype/                # 🎨 前端原型 (React + TypeScript)
├── design-system/            # 🎨 设计系统
├── icons/                    # 🖼️ 图标资源
├── logos/                    # 🏷️ Logo设计
├── mock-data/                # 📊 模拟数据
├── .trae/                    # ⚙️ Trae配置和日志
└── 暂未整理/                 # 📦 待整理文件
```

---

## 🔧 后端结构 (app/)

### 目录结构

```
app/
├── main.py                # 应用入口
├── config.py              # 配置管理
├── database.py            # 数据库连接
├── init_db.py             # 数据库初始化
│
├── api/v1/                # API端点
│   ├── auth.py            # 认证API
│   ├── hot_topics.py      # 热点API
│   ├── rss.py             # RSS API
│   ├── opportunities.py   # 机会API
│   ├── todos.py           # 待办API
│   └── intent.py          # 意图识别API
│
├── models/                # 数据模型
│   ├── user.py            # 用户模型
│   ├── hot_topic.py       # 热点话题模型
│   ├── rss_article.py     # RSS文章模型
│   ├── rss_source.py      # RSS源模型
│   ├── opportunity.py     # 机会模型
│   └── todo.py            # 待办模型
│
├── crawler/               # 爬虫模块
│   ├── hot_topic_crawler.py    # 热点爬虫基类
│   ├── platform_crawlers.py    # 平台爬虫(微博/知乎/头条)
│   ├── rss_parser.py           # RSS解析器
│   ├── scheduler.py            # 定时任务调度器
│   └── sources/rss_sources.py  # RSS源配置
│
└── services/              # 服务层
    ├── ai_service.py      # AI服务
    ├── briefing/          # 简报服务
    ├── crawler/           # 爬虫服务
    └── data/              # 数据服务
```

### API端点清单

| 端点 | 方法 | 描述 | 文件 |
|------|------|------|------|
| `/api/v1/auth/register` | POST | 用户注册 | [auth.py](app/api/v1/auth.py) |
| `/api/v1/auth/login` | POST | 用户登录 | [auth.py](app/api/v1/auth.py) |
| `/api/v1/hot-topics` | GET | 获取热点列表 | [hot_topics.py](app/api/v1/hot_topics.py) |
| `/api/v1/hot-topics/crawl/{platform}` | POST | 触发爬虫 | [hot_topics.py](app/api/v1/hot_topics.py) |
| `/api/v1/rss` | GET | 获取RSS文章 | [rss.py](app/api/v1/rss.py) |
| `/api/v1/opportunities` | GET | 获取机会列表 | [opportunities.py](app/api/v1/opportunities.py) |
| `/api/v1/todos` | GET | 获取待办列表 | [todos.py](app/api/v1/todos.py) |
| `/api/v1/intent/parse` | POST | 解析用户意图 | [intent.py](app/api/v1/intent.py) |

---

## 🎨 前端结构 (prototype/src/)

### 目录结构

```
prototype/src/
├── main.tsx               # 应用入口
├── App.tsx                # 根组件 + 路由配置
├── index.css              # 全局样式
│
├── components/            # 组件
│   ├── business/         # 业务组件 (HotTopicCard, TopicCard等)
│   ├── layout/           # 布局组件 (Header, TabBar等)
│   └── ui/               # UI组件 (Button, Card, Input等)
│
├── pages/                 # 页面 (30+页面组件)
│   ├── HomePage.tsx      # 首页
│   ├── ChatPage.tsx      # 对话页面
│   ├── HotTopicsPage.tsx # 热点页面
│   └── ...
│
├── context/               # 上下文 (AppContext)
├── hooks/                 # 自定义Hooks
├── services/              # API服务
├── data/                  # 数据和类型定义
├── styles/                # 设计令牌
└── utils/                 # 工具函数
```

### 页面路由

| 路由 | 页面 | 描述 |
|------|------|------|
| `/` | HomePage | 首页信息流 |
| `/chat` | ChatPage | AI对话 |
| `/hot-topics` | HotTopicsPage | 热点列表 |
| `/todos` | TodoPage | 待办管理 |
| `/settings` | SettingsPage | 设置页面 |
| `/profile` | ProfilePage | 个人资料 |

---

## 📊 数据模型

### 核心模型关系

```
User ──┬── HotTopic (热点话题)
       ├── RSSArticle (RSS文章) ─── RSSSource (RSS源)
       ├── Opportunity (机会)
       └── Todo (待办事项)
```

### 模型字段概览

| 模型 | 核心字段 | 文件 |
|------|----------|------|
| User | username, email, interests | [user.py](app/models/user.py) |
| HotTopic | title, source, hot_value, categories | [hot_topic.py](app/models/hot_topic.py) |
| RSSArticle | title, summary, source_url, publish_time | [rss_article.py](app/models/rss_article.py) |
| Opportunity | title, description, deadline, status | [opportunity.py](app/models/opportunity.py) |
| Todo | title, status, priority, due_date | [todo.py](app/models/todo.py) |

---

## 🕷️ 爬虫模块

### 架构

```
BaseHotTopicCrawler (基类)
    ├── WeiboHotTopicCrawler (微博热搜)
    ├── ZhihuHotTopicCrawler (知乎热榜)
    └── ToutiaoHotTopicCrawler (今日头条)

RSSParser (RSS解析器)
    └── RSSAggregator (RSS聚合服务)

Scheduler (定时任务调度器)
    ├── RSS聚合: 每小时
    ├── 微博热搜: 每15分钟
    ├── 知乎热榜: 每20分钟
    └── 今日头条: 每20分钟
```

### 相关文件

| 文件 | 描述 |
|------|------|
| [hot_topic_crawler.py](app/crawler/hot_topic_crawler.py) | 热点爬虫基类 + 合规检查 |
| [platform_crawlers.py](app/crawler/platform_crawlers.py) | 微博/知乎/头条爬虫 |
| [rss_parser.py](app/crawler/rss_parser.py) | RSS解析器 |
| [scheduler.py](app/crawler/scheduler.py) | 定时任务调度器 |

---

## 📚 技术模块文档

位于 `.trae/idea-incubator/ideas/ai-info-collector-app/tech-modules/`

| 模块 | 名称 | 描述 |
|------|------|------|
| M1 | 后端基础架构 | 数据库、缓存、配置 |
| M2 | 用户认证模块 | 注册、登录、Token |
| M3 | 信息采集模块 | 爬虫、解析、存储 |
| M4 | 机会管理模块 | 机会CRUD、评分 |
| M5 | 行动规划模块 | 规划表、进度跟踪 |
| M6 | 资讯推荐模块 | 基于规划的推荐 |
| M7 | 智能提醒模块 | 定时提醒、推送 |
| M8 | 用户画像模块 | LLM生成画像 |
| M9 | 移动端前端 | React Native界面 |
| M10 | 用户意图识别 | NLU、槽位填充 |
| M11 | RSS聚合模块 | RSS订阅、聚合 |

---

## 🎨 设计资源

### 设计系统 (design-system/)

| 目录 | 内容 |
|------|------|
| backgrounds/ | 背景图案 (渐变、网格等) |
| wireframes/ | 线框图 |
| components/ | UI组件预览 |

### 图标库 (icons/)

- 50+ SVG图标
- 预览页面: [preview.html](icons/preview.html)

### Logo设计 (logos/)

- 8个概念设计
- 预览页面: [preview.html](logos/preview.html)

---

## 📋 规范文档

位于 `.trae/specs/`

| 目录 | 描述 |
|------|------|
| organize-code-structure/ | 代码结构整理 |
| implement-rss-aggregation/ | RSS聚合实现 |
| real-time-data-crawling/ | 实时数据爬取 |
| intelligent-intent-recognition/ | 智能意图识别 |
| build-react-prototype/ | React原型构建 |

---

## 🚀 快速启动

### 后端

```bash
cd app
pip install -r requirements.txt
uvicorn main:app --reload
```

### 前端

```bash
cd prototype
npm install
npm run dev
```

---

## 📝 开发进度

| 阶段 | 进度 |
|------|------|
| 需求分析 | ✅ 100% |
| 设计阶段 | ✅ 100% |
| 高保真原型 | ✅ 100% |
| 开发阶段 | 🔄 85% |
| 测试阶段 | 🔄 40% |
| 论文撰写 | 📝 20% |

---

*最后更新: 2026-03-29*