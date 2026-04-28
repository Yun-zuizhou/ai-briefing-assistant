export interface ParsedIntentResult {
  type: string
  confidence: number
  entities: Record<string, unknown>
  matchedBy: string | null
}

const interestKeywords: Record<string, string[]> = {
  AI: ['AI', '人工智能', '大模型', 'GPT', '机器学习', '深度学习', 'ChatGPT', 'LLM', '智能', '神经网络', 'AI写作'],
  远程工作: ['远程', '在家办公', '线上工作', '兼职', '副业', '自由职业', '居家办公', '远程办公'],
  技术开发: ['开发', '编程', '代码', '前端', '后端', '全栈', '程序员', '软件', 'APP', '网站'],
  产品设计: ['产品', '设计', 'UI', 'UX', '交互', '用户体验', '原型', '界面'],
  学术研究: ['学术', '研究', '论文', '文献', '科研', '期刊', '发表', '学位'],
  行业资讯: ['行业', '资讯', '新闻', '动态', '趋势', '热点', '时事'],
  职业发展: ['求职', '面试', '简历', '职业', '晋升', '跳槽', 'offer', '招聘'],
  学习成长: ['学习', '课程', '教程', '培训', '技能', '提升', '成长'],
  财经投资: ['理财', '投资', '股票', '基金', '财经', '金融', '赚钱'],
  健康生活: ['健康', '养生', '运动', '健身', '饮食', '睡眠', '心理'],
}

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
]

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
]

const negativePrefixes = ['不', '没', '别', '取消', '删除', '移除', '停止']
const negativeHintPatterns = [/不想/, /不再/, /不要/, /别给我/, /别再/, /取消/, /删除/, /移除/, /停止/]
const periodRegexMap: Record<string, RegExp> = {
  week: /这周|本周/,
  lastWeek: /上周/,
  month: /这个月|本月/,
}

function hasNegativePrefix(text: string): boolean {
  const normalized = text.trim()
  if (negativePrefixes.some((prefix) => normalized.startsWith(prefix))) {
    return true
  }
  return negativeHintPatterns.some((pattern) => pattern.test(normalized))
}

function extractInterests(text: string): string[] {
  const found: string[] = []

  for (const [interest, keywords] of Object.entries(interestKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        found.push(interest)
        break
      }
    }
  }

  return [...new Set(found)]
}

function extractTime(text: string): string | null {
  const match = text.match(/(\d{1,2})[点时:：](\d{0,2})?/)
  if (match) {
    const hour = parseInt(match[1] || '0', 10)
    const minute = parseInt(match[2] || '0', 10)
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }
  }
  if (/早上|早晨|上午/.test(text)) return '08:00'
  if (/中午/.test(text)) return '12:00'
  if (/下午/.test(text)) return '14:00'
  if (/晚上/.test(text)) return '21:00'
  return null
}

function detectStatsPeriod(text: string): string {
  if (periodRegexMap.week.test(text)) return 'week'
  if (periodRegexMap.lastWeek.test(text)) return 'lastWeek'
  if (periodRegexMap.month.test(text)) return 'month'
  return 'recent'
}

export function parseIntent(text: string, currentInterests: string[]): ParsedIntentResult {
  const todoSignals = ['提醒我', '明天', '下周', '待办', '记得', '要做', '完成']
  const recordSignals = ['记下', '记录', '保存这个想法', '帮我记', '写下']
  const fragmentSignals = ['突然想到', '忽然想到', '有个想法', '记一下', '灵感来了', '碎碎念']

  for (const pattern of removeInterestPatterns) {
    if (pattern.test(text)) {
      const interests = extractInterests(text)
      const confidence = interests.length > 0 ? 0.9 : 0.6
      return {
        type: 'remove_interest',
        confidence,
        entities: { interests: interests.length > 0 ? interests : currentInterests.filter((item) => text.includes(item)) },
        matchedBy: 'pattern',
      }
    }
  }

  if (!hasNegativePrefix(text)) {
    for (const pattern of addInterestPatterns) {
      if (pattern.test(text)) {
        const interests = extractInterests(text)
        if (interests.length > 0) {
          return {
            type: 'add_interest',
            confidence: 0.85,
            entities: { interests },
            matchedBy: 'pattern',
          }
        }
      }
    }
  }

  if (todoSignals.some((signal) => text.includes(signal))) {
    return {
      type: 'create_todo',
      confidence: 0.85,
      entities: { content: text, deadline: '待定' },
      matchedBy: 'keyword',
    }
  }

  if (/每天|推送时间|几点|什么时候/.test(text) && /推送|发|送|收到/.test(text)) {
    return {
      type: 'set_push_time',
      confidence: 0.9,
      entities: { time: extractTime(text) || '08:00' },
      matchedBy: 'pattern',
    }
  }

  if (/这周|本周|上周|最近|统计|进度|数据|这个月|本月/.test(text) && !/完成|交|做|写|整理|准备|提醒/.test(text)) {
    return {
      type: 'query_stats',
      confidence: 0.88,
      entities: { period: detectStatsPeriod(text) },
      matchedBy: 'pattern',
    }
  }

  if (recordSignals.some((signal) => text.includes(signal))) {
    return {
      type: 'record_thought',
      confidence: 0.8,
      entities: { content: text, tags: [] },
      matchedBy: 'keyword',
    }
  }

  if (fragmentSignals.some((signal) => text.includes(signal))) {
    return {
      type: 'fragmented_thought',
      confidence: 0.75,
      entities: { content: text, tags: ['日常'] },
      matchedBy: 'keyword',
    }
  }

  if (!hasNegativePrefix(text)) {
    const interests = extractInterests(text)
    if (interests.length > 0) {
      return {
        type: 'add_interest',
        confidence: 0.65,
        entities: { interests },
        matchedBy: 'fuzzy',
      }
    }
  }

  return {
    type: 'chat_only',
    confidence: 0.5,
    entities: {},
    matchedBy: 'fallback',
  }
}

export function buildCandidateIntents(
  text: string,
  currentInterests: string[],
  recognizedIntent: string
): string[] {
  const candidates: string[] = [recognizedIntent]

  const explicitRecordSignals = ['记下', '记录', '保存这个想法', '帮我记', '写下']
  const fragmentedSignals = ['突然想到', '忽然想到', '有个想法', '记一下', '灵感来了', '碎碎念', '冒出个想法']
  const todoSignals = ['提醒我', '明天', '下周', '待办', '记得']

  if (explicitRecordSignals.some((signal) => text.includes(signal)) && !candidates.includes('record_thought')) {
    candidates.push('record_thought')
  }
  if (fragmentedSignals.some((signal) => text.includes(signal)) && !candidates.includes('fragmented_thought')) {
    candidates.push('fragmented_thought')
  }
  if (todoSignals.some((signal) => text.includes(signal)) && !candidates.includes('create_todo')) {
    candidates.push('create_todo')
  }
  if (/每天|推送时间|几点|什么时候/.test(text) && /推送|发|送|收到/.test(text) && !candidates.includes('set_push_time')) {
    candidates.push('set_push_time')
  }
  if (/这周|本周|上周|最近|统计|进度|数据|这个月|本月/.test(text) && !candidates.includes('query_stats')) {
    candidates.push('query_stats')
  }

  if (!candidates.includes('chat_only')) {
    candidates.push('chat_only')
  }

  return candidates
}

export function requiresConfirmation(
  intentType: string,
  candidateIntents: string[],
  confidence: number
): boolean {
  const contentWriteIntents = new Set(['create_todo', 'record_thought', 'fragmented_thought'])
  if (!contentWriteIntents.has(intentType)) {
    return false
  }
  if (candidateIntents.length <= 1) {
    return false
  }
  return confidence < 0.9
}
