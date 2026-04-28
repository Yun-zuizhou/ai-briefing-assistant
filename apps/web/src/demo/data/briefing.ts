export interface TopicSummary {
  topic: string;
  topic_label: string;
  emoji: string;
  summary: string;
  key_points: string[];
  article_count: number;
  trend: 'up' | 'down' | 'stable';
  trend_value: string;
  trend_data: number[];
  updated_at: string;
}

export interface GlobalSummary {
  summary: string;
  highlights: Array<{
    topic: string;
    topic_label: string;
    emoji: string;
    text: string;
    article_count: number;
    trend_value: string;
    trend_data: number[];
  }>;
  total_articles: number;
  topics_active: number;
  generated_at: string;
}

export interface DailyBriefing {
  date: string;
  global_summary: GlobalSummary;
  topic_summaries: TopicSummary[];
}
