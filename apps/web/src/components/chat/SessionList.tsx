import { useState, useRef, useEffect } from 'react';
import type { ChatSessionSummary } from '../../types/page-data';

function formatSessionTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatSessionLabel(session: ChatSessionSummary): string {
  if (session.sessionTitle) return session.sessionTitle;
  const dateStr = session.lastMessageAt
    ? new Date(session.lastMessageAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
    : '';
  const timeStr = session.lastMessageAt
    ? new Date(session.lastMessageAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '';
  return dateStr ? `对话 · ${dateStr} ${timeStr}` : `对话 #${session.sessionId}`;
}

export function SessionList({
  sessions,
  currentSessionId,
  onSelect,
  onClose,
  onRename,
  onArchive,
}: {
  sessions: ChatSessionSummary[];
  currentSessionId: number | null;
  onSelect: (sessionId: number) => void;
  onClose: () => void;
  onRename?: (sessionId: number, currentTitle: string | null) => void;
  onArchive?: (sessionId: number) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmingArchiveId, setConfirmingArchiveId] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId != null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

  const commitRename = (sessionId: number) => {
    const trimmed = editValue.trim();
    setEditingId(null);
    if (trimmed && onRename) {
      const session = sessions.find((s) => s.sessionId === sessionId);
      if (trimmed !== (session?.sessionTitle ?? '')) {
        onRename(sessionId, trimmed);
      }
    }
  };

  const startRename = (session: ChatSessionSummary) => {
    setEditingId(session.sessionId);
    setEditValue(session.sessionTitle ?? '');
    setConfirmingArchiveId(null);
  };

  if (sessions.length === 0) {
    return (
      <div className="session-list-panel">
        <div className="session-list-head">
          <span className="session-list-title">历史对话</span>
          <button className="session-list-close-btn" onClick={onClose} type="button">收起</button>
        </div>
        <div className="session-list-empty">暂无历史对话</div>
      </div>
    );
  }

  return (
    <div className="session-list-panel">
      <div className="session-list-head">
        <span className="session-list-title">历史对话</span>
        <button className="session-list-close-btn" onClick={onClose} type="button">收起</button>
      </div>
      <div className="session-list-body">
        {sessions.map((session) => {
          const isActive = session.sessionId === currentSessionId;
          const isEditing = editingId === session.sessionId;
          const isConfirmingArchive = confirmingArchiveId === session.sessionId;

          return (
            <div
              key={session.sessionId}
              className={`session-list-row${isActive ? ' session-list-row-active' : ''}`}
            >
              <button
                type="button"
                className={`session-list-item${isActive ? ' session-list-item-active' : ''}`}
                onClick={() => onSelect(session.sessionId)}
              >
                {isEditing ? (
                  <input
                    ref={editInputRef}
                    className="session-list-edit-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(session.sessionId);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => commitRename(session.sessionId)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="session-list-item-label">{formatSessionLabel(session)}</span>
                )}
                <span className="session-list-item-meta">
                  {session.messageCount != null ? `${session.messageCount}条` : null}
                  {session.lastMessageAt ? (
                    <span className="session-list-item-time">{formatSessionTime(session.lastMessageAt)}</span>
                  ) : null}
                </span>
              </button>
              {(onRename || onArchive) ? (
                <span className="session-list-item-actions">
                  {onRename ? (
                    isEditing ? (
                      <button
                        type="button"
                        className="session-action-btn session-action-btn-confirm"
                        title="确认"
                        onMouseDown={(e) => { e.preventDefault(); commitRename(session.sessionId); }}
                      >
                        确认
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="session-action-btn"
                        title="重命名"
                        onClick={(e) => { e.stopPropagation(); startRename(session); }}
                      >
                        重命名
                      </button>
                    )
                  ) : null}
                  {onArchive ? (
                    isConfirmingArchive ? (
                      <>
                        <button
                          type="button"
                          className="session-action-btn session-action-btn-confirm"
                          onClick={(e) => { e.stopPropagation(); onArchive(session.sessionId); setConfirmingArchiveId(null); }}
                        >
                          确认归档
                        </button>
                        <button
                          type="button"
                          className="session-action-btn"
                          onClick={(e) => { e.stopPropagation(); setConfirmingArchiveId(null); }}
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="session-action-btn session-action-btn-archive"
                        title="归档"
                        onClick={(e) => { e.stopPropagation(); setConfirmingArchiveId(session.sessionId); setEditingId(null); }}
                      >
                        归档
                      </button>
                    )
                  ) : null}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
