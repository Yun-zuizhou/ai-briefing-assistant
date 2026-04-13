import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChatLogic } from '../hooks';
import { PageLayout, Masthead, PageContent, PageFooter } from '../components/layout';

function QuickActionButton({ text, onClick, highlight }: { text: string; onClick: () => void; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px',
        background: highlight ? 'var(--ink)' : 'var(--paper)',
        border: '1px solid var(--border)',
        fontSize: '13px',
        fontWeight: 500,
        color: highlight ? 'var(--paper)' : 'var(--ink)',
        cursor: 'pointer',
        fontFamily: 'var(--font-serif-cn)',
        transition: 'all 0.2s ease',
      }}
    >
      {text}
    </button>
  );
}

function FeedbackCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '14px',
        background: 'var(--paper-warm)',
        border: '1px solid var(--border)',
        marginBottom: '12px',
      }}
    >
      <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, marginBottom: '6px' }}>{label}</div>
      {children}
    </div>
  );
}

function StatusPill({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'pending' | 'success' }) {
  const background =
    tone === 'pending' ? 'var(--paper)' :
    tone === 'success' ? 'var(--ink)' :
    'var(--paper)';
  const color =
    tone === 'success' ? 'var(--paper)' : 'var(--ink)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        border: '1px solid var(--border)',
        background,
        color,
        fontSize: '11px',
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  );
}

function MessageBody({ content, isUser }: { content: string; isUser: boolean }) {
  const blocks = content
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return null;
  }

  const [lead, ...rest] = blocks;

  return (
    <div style={{ paddingLeft: !isUser ? '12px' : '0' }}>
      <div
        style={{
          fontSize: '14px',
          fontWeight: isUser ? 500 : 700,
          lineHeight: 1.7,
          marginBottom: rest.length > 0 ? '8px' : 0,
        }}
      >
        {lead}
      </div>
      {rest.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gap: '6px',
          }}
        >
          {rest.map((item) => (
            <div
              key={item}
              style={{
                fontSize: '12px',
                lineHeight: 1.7,
                color: isUser ? 'rgba(255,255,255,0.88)' : 'var(--ink-muted)',
                padding: '6px 8px',
                background: isUser ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
                border: isUser ? '1px solid rgba(255,255,255,0.1)' : '1px dashed var(--border)',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MessageMeta({
  candidateIntents,
  confidence,
  sourceContext,
  matchedBy,
}: {
  candidateIntents?: string[];
  confidence?: number;
  sourceContext?: string;
  matchedBy?: string;
}) {
  const parts: string[] = [];

  if (candidateIntents && candidateIntents.length > 0) {
    parts.push(`也可能是：${candidateIntents.join(' / ')}`);
  }
  if (confidence !== undefined) {
    parts.push(`把握大约 ${Math.round(confidence * 100)}%`);
  }
  if (sourceContext) {
    parts.push(`当前来自 ${sourceContext}`);
  }
  if (matchedBy) {
    parts.push(`按 ${matchedBy} 方式识别`);
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: '8px',
        paddingLeft: '12px',
        fontSize: '11px',
        lineHeight: 1.7,
        color: 'var(--ink-muted)',
        display: 'grid',
        gap: '2px',
        opacity: 0.85,
      }}
    >
      {parts.map((item) => (
        <div key={item} style={{ fontStyle: 'italic' }}>{item}</div>
      ))}
    </div>
  );
}

function formatIntentLabel(intent: string) {
  switch (intent) {
    case 'create_todo':
      return '记成待办';
    case 'record_thought':
      return '记成记录';
    case 'fragmented_thought':
      return '记成碎片';
    case 'chat_only':
      return '仅聊天';
    default:
      return intent;
  }
}

function MessageStateLabel({
  messageState,
  confirmedType,
}: {
  messageState?: 'recognized' | 'intent_analysis' | 'pending_confirmation' | 'confirmation' | 'executed';
  confirmedType?: string;
}) {
  if (!messageState) return null;

  let text = '';
  let tone: 'neutral' | 'pending' | 'success' = 'neutral';

  if (messageState === 'pending_confirmation') {
    text = '待确认';
    tone = 'pending';
  } else if (messageState === 'intent_analysis') {
    text = '我先理解为';
    tone = 'neutral';
  } else if (messageState === 'confirmation') {
    text = confirmedType ? `已确认 ${formatIntentLabel(confirmedType)}` : '已确认';
    tone = 'neutral';
  } else if (messageState === 'executed') {
    text = confirmedType ? `已执行 ${formatIntentLabel(confirmedType)}` : '已执行';
    tone = 'success';
  } else {
    text = '已发送';
    tone = 'neutral';
  }

  return <StatusPill text={text} tone={tone} />;
}

function MessageItem({
  content,
  isUser,
  messageState,
  confirmedType,
  candidateIntents,
  confidence,
  sourceContext,
  matchedBy,
  deepLink,
  nextPageLabel,
  quickActions,
  changeLog,
  onMessageAction,
}: {
  content: string;
  isUser: boolean;
  messageState?: 'recognized' | 'intent_analysis' | 'pending_confirmation' | 'confirmation' | 'executed';
  confirmedType?: string;
  candidateIntents?: string[];
  confidence?: number;
  sourceContext?: string;
  matchedBy?: string;
  deepLink?: string;
  nextPageLabel?: string;
  quickActions?: Array<{
    label: string;
    action: string;
    deepLink?: string;
    targetIntent?: string;
    correctionFrom?: string;
  }>;
  changeLog?: Array<{
    entityType: 'todo' | 'note' | 'history' | 'favorite' | 'unknown';
    entityId?: number | string;
    change: 'created' | 'kept' | 'cancelled' | 'retagged' | 'repointed';
    summary: string;
  }>;
  onMessageAction: (action: { action: string; deepLink?: string; targetIntent?: string; correctionFrom?: string; sourceContext?: string }) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
      <div
        style={{
          maxWidth: '85%',
          padding: '12px 16px',
          background: isUser ? 'var(--accent)' : 'var(--paper-warm)',
          color: isUser ? 'var(--paper)' : 'var(--ink)',
          border: isUser ? 'none' : '1px solid var(--border)',
          boxShadow: isUser ? '2px 2px 0 var(--ink)' : 'none',
          fontSize: '14px',
          lineHeight: 1.6,
          position: 'relative',
        }}
      >
        {!isUser ? (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              width: '6px',
              height: '6px',
              background: 'var(--gold)',
              transform: 'rotate(45deg)',
            }}
          />
        ) : null}
        {!isUser ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', paddingLeft: '12px' }}>
            <MessageStateLabel messageState={messageState} confirmedType={confirmedType} />
          </div>
        ) : null}
        <MessageBody content={content} isUser={isUser} />
        {!isUser ? (
          <MessageMeta
            candidateIntents={candidateIntents}
            confidence={confidence}
            sourceContext={sourceContext}
            matchedBy={matchedBy}
          />
        ) : null}
        {!isUser && messageState === 'executed' && (deepLink || (quickActions && quickActions.length > 0)) ? (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '14px',
              paddingLeft: '12px',
            }}
          >
            {deepLink && nextPageLabel ? (
              <QuickActionButton
                text={nextPageLabel}
                onClick={() => onMessageAction({ action: nextPageLabel, deepLink })}
                highlight
              />
            ) : null}
            {quickActions?.map((item) => (
              <QuickActionButton
                key={`${item.label}-${item.action}`}
                text={item.label}
                onClick={() => onMessageAction(item)}
                highlight={Boolean(item.deepLink)}
              />
            ))}
          </div>
        ) : null}
        {!isUser && changeLog && changeLog.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gap: '6px',
              marginTop: '12px',
              paddingLeft: '12px',
            }}
          >
            {changeLog.map((item) => (
              <div
                key={`${item.entityType}-${item.entityId ?? 'none'}-${item.change}`}
                style={{
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: 'var(--ink-muted)',
                  padding: '6px 8px',
                  background: 'rgba(255,255,255,0.55)',
                  border: '1px dashed var(--border)',
                }}
              >
                {item.summary}{item.entityId !== undefined ? ` #${item.entityId}` : ''}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MessageList({
  messages,
  isTyping,
  onMessageAction,
}: {
  messages: Array<{
    content: string;
    role: 'user' | 'assistant';
    messageState?: 'recognized' | 'intent_analysis' | 'pending_confirmation' | 'confirmation' | 'executed';
    confirmedType?: string;
    candidateIntents?: string[];
    confidence?: number;
    sourceContext?: string;
    matchedBy?: string;
    deepLink?: string;
    nextPageLabel?: string;
    quickActions?: Array<{
      label: string;
      action: string;
      deepLink?: string;
      targetIntent?: string;
      correctionFrom?: string;
    }>;
    changeLog?: Array<{
      entityType: 'todo' | 'note' | 'history' | 'favorite' | 'unknown';
      entityId?: number | string;
      change: 'created' | 'kept' | 'cancelled' | 'retagged' | 'repointed';
      summary: string;
    }>;
  }>;
  isTyping: boolean;
  onMessageAction: (action: { action: string; deepLink?: string; targetIntent?: string; correctionFrom?: string; sourceContext?: string }) => void;
}) {
  return (
    <div aria-live="polite" aria-label="消息列表">
      {messages.map((msg, index) => (
        <MessageItem
          key={index}
          content={msg.content}
          isUser={msg.role === 'user'}
          messageState={msg.messageState}
          confirmedType={msg.confirmedType}
          candidateIntents={msg.candidateIntents}
          confidence={msg.confidence}
          sourceContext={msg.sourceContext}
          matchedBy={msg.matchedBy}
          deepLink={msg.deepLink}
          nextPageLabel={msg.nextPageLabel}
          quickActions={msg.quickActions}
          changeLog={msg.changeLog}
          onMessageAction={onMessageAction}
        />
      ))}
      {isTyping ? (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--paper-warm)',
              border: '1px solid var(--border)',
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                width: '6px',
                height: '6px',
                background: 'var(--gold)',
                transform: 'rotate(45deg)',
              }}
            />
            <span style={{ fontSize: '14px', color: 'var(--ink-muted)', fontFamily: 'var(--font-serif-cn)', paddingLeft: '12px' }}>
              思考中...
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ onQuickAction }: { onQuickAction: (text: string, autoSend?: boolean) => void }) {
  const scenarios = [
    {
      title: '表达关注',
      description: '告诉系统你想持续追踪什么，不需要先进入配置页。',
      action: '我想关注AI和远程工作',
    },
    {
      title: '表达行动',
      description: '直接说出任务意图，把一句话转成待办。',
      action: '明天提醒我投简历',
    },
    {
      title: '表达想法',
      description: '把零散感受及时记下，后续会进入成长记录。',
      action: '今天突然想到，AI发展太快了，有点焦虑',
    },
    {
      title: '表达调整',
      description: '你可以直接调整推送和简报节奏，不需要层层点设置。',
      action: '每天8点发简报',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
      <FeedbackCard label="当前可做的事情">
        <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
          这个页面的作用不是浏览内容，而是让你用最低成本把一句话交给系统处理。你说出关注、任务、想法或调整，系统负责识别并落到对应模块。
        </p>
      </FeedbackCard>

      <div style={{ paddingBottom: '12px' }}>
        {scenarios.map((item) => (
          <div
            key={item.title}
            style={{
              padding: '14px',
              background: 'var(--paper)',
              border: '1px solid var(--border)',
              marginBottom: '8px',
              cursor: 'pointer',
            }}
            onClick={() => onQuickAction(item.action, true)}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>{item.title}</div>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: '8px' }}>{item.description}</p>
            <div style={{ fontSize: '12px', color: 'var(--accent)', fontStyle: 'italic' }}>示例：“{item.action}”</div>
          </div>
        ))}
      </div>

      <FeedbackCard label="快捷示例">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <QuickActionButton text="我想关注AI" onClick={() => onQuickAction('我想关注AI')} />
          <QuickActionButton text="明天提醒我投简历" onClick={() => onQuickAction('明天提醒我投简历')} />
          <QuickActionButton text="今天学到了..." onClick={() => onQuickAction('今天学到了...')} />
          <QuickActionButton text="每天8点发简报" onClick={() => onQuickAction('每天8点发简报')} />
        </div>
      </FeedbackCard>
    </div>
  );
}

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const actionContext = (location.state as {
    presetInput?: string;
    sourceContentRef?: string;
    sourceTitle?: string;
  } | null);
  const [inputValue, setInputValue] = useState(() => actionContext?.presetInput ?? '');
  const [isTyping, setIsTyping] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    confirmPendingIntent,
    latestActionSummary,
    pendingConfirmation,
    composeMode,
    setComposeMode,
    reclassifyMessage,
    currentSessionId,
    activeSessionSummary,
    isHydrating,
    chatReadError,
    chatReadMode,
  } = useChatLogic();
  const hasExecutedStage = Boolean(latestActionSummary && !latestActionSummary.requiresConfirmation);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isTyping) return;
    const userMessage = inputValue.trim();
    setInputValue('');
    setIsTyping(true);
    setTimeout(() => {
      void sendMessage(userMessage, {
        sourceContext: actionContext?.sourceContentRef ? 'article_action' : undefined,
        autoCommit: false,
        preferredIntent: composeMode === 'smart' ? undefined : composeMode,
      });
      setIsTyping(false);
    }, 600);
  }, [actionContext?.sourceContentRef, composeMode, inputValue, isTyping, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (text: string, autoSend: boolean = false) => {
    if (autoSend) {
      setInputValue('');
      setIsTyping(true);
      setTimeout(() => {
        void sendMessage(text, {
          autoCommit: false,
          preferredIntent: composeMode === 'smart' ? undefined : composeMode,
        });
        setIsTyping(false);
      }, 600);
    } else {
      setInputValue(text);
      inputRef.current?.focus();
    }
  };

  const handleMessageAction = useCallback((item: { action: string; deepLink?: string; targetIntent?: string; correctionFrom?: string; sourceContext?: string }) => {
    if (item.deepLink) {
      navigate(item.deepLink);
      return;
    }
    if (item.targetIntent && item.correctionFrom) {
      setIsTyping(true);
      setTimeout(() => {
        void reclassifyMessage({
          originalUserMessage: item.action,
          correctionFrom: item.correctionFrom!,
          targetIntent: item.targetIntent!,
          sourceContext: item.sourceContext,
        }).finally(() => setIsTyping(false));
      }, 200);
      return;
    }
    if (item.targetIntent === 'create_todo' || item.targetIntent === 'record_thought' || item.targetIntent === 'fragmented_thought' || item.targetIntent === 'chat_only') {
      setComposeMode(item.targetIntent);
    }
    setInputValue(item.action);
    inputRef.current?.focus();
  }, [navigate, reclassifyMessage, setComposeMode]);

  return (
    <PageLayout>
      <Masthead title="对话" subtitle="表达一句，系统帮你处理" ornaments={['✦ CHAT ✦', '✦ EXPRESS ✦']} />
      <PageContent style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <FeedbackCard label="页面职责">
          <p style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, marginBottom: '8px' }}>
            这里不是内容浏览页，而是系统入口。你现在想说的一句话，会被识别成关注、待办、记录或设置动作，再落回其他页面。
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <StatusPill
              text={
                chatReadMode === 'formal'
                  ? `正式会话 ${currentSessionId ?? '-'}`
                  : chatReadMode === 'cache'
                    ? '当前显示缓存会话'
                    : '当前暂无正式会话'
              }
              tone={chatReadMode === 'formal' ? 'success' : 'neutral'}
            />
            {activeSessionSummary?.lastMessageAt ? (
              <StatusPill text={`最近更新 ${activeSessionSummary.lastMessageAt.slice(0, 16).replace('T', ' ')}`} />
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <QuickActionButton text="智能判断" onClick={() => setComposeMode('smart')} highlight={composeMode === 'smart'} />
            <QuickActionButton text="待办模式" onClick={() => setComposeMode('create_todo')} highlight={composeMode === 'create_todo'} />
            <QuickActionButton text="记录模式" onClick={() => setComposeMode('record_thought')} highlight={composeMode === 'record_thought'} />
            <QuickActionButton text="碎片模式" onClick={() => setComposeMode('fragmented_thought')} highlight={composeMode === 'fragmented_thought'} />
            <QuickActionButton text="仅聊天" onClick={() => setComposeMode('chat_only')} highlight={composeMode === 'chat_only'} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: '8px' }}>
            当前输入模式：{formatIntentLabel(composeMode)}。只有“智能判断”会优先走待确认分流，其他模式会把你的偏好一并带给后端。
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <QuickActionButton text="查看今日" onClick={() => navigate('/today')} />
            <QuickActionButton text="查看待办" onClick={() => navigate('/todo')} />
            <QuickActionButton text="查看成长" onClick={() => navigate('/me')} />
          </div>
        </FeedbackCard>

        {chatReadError ? (
          <FeedbackCard label="会话读取状态">
            <p style={{ fontSize: '13px', color: 'var(--accent)', lineHeight: 1.6, margin: 0 }}>
              {chatReadError}。当前保留本地缓存显示，但它不再作为主会话事实源。
            </p>
          </FeedbackCard>
        ) : null}

        {actionContext?.sourceTitle ? (
          <FeedbackCard label="当前动作上下文">
            <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, marginBottom: '8px' }}>
              <div><strong>来源内容：</strong>{actionContext.sourceTitle}</div>
              {actionContext.sourceContentRef ? (
                <div><strong>统一引用：</strong>{actionContext.sourceContentRef}</div>
              ) : null}
            </div>
            {actionContext.presetInput ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <QuickActionButton
                  text="直接发送这条动作"
                  onClick={() => handleQuickAction(actionContext.presetInput!, true)}
                  highlight
                />
                <QuickActionButton
                  text="返回内容详情"
                  onClick={() => navigate(-1)}
                />
              </div>
            ) : null}
          </FeedbackCard>
        ) : null}

        {pendingConfirmation ? (
          <FeedbackCard label="请你确认">
            <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <StatusPill text="待确认" tone="pending" />
                <StatusPill text={`候选 ${pendingConfirmation.candidateIntents.length} 个`} />
              </div>
              <div><strong>原始输入：</strong>{pendingConfirmation.userMessage}</div>
              <div><strong>现在只差一步：</strong>你选一下这条更像哪一种，我就按那个结果处理。</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {pendingConfirmation.candidateIntents.map((item) => (
                <QuickActionButton
                  key={item}
                  text={formatIntentLabel(item)}
                  onClick={() => {
                    setIsTyping(true);
                    setTimeout(() => {
                      void confirmPendingIntent(item);
                      setIsTyping(false);
                    }, 200);
                  }}
                  highlight={item === latestActionSummary?.actionType}
                />
              ))}
              <QuickActionButton
                text="仅聊天，不保存"
                onClick={() => {
                  setIsTyping(true);
                  setTimeout(() => {
                    void confirmPendingIntent('chat_only');
                    setIsTyping(false);
                  }, 200);
                }}
              />
            </div>
          </FeedbackCard>
        ) : null}

        {hasExecutedStage && latestActionSummary ? (
          <FeedbackCard label="本轮摘要">
            <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <StatusPill text="已执行" tone="success" />
                {latestActionSummary.confirmedType ? (
                  <StatusPill text={`确认 ${formatIntentLabel(latestActionSummary.confirmedType)}`} />
                ) : null}
              </div>
              <div><strong>我刚刚已经帮你：</strong>{latestActionSummary.successMessage}</div>
              <div><strong>接下来怎么看：</strong>具体结果和可继续动作都在下面的消息里，这里只保留本轮摘要。</div>
            </div>
          </FeedbackCard>
        ) : null}

        {isHydrating && messages.length === 0 ? (
          <FeedbackCard label="正在连接正式会话">
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.6, margin: 0 }}>
              正在读取最近一次正式会话消息...
            </p>
          </FeedbackCard>
        ) : messages.length === 0 ? (
          <EmptyState onQuickAction={handleQuickAction} />
        ) : (
          <div ref={messagesContainerRef} style={{ flex: 1, overflow: 'auto' }}>
            <MessageList messages={messages} isTyping={isTyping} onMessageAction={handleMessageAction} />
          </div>
        )}
      </PageContent>
      <PageFooter>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={composeMode === 'chat_only' ? '这次只聊天，不保存内容...' : '直接说出关注、任务、想法或调整...'}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            aria-label="输入消息"
            style={{
              flex: 1,
              padding: '12px 14px',
              fontSize: '14px',
              background: 'var(--paper)',
              border: '2px solid var(--ink)',
              outline: 'none',
              fontFamily: 'var(--font-serif-cn)',
              boxShadow: 'inset 2px 2px 0 var(--paper-dark)',
              transition: 'all 0.2s ease',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            aria-disabled={!inputValue.trim() || isTyping}
            className="btn btn-primary"
            style={{
              padding: '12px 20px',
              opacity: inputValue.trim() && !isTyping ? 1 : 0.5,
              letterSpacing: '0.1em',
            }}
          >
            发送
          </button>
        </div>
      </PageFooter>
    </PageLayout>
  );
}
