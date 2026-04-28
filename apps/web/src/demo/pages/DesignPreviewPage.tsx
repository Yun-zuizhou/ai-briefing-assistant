import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Newspaper, User, CheckSquare, FileText, MessageCircle } from 'lucide-react';

interface TopicData {
  id: string;
  icon: string;
  title: string;
  color: string;
  count: number;
  summary: string;
  insights: string[];
  sources: { title: string; url: string }[];
}

const mockTopics: TopicData[] = [
  {
    id: 'ai',
    icon: '🤖',
    title: '人工智能',
    color: '#1E3A5F',
    count: 5,
    summary: 'GPT-5发布，推理能力首次超越人类基准。多模态理解能力提升200%，长文本处理支持100K tokens。',
    insights: [
      '推理能力超越人类基准，数学证明表现突出',
      '多模态融合度提升，图文理解更接近人类水平',
      '行业应用门槛降低，中小企业可快速接入',
    ],
    sources: [
      { title: 'OpenAI官方博客', url: '#' },
      { title: 'TechCrunch深度解读', url: '#' },
    ],
  },
  {
    id: 'work',
    icon: '💼',
    title: '远程工作',
    color: '#2D5A27',
    count: 3,
    summary: '多家互联网公司开放远程运营岗位，薪资区间200-300元/天。适合寻求灵活工作方式的求职者。',
    insights: [
      '远程办公，时间灵活',
      '需具备社群运营、内容策划基础能力',
      '招聘截止日期：3月20日',
    ],
    sources: [
      { title: 'BOSS直聘岗位详情', url: '#' },
      { title: '电鸭社区推荐', url: '#' },
    ],
  },
  {
    id: 'life',
    icon: '🌿',
    title: '生活',
    color: '#8B4513',
    count: 2,
    summary: '专家建议，每天保持30分钟运动，充足睡眠7-8小时。春季是调理身体的好时机。',
    insights: [
      '每日运动30分钟，增强体质',
      '规律作息，保证7-8小时睡眠',
      '多吃新鲜蔬果，均衡营养',
    ],
    sources: [
      { title: '健康时报专题', url: '#' },
    ],
  },
];

export default function DesignPreviewPage() {
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState<string>('ai');
  
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = `星期${weekDays[today.getDay()]}`;

  const activeTopicData = useMemo(() => 
    mockTopics.find(t => t.id === activeTopic) || mockTopics[0],
    [activeTopic]
  );

  const totalInsights = useMemo(() => 
    mockTopics.reduce((sum, t) => sum + t.insights.length, 0),
    []
  );

  const todoProgress = { done: 3, total: 7 };

  return (
    <div className="preview-page">
      <header className="preview-header">
        <div className="header-top">
          <div className="header-date">
            <span className="date-day">{dateStr}</span>
            <span className="date-week">{weekDay}</span>
          </div>
          <h1 className="header-title">每日简报</h1>
          <p className="header-subtitle">为你精选 {totalInsights} 条洞察</p>
        </div>
        
        <nav className="topic-nav">
          {mockTopics.map((topic) => (
            <button
              key={topic.id}
              className={`topic-nav-item ${activeTopic === topic.id ? 'active' : ''}`}
              onClick={() => setActiveTopic(topic.id)}
              style={{
                '--topic-color': topic.color,
              } as React.CSSProperties}
            >
              <span className="topic-nav-icon">{topic.icon}</span>
              <span className="topic-nav-label">{topic.title}</span>
              <span className="topic-nav-count">{topic.count}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="preview-content">
        <section className="hero-card" style={{ '--topic-color': activeTopicData.color } as React.CSSProperties}>
          <div className="hero-header">
            <div className="hero-icon">{activeTopicData.icon}</div>
            <div className="hero-meta">
              <h2 className="hero-title">{activeTopicData.title}</h2>
              <span className="hero-count">{activeTopicData.count} 条来源</span>
            </div>
          </div>
          
          <p className="hero-summary">{activeTopicData.summary}</p>
          
          <div className="hero-insights">
            <div className="insights-header">
              <span className="insights-label">关键洞察</span>
              <span className="insights-count">{activeTopicData.insights.length} 条</span>
            </div>
            <ul className="insights-list">
              {activeTopicData.insights.map((insight, idx) => (
                <li key={idx} className="insight-item">
                  <span className="insight-marker">✦</span>
                  <span className="insight-text">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-sources">
            <span className="sources-label">来源</span>
            <div className="sources-list">
              {activeTopicData.sources.map((source, idx) => (
                <a key={idx} href={source.url} className="source-link">
                  <span className="source-icon">↗</span>
                  <span className="source-title">{source.title}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="hero-actions">
            <button className="action-btn primary">
              <span className="action-icon">✏️</span>
              记录想法
            </button>
            <button className="action-btn">
              <span className="action-icon">📑</span>
              收藏
            </button>
          </div>
        </section>

        <section className="quick-stats">
          <div className="stat-card">
            <div className="stat-value">{totalInsights}</div>
            <div className="stat-label">今日洞察</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{todoProgress.done}/{todoProgress.total}</div>
            <div className="stat-label">待办完成</div>
          </div>
          <div className="stat-card streak">
            <div className="stat-value">7</div>
            <div className="stat-label">连续打卡</div>
          </div>
        </section>

        <section className="todo-preview">
          <div className="section-header">
            <span className="section-icon">📋</span>
            <span className="section-title">待办提醒</span>
            <button className="section-more" onClick={() => navigate('/todo')}>
              查看全部 →
            </button>
          </div>
          <div className="todo-list">
            <div className="todo-item">
              <div className="todo-checkbox" />
              <div className="todo-content">
                <div className="todo-title">投递简历（远程运营岗位）</div>
                <div className="todo-meta">
                  <span className="todo-deadline">截止：3月20日</span>
                </div>
              </div>
            </div>
            <div className="todo-item done">
              <div className="todo-checkbox checked">✓</div>
              <div className="todo-content">
                <div className="todo-title done">阅读GPT-5技术白皮书</div>
                <div className="todo-meta">已完成</div>
              </div>
            </div>
          </div>
        </section>

        <section className="narrative-section">
          <div className="section-header">
            <span className="section-icon">📖</span>
            <span className="section-title">个人叙事</span>
          </div>
          <div className="narrative-card">
            <span className="narrative-quote">"</span>
            <p className="narrative-text">
              今天你关注了<strong>{mockTopics.length}</strong>个主题，
              获取了<strong>{totalInsights}</strong>条洞察。
              你正在持续追踪多个领域，保持这种好奇心！
            </p>
            <div className="narrative-streak">
              🔥 连续打卡 7 天
            </div>
          </div>
        </section>

        <div className="chat-entry">
          <div className="chat-icon">💬</div>
          <div className="chat-hint">
            <div className="chat-title">回复简报</div>
            <div className="chat-desc">记录想法、创建待办、提问...</div>
          </div>
          <span className="chat-arrow">→</span>
        </div>
      </main>

      <PreviewTabBar />
    </div>
  );
}

const tabs = [
  { path: '/today', icon: Newspaper, label: '简报' },
  { path: '/todo', icon: CheckSquare, label: '待办' },
];

const rightTabs = [
  { path: '/log', icon: FileText, label: '日志' },
  { path: '/me', icon: User, label: '我的' },
];

function PreviewTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/today') {
      return location.pathname === '/today';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="newspaper-tabbar">
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`newspaper-tabbar-item ${active ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span className="newspaper-tabbar-label">{tab.label}</span>
          </button>
        );
      })}

      <div className="tab-convex-wrapper">
        <button className="tab-convex-btn">
          <div className="convex-icon">
            <MessageCircle size={22} />
          </div>
          <span className="convex-label">对话</span>
        </button>
      </div>

      {rightTabs.map((tab) => {
        const active = isActive(tab.path);
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`newspaper-tabbar-item ${active ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span className="newspaper-tabbar-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
