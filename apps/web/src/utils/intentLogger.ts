export interface IntentLog {
  id: string;
  timestamp: string;
  input: string;
  parsedIntent: {
    type: string;
    entities: Record<string, string | string[]>;
    confidence: number;
    matchedBy?: string;
  };
  userFeedback?: 'correct' | 'incorrect' | 'partial';
  correctedIntent?: string;
  sessionId: string;
  userId?: string;
}

export interface LogStats {
  totalLogs: number;
  unknownCount: number;
  lowConfidenceCount: number;
  feedbackStats: {
    correct: number;
    incorrect: number;
    partial: number;
  };
  intentDistribution: Record<string, number>;
  topUnknownInputs: Array<{ input: string; count: number }>;
  topLowConfidenceInputs: Array<{ input: string; confidence: number; count: number }>;
}

export interface RuleUpdate {
  id: string;
  timestamp: string;
  type: 'add_pattern' | 'add_keyword' | 'modify_threshold' | 'add_intent';
  target: string;
  change: string;
  reason: string;
  applied: boolean;
}

const LOG_STORAGE_KEY = 'intent_logs';
const RULE_UPDATES_KEY = 'rule_updates';
const MAX_LOGS_LOCAL = 1000;
const STORAGE_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ENABLE_INTENT_LOG_STORAGE === 'true';

let memorySessionId: string | null = null;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getSessionId(): string {
  if (!STORAGE_ENABLED) {
    if (!memorySessionId) {
      memorySessionId = generateId();
    }
    return memorySessionId;
  }

  let sessionId = sessionStorage.getItem('intent_session_id');
  if (!sessionId) {
    sessionId = generateId();
    sessionStorage.setItem('intent_session_id', sessionId);
  }
  return sessionId;
}

export class IntentLogger {
  private logs: IntentLog[] = [];
  private ruleUpdates: RuleUpdate[] = [];
  private userId: string | undefined;

  constructor(userId?: string) {
    this.userId = userId;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (!STORAGE_ENABLED) {
      this.logs = [];
      this.ruleUpdates = [];
      return;
    }

    try {
      const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
      
      const storedUpdates = localStorage.getItem(RULE_UPDATES_KEY);
      if (storedUpdates) {
        this.ruleUpdates = JSON.parse(storedUpdates);
      }
    } catch (e) {
      console.warn('Failed to load logs from storage:', e);
      this.logs = [];
      this.ruleUpdates = [];
    }
  }

  private saveToStorage(): void {
    if (!STORAGE_ENABLED) {
      return;
    }

    try {
      if (this.logs.length > MAX_LOGS_LOCAL) {
        this.logs = this.logs.slice(-MAX_LOGS_LOCAL);
      }
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
      localStorage.setItem(RULE_UPDATES_KEY, JSON.stringify(this.ruleUpdates));
    } catch (e) {
      console.warn('Failed to save logs to storage:', e);
    }
  }

  log(
    input: string, 
    parsedIntent: IntentLog['parsedIntent'],
    userFeedback?: IntentLog['userFeedback'],
    correctedIntent?: string
  ): IntentLog {
    const logEntry: IntentLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      input,
      parsedIntent,
      userFeedback,
      correctedIntent,
      sessionId: getSessionId(),
      userId: this.userId,
    };

    this.logs.push(logEntry);
    this.saveToStorage();

    return logEntry;
  }

  addFeedback(logId: string, feedback: IntentLog['userFeedback'], correctedIntent?: string): void {
    const log = this.logs.find(l => l.id === logId);
    if (log) {
      log.userFeedback = feedback;
      log.correctedIntent = correctedIntent;
      this.saveToStorage();
    }
  }

  getLogs(filter?: {
    intentType?: string;
    minConfidence?: number;
    maxConfidence?: number;
    hasFeedback?: boolean;
    feedbackType?: IntentLog['userFeedback'];
    limit?: number;
  }): IntentLog[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.intentType) {
        filtered = filtered.filter(l => l.parsedIntent.type === filter.intentType);
      }
      if (filter.minConfidence !== undefined) {
        filtered = filtered.filter(l => l.parsedIntent.confidence >= filter.minConfidence!);
      }
      if (filter.maxConfidence !== undefined) {
        filtered = filtered.filter(l => l.parsedIntent.confidence <= filter.maxConfidence!);
      }
      if (filter.hasFeedback !== undefined) {
        filtered = filtered.filter(l => filter.hasFeedback ? l.userFeedback !== undefined : l.userFeedback === undefined);
      }
      if (filter.feedbackType) {
        filtered = filtered.filter(l => l.userFeedback === filter.feedbackType);
      }
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit);
      }
    }

    return filtered;
  }

  getStats(): LogStats {
    const stats: LogStats = {
      totalLogs: this.logs.length,
      unknownCount: 0,
      lowConfidenceCount: 0,
      feedbackStats: { correct: 0, incorrect: 0, partial: 0 },
      intentDistribution: {},
      topUnknownInputs: [],
      topLowConfidenceInputs: [],
    };

    const unknownInputs: Record<string, number> = {};
    const lowConfidenceInputs: Record<string, { confidence: number; count: number }> = {};

    for (const log of this.logs) {
      if (log.parsedIntent.type === 'unknown') {
        stats.unknownCount++;
        unknownInputs[log.input] = (unknownInputs[log.input] || 0) + 1;
      }

      if (log.parsedIntent.confidence < 0.7) {
        stats.lowConfidenceCount++;
        if (!lowConfidenceInputs[log.input]) {
          lowConfidenceInputs[log.input] = { confidence: log.parsedIntent.confidence, count: 0 };
        }
        lowConfidenceInputs[log.input].count++;
      }

      if (log.userFeedback) {
        stats.feedbackStats[log.userFeedback]++;
      }

      stats.intentDistribution[log.parsedIntent.type] = 
        (stats.intentDistribution[log.parsedIntent.type] || 0) + 1;
    }

    stats.topUnknownInputs = Object.entries(unknownInputs)
      .map(([input, count]) => ({ input, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    stats.topLowConfidenceInputs = Object.entries(lowConfidenceInputs)
      .map(([input, data]) => ({ input, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  getUnknownInputs(): Array<{ input: string; count: number }> {
    const unknownInputs: Record<string, number> = {};
    
    for (const log of this.logs) {
      if (log.parsedIntent.type === 'unknown') {
        unknownInputs[log.input] = (unknownInputs[log.input] || 0) + 1;
      }
    }

    return Object.entries(unknownInputs)
      .map(([input, count]) => ({ input, count }))
      .sort((a, b) => b.count - a.count);
  }

  getIncorrectFeedback(): Array<IntentLog> {
    return this.logs.filter(l => l.userFeedback === 'incorrect');
  }

  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      ruleUpdates: this.ruleUpdates,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  importLogs(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.logs && Array.isArray(data.logs)) {
        this.logs = [...this.logs, ...data.logs];
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import logs:', e);
      return false;
    }
  }

  clearLogs(): void {
    this.logs = [];
    this.saveToStorage();
  }

  addRuleUpdate(update: Omit<RuleUpdate, 'id' | 'timestamp' | 'applied'>): RuleUpdate {
    const ruleUpdate: RuleUpdate = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      ...update,
      applied: false,
    };

    this.ruleUpdates.push(ruleUpdate);
    this.saveToStorage();

    return ruleUpdate;
  }

  getPendingRuleUpdates(): RuleUpdate[] {
    return this.ruleUpdates.filter(u => !u.applied);
  }

  markRuleUpdateApplied(updateId: string): void {
    const update = this.ruleUpdates.find(u => u.id === updateId);
    if (update) {
      update.applied = true;
      this.saveToStorage();
    }
  }
}

export const intentLogger = new IntentLogger();
