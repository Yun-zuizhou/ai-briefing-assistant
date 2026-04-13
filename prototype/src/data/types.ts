export interface GuideQuestion {
  question: string;
  angle: string;
  type: '开放回答' | '立场选择' | '多选';
}

export interface HotComment {
  content: string;
  source: string;
  likes: number;
}

export interface HotTopic {
  id: number;
  title: string;
  summary: string;
  source: string;
  source_url: string;
  categories: string[];
  published_at: string;
  guide_questions?: GuideQuestion[];
  hot_comments?: HotComment[];
}

export interface Opportunity {
  id: number;
  title: string;
  summary: string;
  source: string;
  source_url: string;
  type: 'parttime' | 'submission' | 'contest' | 'job';
  reward: string;
  location: string;
  requirements: string[];
  deadline: string;
  published_at: string;
}

export interface LearningResource {
  id: number;
  title: string;
  summary: string;
  source: string;
  source_url: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  format: 'article' | 'video' | 'course';
  duration: string;
  published_at: string;
}

export interface BriefingHotTopic {
  id: number;
  title: string;
  summary: string;
  source: string;
  source_url: string;
  categories: string[];
}

export interface BriefingOpportunity {
  id: number;
  title: string;
  summary: string;
  reward: string;
  deadline: string;
  type: 'parttime' | 'submission' | 'contest' | 'job';
}

export interface BriefingLearningResource {
  id: number;
  title: string;
  summary: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface BriefingTodoReminder {
  id: number;
  content: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  related_title?: string;
}

export interface BriefingPersonalNarrative {
  summary: string;
  highlights: string[];
}

export interface BriefingBehaviorStats {
  topics_read: number;
  thoughts_recorded: number;
  todos_completed: number;
  favorites_added: number;
}

export interface Briefing {
  id: number;
  user_id: number;
  briefing_date: string;
  briefing_type: 'morning' | 'evening';
  info_tracking: {
    hot_topics: BriefingHotTopic[];
    opportunities: BriefingOpportunity[];
    learning_resources: BriefingLearningResource[];
  };
  todo_reminders: BriefingTodoReminder[];
  personal_narrative: BriefingPersonalNarrative;
  behavior_stats: BriefingBehaviorStats;
  streak_days: number;
  is_read: boolean;
  created_at: string;
}

export interface Thought {
  id: number;
  user_id: number;
  content: string;
  source_type: 'briefing' | 'manual';
  source_id: number | null;
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' | 'motivated';
  created_at: string;
}

export interface Todo {
  id: number;
  user_id: number;
  content: string;
  deadline: string;
  related_type: 'opportunity' | 'resource' | 'contest' | 'submission' | null;
  related_id: number | null;
  related_title: string | null;
  status: 'pending' | 'completed';
  completed_at?: string;
  remind_at?: string;
  reminded: boolean;
  created_at: string;
}

export interface Favorite {
  id: number;
  user_id: number;
  item_type: 'hot_topic' | 'opportunity' | 'learning_resource';
  item_id: number;
  item_title: string;
  item_summary: string;
  item_source: string;
  item_url: string;
  created_at: string;
}

export interface Achievement {
  id: number;
  user_id: number;
  type: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export interface UserSettings {
  id: number;
  user_id: number;
  push_time: string;
  push_enabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  interests: string[];
  focus_areas: string[];
  total_read: number;
  total_thoughts: number;
  total_todos: number;
  total_completed: number;
  growth_trajectory: string;
  level: number;
  experience: number;
  experience_to_next: number;
  created_at: string;
  updated_at: string;
}

export interface TopicCardGuideQuestion {
  question: string;
  angle: string;
}

export interface TopicCardTopComment {
  content: string;
  source: string;
  likes: number;
}

export interface TopicCard {
  id: string;
  icon: string;
  title: string;
  count: number;
  trend: 'up' | 'down' | 'new' | 'stable';
  summary: string;
  insights: string[];
  contents: {
    id: string;
    title: string;
    source: string;
    url: string;
    publishedAt: string;
  }[];
  guideQuestions?: TopicCardGuideQuestion[];
  topComments?: TopicCardTopComment[];
  actions: {
    recordThought: boolean;
    collectTopic: boolean;
    viewTrend: boolean;
    createPlan: boolean;
    setReminder: boolean;
  };
}

export interface HeatData {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface HotSpot {
  title: string;
  discussionCount: number;
  userParticipation: number;
  summary: string;
}

export interface TopicTrend {
  id: string;
  icon: string;
  title: string;
  heatData: HeatData;
  hotSpot: HotSpot;
  insights: string[];
  userAttentionChange?: {
    change: number;
    newTopics: string[];
  };
}

export interface GrowthStats {
  viewed: number;
  recorded: number;
  collected: number;
  completed: number;
}

export interface GrowthComparison {
  current: number[];
  previous: number[];
  change: number[];
}

export interface GrowthTrajectory {
  title: string;
  description: string;
  keywords: string[];
}

export interface GrowthData {
  stats: GrowthStats;
  comparison?: GrowthComparison;
  trajectory: GrowthTrajectory;
  selectedThoughts: { id: number; date: string; content: string }[];
  suggestions: string[];
}

export interface ReportOverview {
  period: string;
  viewed: number;
  recorded: number;
  collected: number;
  completed: number;
  streak: number;
}

export interface WeeklyReportData {
  overview: ReportOverview;
  topicTrends: TopicTrend[];
  growth: GrowthData;
}

export interface MonthlyReportData {
  overview: ReportOverview;
  topicTrends: TopicTrend[];
  growth: GrowthData;
}

export interface CollectedItem {
  id: number;
  type: string;
  category: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  collectedAt: string;
  tracking: boolean;
  deadline?: string;
  trackStatus?: string;
  trackProgress?: { step: string; done: boolean; date?: string }[];
}

export interface UserInterest {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
}

export interface UserRecord {
  id: number;
  date: string;
  content: string;
  summary: string;
}

export interface DailyStory {
  id: number;
  date: string;
  type: string;
  title: string;
  content: string;
  stats: {
    viewed: number;
    collected: number;
    recorded: number;
  };
  highlights: string[];
  literaryContent: string;
  feedback: string;
  journalSummary: string;
}

export interface Reminder {
  id: number;
  type: 'deadline' | 'action';
  title: string;
  content: string;
  action: string;
  itemId?: number;
}

export interface TodayTodo {
  id: number;
  content: string;
  priority: number;
  estimatedTime: string;
  done: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  content: string;
  intent?: string;
}
