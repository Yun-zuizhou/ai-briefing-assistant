import type { CollectedItem, DailyStory, TodayTodo } from './types';

export const todayPushes = [
  {
    id: 1,
    type: 'news',
    category: 'AI',
    title: 'OpenAI发布GPT-5技术预览版',
    summary: '重点聚焦更稳的推理和多模态协作，适合作为今日关注入口。',
    source: '量子位',
    sourceUrl: 'https://example.com/demo/gpt5',
    time: '09:10',
    collected: false,
  },
  {
    id: 2,
    type: 'opportunity',
    category: '远程工作',
    title: '远程运营专员（AI产品方向）',
    summary: '更偏产品与用户增长，适合关注 AI 与内容运营交叉方向的人。',
    source: '拉勾网',
    sourceUrl: 'https://example.com/demo/remote-ops',
    time: '10:30',
    collected: true,
    deadline: '2026-04-15',
    tracking: true,
  },
  {
    id: 3,
    type: 'article',
    category: '写作',
    title: 'Prompt Engineering 完全指南',
    summary: '把提示词当成写作与思考工具，而不只是生成器。',
    source: 'PromptHub',
    sourceUrl: 'https://example.com/demo/prompt-guide',
    time: '13:20',
    collected: false,
  },
  {
    id: 4,
    type: 'news',
    category: '职场技能',
    title: 'AI岗位正在回到“会落地的人”',
    summary: '招聘侧更看重能把 AI 接进流程的人，而不是只会概念表达的人。',
    source: '极客公园',
    sourceUrl: 'https://example.com/demo/ai-jobs',
    time: '18:45',
    collected: false,
  },
];

export const chatHistory = [
  {
    id: 1,
    role: 'assistant' as const,
    content: '你好，我会帮你把今天最值得看的内容收成行动和记录。',
  },
];

export const todayTodos: TodayTodo[] = [
  {
    id: 1,
    content: '整理 AI 写作训练营投稿提纲',
    priority: 2,
    estimatedTime: '30 分钟',
    done: false,
    createdAt: '2026/4/7 09:20',
  },
  {
    id: 2,
    content: '补一条关于今日主线的记录',
    priority: 1,
    estimatedTime: '10 分钟',
    done: false,
    createdAt: '2026/4/7 11:05',
  },
];

export const collectedItems: CollectedItem[] = [
  {
    id: 1,
    type: 'opportunity',
    category: '远程工作',
    title: '远程运营专员（AI产品方向）',
    summary: '更偏产品与用户增长，适合沉淀为长期跟进对象。',
    source: '拉勾网',
    sourceUrl: 'https://example.com/demo/remote-ops',
    collectedAt: '2026/4/7 10:30',
    tracking: true,
    deadline: '2026-04-15',
    trackStatus: '跟进中',
    trackProgress: [
      { step: '查看岗位说明', done: true, date: '2026-04-07' },
      { step: '整理简历亮点', done: false },
    ],
  },
];

export const dailyStories: DailyStory[] = [
  {
    id: 1,
    date: '2026/4/7',
    type: 'daily',
    title: '今天把主线重新收成稳定状态',
    content: '你没有继续扩新对象，而是先把仓库边界、验证门槛和用户主路径收稳了。',
    stats: {
      viewed: 12,
      collected: 3,
      recorded: 2,
    },
    highlights: ['Today 主链可走通', 'Actions streak 已恢复', 'Growth 关键词更像画像'],
    literaryContent: '今天不是扩张的一天，而是把散开的线重新拧成一股绳的一天。',
    feedback: '继续做小步收口，比继续扩新更接近稳定。',
    journalSummary: '主线已经开始呈现出更像产品而不是草稿的形态。',
  },
];
