export type IntentType = 
  | 'add_interest' 
  | 'remove_interest' 
  | 'create_todo' 
  | 'record_thought' 
  | 'set_push_time' 
  | 'query_stats' 
  | 'adjust_settings'
  | 'greeting'
  | 'help'
  | 'fragmented_thought'
  | 'multi_intent'
  | 'unknown';

import { intentLogger } from './intentLogger';
import type { IntentLog } from './intentLogger';
export type { IntentLog };

export interface ParsedIntent {
  type: IntentType;
  entities: Record<string, string | string[]>;
  confidence: number;
  matchedBy?: 'exact' | 'synonym' | 'fuzzy' | 'pattern';
}

export type ParsedIntentMatchType = NonNullable<ParsedIntent['matchedBy']>;

export interface MultiIntent extends ParsedIntent {
  type: 'multi_intent';
  intents: ParsedIntent[];
}

export interface Interest {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  frequency: 'daily' | 'weekly';
}

const interestKeywords: Record<string, string[]> = {
  AI: ['AI', '人工智能', '大模型', 'GPT', '机器学习', '深度学习', 'ChatGPT', 'LLM', '智能', '神经网络'],
  远程工作: ['远程', '在家办公', '线上工作', '兼职', '副业', '自由职业', '居家办公', '远程办公'],
  技术开发: ['开发', '编程', '代码', '前端', '后端', '全栈', '程序员', '软件', 'APP', '网站'],
  产品设计: ['产品', '设计', 'UI', 'UX', '交互', '用户体验', '原型', '界面'],
  学术研究: ['学术', '研究', '论文', '文献', '科研', '期刊', '发表', '学位'],
  行业资讯: ['行业', '资讯', '新闻', '动态', '趋势', '热点', '时事'],
  职业发展: ['求职', '面试', '简历', '职业', '晋升', '跳槽', 'offer', '招聘'],
  学习成长: ['学习', '课程', '教程', '培训', '技能', '提升', '成长'],
  财经投资: ['理财', '投资', '股票', '基金', '财经', '金融', '赚钱'],
  健康生活: ['健康', '养生', '运动', '健身', '饮食', '睡眠', '心理'],
};

const removeInterestPatterns = [
  /不想[再]?关注/,
  /取消关注/,
  /删除关注/,
  /移除关注/,
  /不再看/,
  /不想看/,
  /别[再]?推/,
  /取消订阅/,
  /退订/,
  /不再关注/,
  /不关注/,
  /取消追踪/,
  /停止推送/,
  /别给我推/,
  /不要推/,
  /删除.*订阅/,
  /取消.*订阅/,
  /不要.*信息[了]?/,
  /不需要.*信息[了]?/,
  /不想要.*信息/,
  /移除/,
  /删掉/,
];

const addInterestPatterns = [
  /想关注/,
  /帮我关注/,
  /想看/,
  /想了解/,
  /想找/,
  /订阅/,
  /追踪/,
  /收集/,
  /推送/,
  /关注一下/,
  /关注/,
  /想收到/,
  /帮我找/,
  /给我推/,
  /想追踪/,
];

const negativePrefixes = ['不', '没', '别', '取消', '删除', '移除', '停止'];

const timePatterns: Record<string, RegExp> = {
  morning: /早上?|早晨|上午|8点|9点|10点/,
  noon: /中午|12点|13点/,
  afternoon: /下午|14点|15点|16点|17点|18点/,
  evening: /晚上|19点|20点|21点|22点/,
};

const greetingPatterns = [
  /你好|嗨|hi|hello|早上好|晚上好|哈喽|嘿|您好/,
];

const helpPatterns = [
  /怎么用|如何使用|帮助|help|功能|能做什么|怎么操作|使用方法/,
];

const todoTimePatterns = [
  { pattern: /明天/, label: '明天' },
  { pattern: /后天/, label: '后天' },
  { pattern: /下周[一二三四五六日]?/, label: '下周' },
  { pattern: /这周[一二三四五六日]/, label: '本周' },
  { pattern: /周[一二三四五六日]/, label: '本周' },
  { pattern: /(\d{1,2})[号日]/, label: '本月' },
  { pattern: /月底/, label: '月底' },
  { pattern: /下个月/, label: '下月' },
];

const todoActionPatterns = [
  /提醒我/,
  /要做/,
  /得做/,
  /准备/,
  /投/,
  /写/,
  /完成/,
  /提交/,
  /复习/,
  /学习/,
  /整理/,
  /处理/,
  /联系/,
  /回复/,
  /发送/,
  /预约/,
  /交/,
  /得/,
  /要完成/,
];

const todoKeywords = ['简历', '报告', '作业', '论文', '项目', '会议', '面试', '考试', '文档', '方案', '邮件', '代码'];

const fragmentedThoughtKeywords = [
  '突然想到', '忽然想到', '有个想法', '记一下', '记个',
  '碎碎念', '随便说说', '灵感来了', '冒出个想法', '想到一个点子'
];

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
      }
    }
  }
  
  return dp[m][n];
}

function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(str1, str2) / maxLen;
}

function extractTime(text: string): string | null {
  const timeMatch = text.match(/(\d{1,2})[点时:：](\d{0,2})?/);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
  }
  
  if (timePatterns.morning.test(text)) return '08:00';
  if (timePatterns.noon.test(text)) return '12:00';
  if (timePatterns.afternoon.test(text)) return '14:00';
  if (timePatterns.evening.test(text)) return '21:00';
  
  return null;
}

function extractInterests(text: string): string[] {
  const found: string[] = [];
  
  for (const [interest, keywords] of Object.entries(interestKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        found.push(interest);
        break;
      }
    }
  }
  
  return [...new Set(found)];
}

function hasFragmentedKeyword(text: string): boolean {
  return fragmentedThoughtKeywords.some(kw => text.includes(kw));
}

function extractTodoContent(text: string): { content: string; deadline: string } | null {
  let deadline = '待定';
  
  for (const { pattern } of todoTimePatterns) {
    const match = text.match(pattern);
    if (match) {
      deadline = match[0];
      break;
    }
  }
  
  for (const pattern of todoActionPatterns) {
    const match = text.match(pattern);
    if (match) {
      const afterMatch = text.slice(match.index! + match[0].length).trim();
      const content = afterMatch.replace(/[，。！？]/g, '').slice(0, 20).trim();
      if (content.length >= 2) {
        return { content, deadline };
      }
    }
  }
  
  for (const keyword of todoKeywords) {
    if (text.includes(keyword)) {
      const keywordIndex = text.indexOf(keyword);
      let contentStart = 0;
      
      for (const pattern of todoActionPatterns) {
        const match = text.match(pattern);
        if (match && match.index! < keywordIndex) {
          contentStart = match.index! + match[0].length;
          break;
        }
      }
      
      const content = text.slice(contentStart).replace(/[，。！？]/g, '').trim().slice(0, 20);
      if (content.length >= 2) {
        return { content, deadline };
      }
    }
  }
  
  const remindMatch = text.match(/提醒[我]?[^\s，。！？]{2,15}/);
  if (remindMatch) {
    const content = remindMatch[0].replace(/提醒[我]?/g, '').trim();
    if (content.length >= 2) {
      return { content, deadline };
    }
  }
  
  return null;
}

function extractThoughtContent(text: string): string | null {
  if (hasFragmentedKeyword(text)) {
    return null;
  }
  
  const explicitThoughtPatterns = [
    /记录.*想法/,
    /记下/,
    /写下/,
    /我想记录/,
    /帮我记/,
    /保存.*想法/,
    /存下/,
  ];
  
  for (const pattern of explicitThoughtPatterns) {
    if (pattern.test(text)) {
      return text.length > 100 ? text.slice(0, 100) + '...' : text;
    }
  }
  
  const thoughtIndicators = [
    /觉得.*[很有意思|重要|值得]/,
    /感觉.*[很有意思|重要|值得]/,
    /发现.*[很有意思|重要|值得]/,
    /学到.*[很多|新东西]/,
    /思考.*[问题|这件事]/,
    /感悟[到是]/,
    /体会到/,
    /认识到/,
    /深刻.*理解/,
  ];
  
  for (const pattern of thoughtIndicators) {
    if (pattern.test(text)) {
      return text.length > 100 ? text.slice(0, 100) + '...' : text;
    }
  }
  
  return null;
}

function extractFragmentedThought(text: string): { content: string; tags: string[] } | null {
  const explicitFragmentedPatterns = [
    /突然想到/,
    /忽然想到/,
    /有个想法/,
    /记一下/,
    /记个/,
    /碎碎念/,
    /随便说说/,
    /灵感来了/,
    /冒出个想法/,
    /想到一个点子/,
  ];
  
  for (const pattern of explicitFragmentedPatterns) {
    if (pattern.test(text)) {
      const tags: string[] = [];
      if (/AI|人工智能|大模型|GPT|机器学习/.test(text)) tags.push('AI');
      if (/工作|上班|公司|职场/.test(text)) tags.push('工作');
      if (/学习|读书|研究|课程/.test(text)) tags.push('学习');
      if (/生活|日常|周末|假期/.test(text)) tags.push('生活');
      if (/思考|感悟|想法|体会/.test(text)) tags.push('思考');
      
      return {
        content: text,
        tags: tags.length > 0 ? tags : ['日常'],
      };
    }
  }
  
  return null;
}

function hasNegativePrefix(text: string): boolean {
  return negativePrefixes.some(prefix => text.startsWith(prefix) || text.includes(prefix));
}

function checkRemoveInterest(text: string): ParsedIntent | null {
  for (const pattern of removeInterestPatterns) {
    if (pattern.test(text)) {
      const interests = extractInterests(text);
      const confidence = interests.length > 0 ? 0.9 : 0.6;
      return {
        type: 'remove_interest',
        entities: { interests },
        confidence,
        matchedBy: 'pattern',
      };
    }
  }
  return null;
}

function checkAddInterest(text: string): ParsedIntent | null {
  if (hasNegativePrefix(text)) return null;
  
  for (const pattern of addInterestPatterns) {
    if (pattern.test(text)) {
      const interests = extractInterests(text);
      if (interests.length > 0) {
        return {
          type: 'add_interest',
          entities: { interests },
          confidence: 0.85,
          matchedBy: 'pattern',
        };
      }
    }
  }
  return null;
}

function checkAddInterestInPart(text: string): { interests: string[]; pattern: string } | null {
  if (hasNegativePrefix(text)) return null;
  
  for (const pattern of addInterestPatterns) {
    const match = text.match(pattern);
    if (match) {
      const matchIndex = match.index!;
      const beforeMatch = text.slice(Math.max(0, matchIndex - 1), matchIndex);
      if (beforeMatch === '不') continue;
      
      const interests = extractInterests(text);
      if (interests.length > 0) {
        return { interests, pattern: pattern.source };
      }
    }
  }
  return null;
}

function checkMultiIntent(text: string): ParsedIntent | null {
  let hasRemove = false;
  let hasAdd = false;
  let removeInterests: string[] = [];
  let addInterests: string[] = [];
  
  for (const pattern of removeInterestPatterns) {
    if (pattern.test(text)) {
      hasRemove = true;
      removeInterests = extractInterests(text);
      break;
    }
  }
  
  const parts = text.split(/，|,|但是|不过/);
  if (parts.length > 1) {
    for (const part of parts) {
      const trimmedPart = part.trim();
      const addResult = checkAddInterestInPart(trimmedPart);
      if (addResult) {
        hasAdd = true;
        addInterests = addResult.interests;
        break;
      }
    }
  }
  
  if (hasRemove && hasAdd && removeInterests.length > 0 && addInterests.length > 0) {
    return {
      type: 'multi_intent',
      entities: { 
        intents: ['remove_interest', 'add_interest'],
        removeInterests,
        addInterests,
      },
      confidence: 0.85,
      matchedBy: 'pattern',
    };
  }
  
  return null;
}

function checkCreateTodo(text: string): ParsedIntent | null {
  const hasTimePattern = todoTimePatterns.some(({ pattern }) => pattern.test(text));
  const hasActionPattern = todoActionPatterns.some(pattern => pattern.test(text));
  const hasKeyword = todoKeywords.some(keyword => text.includes(keyword));
  
  if (hasTimePattern && (hasActionPattern || hasKeyword)) {
    const todo = extractTodoContent(text);
    if (todo) {
      return {
        type: 'create_todo',
        entities: todo,
        confidence: 0.92,
        matchedBy: 'pattern',
      };
    }
  }
  
  if (hasActionPattern) {
    const todo = extractTodoContent(text);
    if (todo) {
      return {
        type: 'create_todo',
        entities: todo,
        confidence: 0.85,
        matchedBy: 'pattern',
      };
    }
  }
  
  return null;
}

export function parseIntent(text: string, currentInterests: Interest[]): ParsedIntent {
  void currentInterests;
  const normalizedText = text.toLowerCase().trim();
  const originalText = text.trim();
  
  for (const pattern of greetingPatterns) {
    if (pattern.test(normalizedText)) {
      return {
        type: 'greeting',
        entities: {},
        confidence: 0.95,
        matchedBy: 'exact',
      };
    }
  }
  
  for (const pattern of helpPatterns) {
    if (pattern.test(normalizedText)) {
      return {
        type: 'help',
        entities: {},
        confidence: 0.95,
        matchedBy: 'exact',
      };
    }
  }
  
  const multiIntent = checkMultiIntent(originalText);
  if (multiIntent) return multiIntent;
  
  const removeIntent = checkRemoveInterest(originalText);
  if (removeIntent && removeIntent.confidence >= 0.8) return removeIntent;
  
  const addIntent = checkAddInterest(originalText);
  if (addIntent) return addIntent;
  
  if (/每天|推送时间|几点|什么时候/.test(text) && /推送|发|送|收到/.test(text)) {
    const time = extractTime(text);
    return {
      type: 'set_push_time',
      entities: { time: time || '08:00' },
      confidence: time ? 0.92 : 0.75,
      matchedBy: 'pattern',
    };
  }
  
  if (/这周|本周|上周|最近|统计|进度|数据|这个月|本月/.test(text)) {
    if (!/完成|交|做|写|整理|准备|提醒/.test(text)) {
      let period = 'recent';
      if (/这周|本周/.test(text)) period = 'week';
      else if (/上周/.test(text)) period = 'lastWeek';
      else if (/这个月|本月/.test(text)) period = 'month';
      
      return {
        type: 'query_stats',
        entities: { period },
        confidence: 0.88,
        matchedBy: 'pattern',
      };
    }
  }
  
  const todoIntent = checkCreateTodo(originalText);
  if (todoIntent) return todoIntent;
  
  if (/简报|内容|推送|消息/.test(text) && /太多|太少|调整|改|设置|减少|增加/.test(text)) {
    return {
      type: 'adjust_settings',
      entities: {},
      confidence: 0.85,
      matchedBy: 'pattern',
    };
  }
  
  const fragmented = extractFragmentedThought(text);
  if (fragmented) {
    return {
      type: 'fragmented_thought',
      entities: { content: fragmented.content, tags: fragmented.tags },
      confidence: 0.82,
      matchedBy: 'pattern',
    };
  }
  
  const thought = extractThoughtContent(text);
  if (thought) {
    return {
      type: 'record_thought',
      entities: { content: thought },
      confidence: 0.78,
      matchedBy: 'pattern',
    };
  }
  
  if (removeIntent) return removeIntent;
  
  for (const [interest, keywords] of Object.entries(interestKeywords)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        const similarity = similarityScore(normalizedText, keyword.toLowerCase());
        if (similarity > 0.5) {
          return {
            type: 'add_interest',
            entities: { interests: [interest] },
            confidence: 0.65,
            matchedBy: 'fuzzy',
          };
        }
      }
    }
  }
  
  return {
    type: 'unknown',
    entities: {},
    confidence: 0.3,
    matchedBy: 'exact',
  };
}

export function parseIntentWithLogging(text: string, currentInterests: Interest[]): ParsedIntent {
  const result = parseIntent(text, currentInterests);
  
  intentLogger.log(text, {
    type: result.type,
    entities: result.entities,
    confidence: result.confidence,
    matchedBy: result.matchedBy,
  });
  
  return result;
}

export const defaultInterests: Interest[] = [
  { id: '1', name: 'AI技术', icon: '🤖', active: true, frequency: 'daily' },
  { id: '2', name: '远程工作', icon: '💼', active: true, frequency: 'daily' },
  { id: '3', name: '学术研究', icon: '📚', active: false, frequency: 'weekly' },
];
