import type { MonthlyReportData, WeeklyReportData } from './types';

export const weeklyReport: {
  week: string;
  title: string;
  summary: string;
  topCategories: Array<{ name: string; count: number }>;
  growth: Array<{ metric: string; value: number; change: string }>;
  insights: string;
} = {
  week: '2026.04.01 - 2026.04.07',
  title: '本周故事回看',
  summary: '这一周的主线不是继续扩面，而是把 Today、Growth、Actions 逐步收成可验证、可解释、可回看的闭环。',
  topCategories: [
    { name: 'AI', count: 8 },
    { name: '写作', count: 5 },
    { name: '远程工作', count: 3 },
  ],
  growth: [
    { metric: '记录', value: 6, change: '+2' },
    { metric: '收藏', value: 4, change: '+1' },
    { metric: '行动', value: 3, change: '+1' },
  ],
  insights: '你这周最明显的进步，是把“看到”逐步推进成了“记下”和“跟进”。',
};

export const monthlyReport: {
  month: string;
  title: string;
  summary: string;
  topCategories: Array<{ name: string; count: number }>;
  growth: Array<{ metric: string; value: number; change: string }>;
  insights: string;
} = {
  month: '2026.04',
  title: '本月故事回看',
  summary: '本月的节奏从原型堆叠转向真实读链和收口，项目整体已经更像一个可以连续维护的产品。',
  topCategories: [
    { name: 'AI', count: 18 },
    { name: '职场技能', count: 9 },
    { name: '远程工作', count: 6 },
  ],
  growth: [
    { metric: '关注', value: 24, change: '+6' },
    { metric: '记录', value: 11, change: '+4' },
    { metric: '回顾', value: 7, change: '+3' },
  ],
  insights: '本月已经出现“信息 -> 行动 -> 回顾”的稳定雏形，后续最关键的是继续保持这种节奏。',
};

export const weeklyReportData: WeeklyReportData = {
  overview: {
    period: '本周',
    viewed: 12,
    recorded: 6,
    collected: 4,
    completed: 3,
    streak: 5,
  },
  topicTrends: [
    {
      id: 'weekly-ai',
      icon: '🤖',
      title: 'AI',
      heatData: { current: 82, previous: 68, change: 14, trend: 'up' },
      hotSpot: {
        title: 'OpenAI发布GPT-5技术预览版',
        discussionCount: 18,
        userParticipation: 4,
        summary: '这条主题同时出现在你的关注、收藏和记录里，已经形成持续主线。',
      },
      insights: ['你不再只是浏览 AI 新闻，而是在尝试把它们转进自己的工作流。'],
    },
    {
      id: 'weekly-writing',
      icon: '✍️',
      title: '写作',
      heatData: { current: 70, previous: 52, change: 18, trend: 'up' },
      hotSpot: {
        title: 'AI 写作训练营征稿',
        discussionCount: 9,
        userParticipation: 3,
        summary: '写作方向已经从兴趣变成了更接近行动和跟进的对象。',
      },
      insights: ['写作相关内容更容易触发你实际记录和转待办的动作。'],
    },
  ],
  growth: {
    stats: {
      viewed: 12,
      recorded: 6,
      collected: 4,
      completed: 3,
    },
    trajectory: {
      title: '从关注走向行动',
      description: '你本周已经不只是看信息，而是在尝试把关注的方向变成可持续的行动节奏。',
      keywords: ['AI', '写作', '行动'],
    },
    selectedThoughts: [
      { id: 1, date: '04-05', content: '信息如果不转成自己的表达，就很容易只剩路过感。' },
      { id: 2, date: '04-07', content: '这次的重点不是扩张，而是把主线重新收稳。' },
    ],
    suggestions: [
      '继续把高频主题收成固定记录标签。',
      '对已经收藏的机会保持每周一次跟进。',
    ],
  },
};

export const monthlyReportData: MonthlyReportData = {
  overview: {
    period: '本月',
    viewed: 38,
    recorded: 14,
    collected: 9,
    completed: 7,
    streak: 11,
  },
  topicTrends: [
    {
      id: 'monthly-ai',
      icon: '🤖',
      title: 'AI',
      heatData: { current: 86, previous: 71, change: 15, trend: 'up' },
      hotSpot: {
        title: 'AI 正在回到“能落地的人”',
        discussionCount: 31,
        userParticipation: 8,
        summary: 'AI 已经不是单一热点，而是你所有主线里反复出现的背景主题。',
      },
      insights: ['你对 AI 的兴趣已经开始和工作、写作、成长三个方向交叉。'],
    },
    {
      id: 'monthly-career',
      icon: '💼',
      title: '职场技能',
      heatData: { current: 73, previous: 55, change: 18, trend: 'up' },
      hotSpot: {
        title: '远程运营专员（AI产品方向）',
        discussionCount: 12,
        userParticipation: 5,
        summary: '这类机会说明你的关注开始往更明确的职业方向落。'
      },
      insights: ['你对职业方向的关注，已经从泛泛浏览转成了更具体的岗位和能力判断。'],
    },
  ],
  growth: {
    stats: {
      viewed: 38,
      recorded: 14,
      collected: 9,
      completed: 7,
    },
    trajectory: {
      title: '项目和个人节奏都在收稳',
      description: '你本月最大的变化，不是做了更多，而是开始知道哪些东西值得长期保留和回看。',
      keywords: ['AI', '职场技能', '远程工作'],
    },
    selectedThoughts: [
      { id: 1, date: '04-02', content: '如果项目没有唯一门槛，稳定感就只是叙事。' },
      { id: 2, date: '04-07', content: '现在更重要的不是加新东西，而是把主路径真正打磨顺。' },
    ],
    suggestions: [
      '保持“每周一条回看”这个节奏。',
      '继续把职业相关主题收成更明确的画像词。'],
  },
};
