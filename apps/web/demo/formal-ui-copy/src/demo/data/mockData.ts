import type {
  HotTopic,
  Opportunity,
  LearningResource,
  Briefing,
  Thought,
  Todo,
  Favorite,
  Achievement,
  UserSettings,
  UserProfile,
  TopicCard,
  WeeklyReportData,
  MonthlyReportData,
  CollectedItem,
  UserInterest,
  UserRecord,
  DailyStory,
  Reminder,
  TodayTodo,
} from './types';

import hotTopicsData from '../../../demo/mock-data/hot-topics/hot-topics.json';
import opportunitiesData from '../../../demo/mock-data/opportunities/opportunities.json';
import learningResourcesData from '../../../demo/mock-data/learning-resources/learning-resources.json';
import morningBriefingData from '../../../demo/mock-data/briefings/morning-briefing.json';
import eveningBriefingData from '../../../demo/mock-data/briefings/evening-briefing.json';
import thoughtsData from '../../../demo/mock-data/user-data/thoughts.json';
import todosData from '../../../demo/mock-data/user-data/todos.json';
import favoritesData from '../../../demo/mock-data/user-data/favorites.json';
import achievementsData from '../../../demo/mock-data/user-data/achievements.json';
import userSettingsData from '../../../demo/mock-data/user-data/user-settings.json';
import userProfileData from '../../../demo/mock-data/user-data/user-profile.json';

export const loadHotTopics = (): HotTopic[] => {
  return hotTopicsData as HotTopic[];
};

export const loadOpportunities = (): Opportunity[] => {
  return opportunitiesData as Opportunity[];
};

export const loadLearningResources = (): LearningResource[] => {
  return learningResourcesData as LearningResource[];
};

export const loadBriefing = (type: 'morning' | 'evening' = 'morning'): Briefing => {
  return (type === 'morning' ? morningBriefingData : eveningBriefingData) as Briefing;
};

export const loadThoughts = (): Thought[] => {
  return thoughtsData as Thought[];
};

export const loadTodos = (): Todo[] => {
  return todosData as Todo[];
};

export const loadFavorites = (): Favorite[] => {
  return favoritesData as unknown as Favorite[];
};

export const loadAchievements = (): Achievement[] => {
  return achievementsData as unknown as Achievement[];
};

export const loadUserSettings = (): UserSettings => {
  return userSettingsData as unknown as UserSettings;
};

export const loadUserProfile = (): UserProfile => {
  return userProfileData as UserProfile;
};

export const loadUserData = () => {
  return {
    thoughts: loadThoughts(),
    todos: loadTodos(),
    favorites: loadFavorites(),
    achievements: loadAchievements(),
    settings: loadUserSettings(),
    profile: loadUserProfile(),
  };
};

const categoryIconMap: Record<string, string> = {
  'AI': '🤖',
  '技术': '💻',
  '大模型': '🧠',
  '政策': '📋',
  '法律': '⚖️',
  '职场': '💼',
  '远程工作': '🏠',
  '科技': '🔬',
  '编程': '👨‍💻',
  '工具': '🛠️',
  '设计': '🎨',
  '教育': '📚',
  '前端': '🌐',
  '后端': '⚙️',
  '数据分析': '📊',
  'DevOps': '🔧',
  '产品': '📱',
  '职业发展': '📈',
  '生活方式': '🌟',
  '效率': '⚡',
  '学习': '📖',
  '薪资': '💰',
  '互联网': '🌐',
  '硬件': '🖥️',
  'VR/AR': '🥽',
  '汽车': '🚗',
  '新能源': '🔋',
  '经济': '📈',
  '视频': '🎬',
  '内容创作': '✍️',
  '写作': '📝',
  'Web3': '🔗',
  '社交': '💬',
  '区块链': '⛓️',
  '量子计算': '⚛️',
  '前沿技术': '🚀',
};

const getCategoryIcon = (categories: string[]): string => {
  for (const category of categories) {
    if (categoryIconMap[category]) {
      return categoryIconMap[category];
    }
  }
  return '📰';
};

const extractTopComments = (topics: HotTopic[]): { content: string; source: string; likes: number }[] => {
  const allComments: { content: string; source: string; likes: number }[] = [];
  
  topics.forEach(topic => {
    if (topic.hot_comments) {
      topic.hot_comments.forEach(comment => {
        allComments.push({
          content: comment.content,
          source: comment.source,
          likes: comment.likes,
        });
      });
    }
  });
  
  return allComments
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3);
};

const extractGuideQuestions = (topics: HotTopic[]): { question: string; angle: string }[] => {
  const questions: { question: string; angle: string }[] = [];
  
  for (const topic of topics) {
    if (topic.guide_questions && topic.guide_questions.length > 0) {
      questions.push({
        question: topic.guide_questions[0].question,
        angle: topic.guide_questions[0].angle,
      });
      if (questions.length >= 2) break;
    }
  }
  
  return questions;
};

export const generateTopicCardsFromHotTopics = (hotTopics: HotTopic[]): TopicCard[] => {
  const categoryMap = new Map<string, HotTopic[]>();
  
  hotTopics.forEach(topic => {
    const mainCategory = topic.categories[0] || '其他';
    if (!categoryMap.has(mainCategory)) {
      categoryMap.set(mainCategory, []);
    }
    categoryMap.get(mainCategory)!.push(topic);
  });

  const topicCards: TopicCard[] = [];
  
  categoryMap.forEach((topics, category) => {
    const topComments = extractTopComments(topics);
    const guideQuestions = extractGuideQuestions(topics);
    
    const card: TopicCard = {
      id: category.toLowerCase().replace(/\s+/g, '-'),
      icon: getCategoryIcon(topics[0].categories),
      title: category,
      count: topics.length,
      trend: topics.length > 3 ? 'up' : 'stable',
      summary: topics.length > 0 
        ? `${topics[0].summary}${topics.length > 1 ? ` 等${topics.length}条${category}相关资讯。` : ''}`
        : '',
      insights: topComments.length > 0 
        ? topComments.map(c => c.content)
        : topics.slice(0, 3).map(t => t.title),
      topComments: topComments.length > 0 ? topComments : undefined,
      guideQuestions: guideQuestions.length > 0 ? guideQuestions : undefined,
      contents: topics.slice(0, 5).map(t => ({
        id: String(t.id),
        title: t.title,
        source: t.source,
        url: t.source_url,
        publishedAt: t.published_at,
      })),
      actions: {
        recordThought: true,
        collectTopic: true,
        viewTrend: true,
        createPlan: false,
        setReminder: false,
      },
    };
    topicCards.push(card);
  });

  return topicCards.slice(0, 5);
};

export const generateOpportunityTopicCard = (opportunities: Opportunity[]): TopicCard => {
  const remoteOpps = opportunities.filter(o => o.location.includes('远程'));
  const nearestDeadline = remoteOpps.length > 0 
    ? remoteOpps.reduce((nearest, o) => 
        new Date(o.deadline) < new Date(nearest.deadline) ? o : nearest
      ).deadline 
    : '';
  
  const insights = remoteOpps.slice(0, 3).map(o => {
    const deadlineStr = new Date(o.deadline).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    return `${o.title} · ${o.reward} · 截止${deadlineStr}`;
  });
  
  return {
    id: 'remote-job',
    icon: '💼',
    title: '远程工作机会',
    count: remoteOpps.length,
    trend: 'new',
    summary: `今日新增${remoteOpps.length}个远程机会，薪资${remoteOpps[0]?.reward || '面议'}，最近截止日期：${nearestDeadline ? new Date(nearestDeadline).toLocaleDateString('zh-CN') : '待定'}。`,
    insights,
    contents: remoteOpps.slice(0, 5).map(o => ({
      id: String(o.id),
      title: o.title,
      source: o.source,
      url: o.source_url,
      publishedAt: o.published_at,
    })),
    guideQuestions: [
      { question: '这些机会是否符合你的职业发展方向？', angle: '职业规划' },
      { question: '你具备哪些岗位要求的技能？', angle: '能力评估' },
    ],
    actions: {
      recordThought: true,
      collectTopic: true,
      viewTrend: true,
      createPlan: true,
      setReminder: true,
    },
  };
};

export const generateWeeklyReportData = (): WeeklyReportData => {
  const profile = loadUserProfile();
  const thoughts = loadThoughts();
  
  return {
    overview: {
      period: '2026.03.08 - 2026.03.14',
      viewed: profile.total_read,
      recorded: profile.total_thoughts,
      collected: loadFavorites().length,
      completed: profile.total_completed,
      streak: 7,
    },
    topicTrends: [
      {
        id: 'ai-tech',
        icon: '🤖',
        title: 'AI技术前沿',
        heatData: {
          current: 85,
          previous: 50,
          change: 35,
          trend: 'up',
        },
        hotSpot: {
          title: 'GPT-5发布',
          discussionCount: 156,
          userParticipation: 3,
          summary: '本周OpenAI发布GPT-5技术预览版，引发广泛讨论。多模态能力成为焦点，AI Agent概念持续升温。',
        },
        insights: [
          'GPT-5的发布标志着AI进入多模态时代',
          'AI Agent成为新的竞争焦点，值得持续关注',
          '国产大模型讨论热度下降，可能进入调整期',
        ],
      },
    ],
    growth: {
      stats: {
        viewed: profile.total_read,
        recorded: profile.total_thoughts,
        collected: loadFavorites().length,
        completed: profile.total_completed,
      },
      trajectory: {
        title: '持续探索的一周',
        description: profile.growth_trajectory,
        keywords: profile.focus_areas,
      },
      selectedThoughts: thoughts.slice(0, 3).map(t => ({
        id: t.id,
        date: new Date(t.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        content: t.content,
      })),
      suggestions: [
        '继续关注AI Agent相关内容',
        '完成简历投递计划',
        '尝试学习Prompt Engineering',
      ],
    },
  };
};

export const generateMonthlyReportData = (): MonthlyReportData => {
  const profile = loadUserProfile();
  const thoughts = loadThoughts();
  
  return {
    overview: {
      period: '2026年3月',
      viewed: profile.total_read,
      recorded: profile.total_thoughts,
      collected: loadFavorites().length,
      completed: profile.total_completed,
      streak: 28,
    },
    topicTrends: [
      {
        id: 'ai-tech',
        icon: '🤖',
        title: 'AI技术前沿',
        heatData: {
          current: 120,
          previous: 85,
          change: 35,
          trend: 'up',
        },
        hotSpot: {
          title: 'GPT-5发布',
          discussionCount: 520,
          userParticipation: 12,
          summary: '本月AI领域最重大事件是GPT-5发布，引发广泛讨论。AI Agent概念持续升温，成为新的竞争焦点。',
        },
        insights: [
          'GPT-5的发布标志着AI进入多模态时代',
          'AI Agent成为行业新热点，值得深入学习',
          '国产大模型正在快速追赶',
          'Prompt Engineering技能越来越重要',
        ],
        userAttentionChange: {
          change: 45,
          newTopics: ['Prompt Engineering'],
        },
      },
    ],
    growth: {
      stats: {
        viewed: profile.total_read,
        recorded: profile.total_thoughts,
        collected: loadFavorites().length,
        completed: profile.total_completed,
      },
      comparison: {
        current: [profile.total_read, profile.total_thoughts, loadFavorites().length, profile.total_completed],
        previous: [65, 18, 8, 12],
        change: [37, 78, 87, 75],
      },
      trajectory: {
        title: '稳步成长的月份',
        description: profile.growth_trajectory,
        keywords: [...profile.focus_areas, '被动关注', '主动学习', '实践探索'],
      },
      selectedThoughts: thoughts.map(t => ({
        id: t.id,
        date: new Date(t.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        content: t.content,
      })),
      suggestions: [
        '深入学习Prompt Engineering',
        '关注AI Agent的实际应用案例',
        '完成远程工作投递计划',
      ],
    },
  };
};

export const generateCollectedItems = (): CollectedItem[] => {
  const favorites = loadFavorites();
  
  return favorites.map(f => ({
    id: f.id,
    type: f.item_type,
    category: f.item_type === 'hot_topic' ? '热点' : f.item_type === 'opportunity' ? '机会' : '学习',
    title: f.item_title,
    summary: f.item_summary,
    source: f.item_source,
    sourceUrl: f.item_url,
    collectedAt: f.created_at.split('T')[0],
    tracking: false,
  }));
};

export const generateUserInterests = (): UserInterest[] => {
  const profile = loadUserProfile();
  
  return profile.interests.map((interest, index) => ({
    id: String(index + 1),
    name: interest,
    icon: getCategoryIcon([interest]),
    active: true,
    frequency: 'daily' as const,
  }));
};

export const generateUserRecords = (): UserRecord[] => {
  const thoughts = loadThoughts();
  
  return thoughts.map(t => ({
    id: t.id,
    date: t.created_at.split('T')[0],
    content: t.content,
    summary: t.content.slice(0, 30) + '...',
  }));
};

export const generateReminders = (): Reminder[] => {
  const todos = loadTodos().filter(t => t.status === 'pending');
  
  return todos.slice(0, 2).map(t => ({
    id: t.id,
    type: 'deadline' as const,
    title: t.content,
    content: t.related_title ? `${t.related_title} · 截止${t.deadline}` : `截止${t.deadline}`,
    action: '查看详情',
    itemId: t.related_id || undefined,
  }));
};

export const generateTodayTodos = (): TodayTodo[] => {
  const todos = loadTodos();
  
  return todos.map(t => ({
    id: t.id,
    content: t.content,
    priority: t.related_type ? 3 : 2,
    estimatedTime: '30分钟',
    done: t.status === 'completed',
    createdAt: t.created_at.split('T')[0],
  }));
};

export const generateDailyStories = (): DailyStory[] => {
  const thoughts = loadThoughts();
  const profile = loadUserProfile();
  
  return [{
    id: 1,
    date: new Date().toISOString().split('T')[0],
    type: 'daily',
    title: '探索与思考的一天',
    content: `今天你关注了${profile.total_read}条内容，记录了${thoughts.length}条想法。你正在持续探索AI领域，同时保持对学习的热情。`,
    stats: {
      viewed: profile.total_read,
      collected: loadFavorites().length,
      recorded: thoughts.length,
    },
    highlights: thoughts.slice(0, 2).map(t => t.content.slice(0, 20)),
    literaryContent: '晨光熹微时，你已在知识的海洋中启航。AI技术的发展如同一颗新星划过天际，你驻足凝望，思索着技术浪潮中人的位置。',
    feedback: '你今天的思考很有深度！建议可以尝试将AI学习与实践结合。',
    journalSummary: `今日记录了${thoughts.length}条想法，这些零散的思绪，都是你认知成长的足迹。`,
  }];
};

export const userInterests: UserInterest[] = generateUserInterests();

export const hotTopics: HotTopic[] = loadHotTopics();

export const todayPushes = loadHotTopics().slice(0, 4).map(topic => ({
  id: topic.id,
  type: 'news',
  category: topic.categories[0],
  title: topic.title,
  summary: topic.summary,
  source: topic.source,
  sourceUrl: topic.source_url,
  time: topic.published_at,
  collected: false,
}));

export const collectedItems: CollectedItem[] = generateCollectedItems();

export const userRecords: UserRecord[] = generateUserRecords();

export const dailyStories: DailyStory[] = generateDailyStories();

export const weeklyReport = {
  week: '2024.03.09 - 2024.03.15',
  title: '持续探索的一周',
  summary: '这一周，你关注了23条资讯，收藏了8条内容，记录了5条想法。',
  topCategories: [
    { name: 'AI咨询', count: 15 },
    { name: '词类研究', count: 5 },
    { name: '兼职信息', count: 3 },
  ],
  growth: [
    { metric: '关注内容', value: 23, change: '+8' },
    { metric: '收藏内容', value: 8, change: '+3' },
    { metric: '记录想法', value: 5, change: '+2' },
  ],
  insights: '你对AI技术发展保持高度关注，同时也在积极寻找职业发展机会。',
};

export const monthlyReport = {
  month: '2024年3月',
  title: '稳步成长的月份',
  summary: '这个月，你累计关注了89条资讯，收藏了32条内容，记录了18条想法。',
  topCategories: [
    { name: 'AI咨询', count: 52 },
    { name: '词类研究', count: 21 },
    { name: '兼职信息', count: 16 },
  ],
  growth: [
    { metric: '关注内容', value: 89, change: '+35' },
    { metric: '收藏内容', value: 32, change: '+12' },
    { metric: '记录想法', value: 18, change: '+7' },
  ],
  keywords: ['AI', '词类研究', '职业发展', '远程工作'],
  insights: '这个月你的成长轨迹清晰可见。你对AI领域的关注持续深入，同时在职业发展上也开始行动。',
};

export const chatHistory: { id: number; role: 'assistant' | 'user'; content: string }[] = [
  {
    id: 1,
    role: 'assistant',
    content: '你好！我是你的AI助手，我可以帮你：\n\n• 收集特定领域的信息并每日推送\n• 记录你的想法并整理成摘要\n• 生成你的每日故事\n\n有什么可以帮你的？',
  },
];

export const reminders: Reminder[] = generateReminders();

export const todayTodos: TodayTodo[] = generateTodayTodos();

export const todayTopicCards: TopicCard[] = [
  ...generateTopicCardsFromHotTopics(loadHotTopics()),
  generateOpportunityTopicCard(loadOpportunities()),
];

export const weeklyReportData: WeeklyReportData = generateWeeklyReportData();

export const monthlyReportData: MonthlyReportData = generateMonthlyReportData();
