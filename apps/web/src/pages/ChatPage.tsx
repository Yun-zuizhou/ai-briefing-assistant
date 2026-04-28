import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChatLogic } from '../hooks';
import { PageLayout, Masthead, PageContent, PageFooter } from '../components/layout';
import { Button } from '../components/ui';
import {
  ChatFeedbackCard as FeedbackCard,
  ChatQuickActionButton as QuickActionButton,
  ChatStatusPill as StatusPill,
} from '../components/business/chat';

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
    <div className={`chat-message-body ${isUser ? 'user' : 'assistant'}`}>
      <div
        className={`chat-message-lead ${isUser ? 'user' : 'assistant'}${rest.length > 0 ? ' has-rest' : ''}`}
      >
        {lead}
      </div>
      {rest.length > 0 ? (
        <div className="chat-message-rest-list">
          {rest.map((item) => (
            <div
              key={item}
              className={`chat-message-rest-item ${isUser ? 'user' : 'assistant'}`}
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
  const lines: string[] = [];

  if (candidateIntents && candidateIntents.length > 0) {
    lines.push(`也可能是：${candidateIntents.join(' / ')}`);
  }
  if (confidence !== undefined) {
    lines.push(`把握大约 ${Math.round(confidence * 100)}%`);
  }
  if (sourceContext) {
    lines.push(`当前来自 ${sourceContext}`);
  }
  if (matchedBy) {
    lines.push(`按 ${matchedBy} 方式识别`);
  }

  if (lines.length === 0) {
    return null;
  }

  return (
    <details
      className="chat-meta-details"
    >
      <summary>
        查看处理细节
      </summary>
      <div className="chat-meta-details-body">
        {lines.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
    </details>
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

function formatComposeModeLabel(mode: string) {
  switch (mode) {
    case 'smart':
      return '智能判断';
    case 'create_todo':
      return '待办模式';
    case 'record_thought':
      return '记录模式';
    case 'fragmented_thought':
      return '碎片模式';
    case 'chat_only':
      return '仅聊天';
    default:
      return formatIntentLabel(mode);
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
  } else if (messageState === 'confirmation') {
    text = confirmedType ? `已确认 ${formatIntentLabel(confirmedType)}` : '已确认';
  } else if (messageState === 'executed') {
    text = confirmedType ? `已执行 ${formatIntentLabel(confirmedType)}` : '已执行';
    tone = 'success';
  } else {
    text = '已发送';
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
    <div className={`chat-message-row ${isUser ? 'user' : 'assistant'}`}>
      <div
        className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
      >
        <div
          className={`chat-bubble-head ${isUser ? 'user' : 'assistant'}`}
        >
          {!isUser ? (
            <div className="chat-assistant-badge">
              助手
            </div>
          ) : null}
          <MessageStateLabel messageState={messageState} confirmedType={confirmedType} />
        </div>
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
          <div className="chat-message-action-row">
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
          <div className="chat-message-change-log">
            {changeLog.map((item) => (
              <div
                key={`${item.entityType}-${item.entityId ?? 'none'}-${item.change}`}
                className="chat-message-change-item"
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
  const renderMessage = (msg: (typeof messages)[number], index: number) => (
    <MessageItem
      key={`${msg.role}-${msg.content}-${index}`}
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
  );

  return (
    <div aria-live="polite" aria-label="消息列表">
      {messages.map(renderMessage)}
      {isTyping ? (
        <div className="chat-message-row assistant">
          <div className="chat-typing-bubble">
            <span>正在整理这句话...</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HeroCard({
  composeMode,
  setComposeMode,
  onQuickAction,
  hasMessages,
}: {
  composeMode: string;
  setComposeMode: (mode: 'smart' | 'create_todo' | 'record_thought' | 'fragmented_thought' | 'chat_only') => void;
  onQuickAction: (text: string, autoSend?: boolean) => void;
  hasMessages: boolean;
}) {
  const modeOptions = [
    { key: 'smart', label: '智能判断' },
    { key: 'create_todo', label: '记待办' },
    { key: 'record_thought', label: '记想法' },
    { key: 'fragmented_thought', label: '记碎片' },
    { key: 'chat_only', label: '仅聊天' },
  ] as const;

  const promptOptions = [
    '我想关注 AI 和远程工作',
    '明天提醒我投简历',
    '今天记一条想法',
    '把这条机会转成待办',
  ];

  return (
    <FeedbackCard
      label={hasMessages ? '继续表达' : '低成本表达入口'}
      tone="accent"
      className="chat-block chat-block-hero"
    >
      <div className="chat-card-grid">
        <div>
          <h2 className="hero-title chat-card-title">
            今天想让我帮你处理什么？
          </h2>
          <p className="content-summary chat-card-subtitle">
            {hasMessages
              ? '继续补充、修正或新增下一步，我会沿着当前会话继续处理。'
              : '可以直接说关注、待办、想法，或者一句调整。我会尽量把它变成一个清楚的结果。'}
          </p>
        </div>
        <div className="action-row">
          {modeOptions.map((item) => (
            <QuickActionButton
              key={item.key}
              text={item.label}
              onClick={() => setComposeMode(item.key)}
              highlight={composeMode === item.key}
            />
          ))}
        </div>
        {!hasMessages ? (
          <div className="subtle-panel">
            <div className="subtle-panel-header">直接用一句示例</div>
            <div className="action-row">
              {promptOptions.map((item) => (
                <QuickActionButton
                  key={item}
                  text={item}
                  onClick={() => onQuickAction(item)}
                />
              ))}
            </div>
          </div>
        ) : null}
        <div className="micro-meta">
          当前输入方式：{formatComposeModeLabel(composeMode)}。
        </div>
      </div>
    </FeedbackCard>
  );
}

function ResultSummaryCard({
  latestActionSummary,
  navigate,
}: {
  latestActionSummary: NonNullable<ReturnType<typeof useChatLogic>['latestActionSummary']>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <FeedbackCard label="本轮摘要" tone="plain" className="chat-block chat-block-summary">
      <div className="chat-summary-card-grid">
        <div className="chat-status-row">
          <StatusPill text="已执行" tone="success" />
          {latestActionSummary.confirmedType ? (
            <StatusPill text={formatIntentLabel(latestActionSummary.confirmedType)} />
          ) : null}
        </div>
        <div className="hero-summary chat-summary-title">
          我刚刚已经帮你：{latestActionSummary.successMessage}
        </div>
        {latestActionSummary.resultSummary ? (
          <div className="chat-summary-text">
            {latestActionSummary.resultSummary}
          </div>
        ) : null}
        <div className="chat-meta-note">
          具体结果和可继续动作都在下面的消息里，这里只保留本轮摘要。
        </div>
        <div className="action-row">
          {latestActionSummary.deepLink && latestActionSummary.nextPageLabel ? (
            <QuickActionButton
              text={latestActionSummary.nextPageLabel}
              onClick={() => navigate(latestActionSummary.deepLink!)}
              highlight
            />
          ) : null}
        </div>
      </div>
    </FeedbackCard>
  );
}

function PendingConfirmationCard({
  pendingConfirmation,
  confirmPendingIntent,
  latestActionSummary,
  setIsTyping,
}: {
  pendingConfirmation: NonNullable<ReturnType<typeof useChatLogic>['pendingConfirmation']>;
  confirmPendingIntent: ReturnType<typeof useChatLogic>['confirmPendingIntent'];
  latestActionSummary: ReturnType<typeof useChatLogic>['latestActionSummary'];
  setIsTyping: (value: boolean) => void;
}) {
  return (
    <FeedbackCard label="请你确认" className="chat-block chat-block-pending">
      <div className="chat-summary-card-grid">
        <div className="chat-status-row">
          <StatusPill text="待确认" tone="pending" />
          <StatusPill text={`候选 ${pendingConfirmation.candidateIntents.length} 个`} />
        </div>
        <div className="chat-confirm-origin">
          原话：{pendingConfirmation.userMessage}
        </div>
        <div className="chat-meta-note">
          你选一下这条更像哪一种，我就按那个结果处理。
        </div>
        <div className="action-row">
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
      </div>
    </FeedbackCard>
  );
}

function ActionContextCard({
  sourceTitle,
  sourceContentRef,
  presetInput,
  onQuickAction,
  navigate,
}: {
  sourceTitle?: string;
  sourceContentRef?: string;
  presetInput?: string;
  onQuickAction: (text: string, autoSend?: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <FeedbackCard label="当前动作上下文" className="chat-block chat-block-context">
      <div className="chat-summary-card-grid">
        <div className="chat-confirm-origin">
          <div><strong>来源内容：</strong>{sourceTitle}</div>
          {sourceContentRef ? <div className="chat-context-ref-note">已带入当前内容上下文。</div> : null}
        </div>
        {presetInput ? (
          <div className="action-row">
            <QuickActionButton
              text="直接发送这条动作"
              onClick={() => onQuickAction(presetInput, true)}
              highlight
            />
            <QuickActionButton text="返回上一页" onClick={() => navigate(-1)} />
          </div>
        ) : null}
      </div>
    </FeedbackCard>
  );
}

function ConversationEmptyState({
  onQuickAction,
}: {
  onQuickAction: (text: string, autoSend?: boolean) => void;
}) {
  const cards = [
    {
      title: '表达关注',
      description: '告诉系统你想持续追踪什么，不用先进入配置页。',
      action: '我想关注 AI 和远程工作',
    },
    {
      title: '表达行动',
      description: '直接把一句话变成待办，后续去行动页继续推进。',
      action: '明天提醒我投简历',
    },
    {
      title: '表达想法',
      description: '把零散感受及时记下，之后会进入日志与成长回看。',
      action: '今天突然想到，AI 发展太快了，有点焦虑',
    },
  ];

  return (
    <div className="chat-empty-state-grid">
      {cards.map((item) => (
        <FeedbackCard key={item.title} label={item.title} tone="plain" className="chat-block chat-block-empty">
          <div className="chat-empty-card-grid">
            <div className="chat-summary-text">
              {item.description}
            </div>
            <div className="chat-confirm-origin">
              示例：{item.action}
            </div>
            <div>
              <QuickActionButton text="直接用这句" onClick={() => onQuickAction(item.action, true)} />
            </div>
          </div>
        </FeedbackCard>
      ))}
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
  const [showAdvancedState, setShowAdvancedState] = useState(false);

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
      <Masthead title="对话" subtitle="一句话交代，系统去处理" ornaments={['✦ CHAT ✦', '✦ EXPRESS ✦']} />
      <PageContent className="chat-page-content chat-page-content-shell chat-page-surface">
        <HeroCard
          composeMode={composeMode}
          setComposeMode={setComposeMode}
          onQuickAction={handleQuickAction}
          hasMessages={messages.length > 0}
        />

        {actionContext?.sourceTitle ? (
          <ActionContextCard
            sourceTitle={actionContext.sourceTitle}
            sourceContentRef={actionContext.sourceContentRef}
            presetInput={actionContext.presetInput}
            onQuickAction={handleQuickAction}
            navigate={navigate}
          />
        ) : null}

        {pendingConfirmation ? (
          <PendingConfirmationCard
            pendingConfirmation={pendingConfirmation}
            confirmPendingIntent={confirmPendingIntent}
            latestActionSummary={latestActionSummary}
            setIsTyping={setIsTyping}
          />
        ) : null}

        {hasExecutedStage && latestActionSummary ? (
          <ResultSummaryCard latestActionSummary={latestActionSummary} navigate={navigate} />
        ) : null}

        {messages.length === 0 ? (
          <ConversationEmptyState onQuickAction={handleQuickAction} />
        ) : (
          <div
            ref={messagesContainerRef}
            className="chat-message-list-scroll chat-thread-panel"
          >
            <MessageList messages={messages} isTyping={isTyping} onMessageAction={handleMessageAction} />
          </div>
        )}

        {(messages.length > 0 || chatReadError || isHydrating) ? (
          <details
            open={showAdvancedState}
            onToggle={(event) => setShowAdvancedState((event.target as HTMLDetailsElement).open)}
            className="chat-details-panel"
          >
            <summary>
              查看处理细节
            </summary>
            <div className="chat-details-body">
              <div className="chat-status-row">
                <StatusPill text={`当前方式：${formatComposeModeLabel(composeMode)}`} />
                {activeSessionSummary?.lastMessageAt ? (
                  <StatusPill text={`最近更新 ${activeSessionSummary.lastMessageAt.slice(0, 16).replace('T', ' ')}`} />
                ) : null}
                {currentSessionId ? <StatusPill text={`会话 ${currentSessionId}`} /> : null}
              </div>
              {chatReadError ? (
                <div className="chat-details-error">
                  会话读取提醒：{chatReadError}
                </div>
              ) : null}
              {isHydrating ? (
                <div className="chat-meta-note">
                  正在同步最近一次对话内容...
                </div>
              ) : null}
              <div className="chat-meta-note">
                当前读取方式：{
                  chatReadMode === 'formal'
                    ? '正式会话'
                    : chatReadMode === 'cache'
                      ? '本地缓存'
                      : '尚无已有会话'
                }
              </div>
            </div>
          </details>
        ) : null}
      </PageContent>
      <PageFooter
        className="chat-footer"
      >
        <div className="chat-input-shell">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={composeMode === 'chat_only' ? '这次只聊天，不保存内容...' : '直接说出关注、任务、想法或调整...'}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            aria-label="输入消息"
            className="chat-input-field"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            aria-disabled={!inputValue.trim() || isTyping}
            variant="primary"
            className="chat-send-btn"
          >
            发送
          </Button>
        </div>
      </PageFooter>
    </PageLayout>
  );
}
