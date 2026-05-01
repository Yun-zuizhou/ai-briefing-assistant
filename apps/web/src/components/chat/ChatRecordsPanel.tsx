import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type SummaryTaskApiItem, type SummaryTaskResultApiItem } from '../../services/api';
import { Button } from '../ui';
import type { ChatSessionSummary } from '../../types/page-data';

interface ChatRecordsPanelProps {
  currentSessionId: number | null;
  sessions: ChatSessionSummary[];
  onSelectSession: (sessionId: number) => void;
  onContinueSession: (sessionId: number) => void;
}

type RecordsTab = 'summary' | 'sessions';

function formatSessionTime(iso?: string | null): string {
  if (!iso) return '暂无消息';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.replace('T', ' ').slice(0, 16);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSessionLabel(session: ChatSessionSummary): string {
  if (session.sessionTitle) return session.sessionTitle;
  return `对话 #${session.sessionId}`;
}

function getTaskLabel(task?: SummaryTaskApiItem | null): string {
  if (!task) return '未生成';
  switch (task.status) {
    case 'pending_provider':
      return '待配置';
    case 'queued':
      return '排队中';
    case 'running':
      return '生成中';
    case 'succeeded':
      return '已生成';
    case 'failed':
      return '生成失败';
    default:
      return task.status;
  }
}

function newestTaskForSession(tasks: SummaryTaskApiItem[], sessionId: number | null) {
  if (sessionId == null) return null;
  return tasks
    .filter((task) => task.content_type === 'chat_session' && task.content_id === sessionId)
    .sort((a, b) => (b.requested_at || '').localeCompare(a.requested_at || ''))[0] ?? null;
}

function renderKeyPoints(result: SummaryTaskResultApiItem | null) {
  const points = (result?.key_points ?? []).filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  if (points.length === 0) return null;
  return (
    <ul className="chat-records-summary-points">
      {points.slice(0, 4).map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );
}

export default function ChatRecordsPanel({
  currentSessionId,
  sessions,
  onSelectSession,
  onContinueSession,
}: ChatRecordsPanelProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<RecordsTab>('summary');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(currentSessionId);
  const [summaryTasks, setSummaryTasks] = useState<SummaryTaskApiItem[]>([]);
  const [summaryResult, setSummaryResult] = useState<SummaryTaskResultApiItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSessionId((prev) => prev ?? currentSessionId);
  }, [currentSessionId]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.sessionId === selectedSessionId) ?? sessions[0] ?? null,
    [selectedSessionId, sessions],
  );
  const selectedTask = useMemo(
    () => newestTaskForSession(summaryTasks, selectedSession?.sessionId ?? null),
    [selectedSession?.sessionId, summaryTasks],
  );

  const fetchSummaryTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.listSummaryTasks({ contentType: 'chat_session', limit: 100 });
      if (response.error) {
        throw new Error(response.error);
      }
      setSummaryTasks(response.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载对话摘要任务失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSummaryTasks();
  }, [fetchSummaryTasks]);

  useEffect(() => {
    if (!selectedTask || selectedTask.status !== 'succeeded') {
      setSummaryResult(null);
      return;
    }

    let cancelled = false;
    const loadResult = async () => {
      const response = await apiService.getSummaryTaskResult(selectedTask.id);
      if (cancelled) return;
      if (response.error) {
        setSummaryResult(null);
        setError(response.error);
        return;
      }
      setSummaryResult(response.data ?? null);
    };

    void loadResult();
    return () => {
      cancelled = true;
    };
  }, [selectedTask]);

  const handleGenerateSummary = useCallback(async () => {
    if (!selectedSession) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await apiService.createChatSessionSummaryTask(
        selectedSession.sessionId,
        formatSessionLabel(selectedSession),
      );
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data?.task) {
        setSummaryTasks((prev) => [response.data!.task, ...prev.filter((task) => task.id !== response.data!.task.id)]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建对话摘要任务失败');
    } finally {
      setActionLoading(false);
    }
  }, [selectedSession]);

  const handleSelectSession = useCallback((sessionId: number) => {
    setSelectedSessionId(sessionId);
    onSelectSession(sessionId);
    setActiveTab('summary');
  }, [onSelectSession]);

  if (loading) {
    return (
      <div className="chat-records-loading">
        <div className="chat-records-skeleton" />
        <div className="chat-records-skeleton short" />
        <div className="chat-records-skeleton medium" />
      </div>
    );
  }

  return (
    <div className="chat-records-panel">
      <div className="chat-records-tab-row" role="tablist" aria-label="对话记录视图">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'summary'}
          className={`chat-records-tab ${activeTab === 'summary' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          摘要
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sessions'}
          className={`chat-records-tab ${activeTab === 'sessions' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          会话
        </button>
      </div>

      {error ? (
        <div className="chat-records-error">
          <span>{error}</span>
          <Button onClick={() => void fetchSummaryTasks()} variant="secondary" size="sm">
            重试
          </Button>
        </div>
      ) : null}

      {activeTab === 'summary' ? (
        <section className="chat-records-section" aria-live={selectedTask?.status === 'queued' || selectedTask?.status === 'running' ? 'polite' : 'off'}>
          <div className="chat-records-section-header">
            <span>对话摘要</span>
            <span className="chat-records-count">{getTaskLabel(selectedTask)}</span>
          </div>

          {!selectedSession ? (
            <p className="chat-records-empty">暂无可生成摘要的历史会话。</p>
          ) : (
            <article className="chat-records-card chat-records-summary-card">
              <div className="chat-records-card-head">
                <span className="chat-records-card-time">{formatSessionTime(selectedSession.lastMessageAt)}</span>
                <span className={`chat-records-summary-status status-${selectedTask?.status ?? 'empty'}`}>
                  {getTaskLabel(selectedTask)}
                </span>
              </div>
              <h3 className="chat-records-summary-title">{formatSessionLabel(selectedSession)}</h3>

              {selectedTask?.status === 'succeeded' && summaryResult ? (
                <>
                  <p className="chat-records-card-body">
                    {summaryResult.summary_text || '摘要结果已生成，但当前没有正文内容。'}
                  </p>
                  {renderKeyPoints(summaryResult)}
                </>
              ) : selectedTask?.status === 'pending_provider' ? (
                <p className="chat-records-card-body">
                  摘要任务已创建，但当前摘要服务尚未配置。请先检查 AI 服务设置。
                </p>
              ) : selectedTask?.status === 'queued' || selectedTask?.status === 'running' ? (
                <p className="chat-records-card-body">
                  摘要正在生成中，完成后会在这里显示要点、判断和后续动作。
                </p>
              ) : selectedTask?.status === 'failed' ? (
                <p className="chat-records-card-body">
                  上一次摘要生成失败：{selectedTask.error_message || '未返回具体原因'}。
                </p>
              ) : (
                <p className="chat-records-card-body">
                  当前会话尚未生成摘要。摘要会用于回顾过去对话，不再展示完整的想法和待办列表。
                </p>
              )}

              <div className="chat-records-summary-actions">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={actionLoading || selectedTask?.status === 'queued' || selectedTask?.status === 'running'}
                  onClick={() => void handleGenerateSummary()}
                >
                  {selectedTask ? '重新生成摘要' : '生成摘要'}
                </Button>
                {selectedTask?.status === 'pending_provider' ? (
                  <Button type="button" variant="text" size="sm" onClick={() => navigate('/ai-provider-settings')}>
                    AI 服务设置
                  </Button>
                ) : null}
                <Button type="button" variant="text" size="sm" onClick={() => onContinueSession(selectedSession.sessionId)}>
                  继续对话
                </Button>
              </div>
            </article>
          )}
        </section>
      ) : (
        <section className="chat-records-section">
          <div className="chat-records-section-header">
            <span>历史会话</span>
            <span className="chat-records-count">{sessions.length} 条</span>
          </div>

          {sessions.length === 0 ? (
            <p className="chat-records-empty">暂无历史会话。</p>
          ) : (
            <div className="chat-records-list">
              {sessions.map((session) => {
                const task = newestTaskForSession(summaryTasks, session.sessionId);
                const isActive = session.sessionId === selectedSession?.sessionId;
                return (
                  <button
                    key={session.sessionId}
                    type="button"
                    className={`chat-records-card chat-records-session-card ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleSelectSession(session.sessionId)}
                  >
                    <span className="chat-records-session-main">
                      <span className="chat-records-summary-title">{formatSessionLabel(session)}</span>
                      <span className="chat-records-meta">
                        {session.messageCount != null ? `${session.messageCount} 条消息 · ` : ''}
                        {formatSessionTime(session.lastMessageAt)}
                      </span>
                    </span>
                    <span className={`chat-records-summary-status status-${task?.status ?? 'empty'}`}>
                      {getTaskLabel(task)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="chat-records-section chat-records-actions-bridge">
        <div className="chat-records-section-header">
          <span>对话生成的待办</span>
          <span className="chat-records-count">外链</span>
        </div>
        <p className="chat-records-empty">
          对话中确认的待办已归入待办页；这里仅保留入口，避免记录页继续铺开行动列表。
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="chat-records-actions-link"
          onClick={() => navigate('/todo')}
        >
          去待办页查看
        </Button>
      </section>
    </div>
  );
}
