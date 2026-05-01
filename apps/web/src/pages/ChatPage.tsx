import {
  ActionContextCard,
  ChatEditorialShell,
  ChatInputArea,
  ChatRecordsPanel,
  HeroCard,
  MessageList,
  PendingConfirmationCard,
  ResultSummaryCard,
} from '../components/chat';
import { useChatPageLogic } from './useChatPageLogic';

export default function ChatPage() {
  const {
    actionContext,
    chatReadError,
    chatView,
    composeMode,
    currentSessionId,
    handleBackToSource,
    handleConfirmPendingIntent,
    handleContinueSession,
    handleCopyMessage,
    handleDeleteMessage,
    handleKeyDown,
    handleMessageAction,
    handleNewSession,
    handleOpenDeepLink,
    handleQuickAction,
    handleRecordsBack,
    handleRegenerateMessage,
    handleRetryRead,
    handleSend,
    handleViewChange,
    hasExecutedStage,
    inputValue,
    intentHint,
    isHydrating,
    isTyping,
    latestActionSummary,
    messages,
    messagesContainerRef,
    pendingConfirmation,
    sessions,
    setComposeMode,
    setInputValue,
    switchSession,
  } = useChatPageLogic();

  return (
    <ChatEditorialShell
      view={chatView}
      isEmpty={chatView === 'conversation' && messages.length === 0 && !isHydrating}
      onViewChange={handleViewChange}
      onNewSession={handleNewSession}
      footer={chatView === 'conversation' ? (
        <ChatInputArea
          composeMode={composeMode}
          onModeChange={setComposeMode}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          isTyping={isTyping}
          showModeBar={messages.length > 0}
        />
      ) : (
        <div className="chat-records-footer">
          <button
            type="button"
            className="chat-records-back-btn"
            onClick={handleRecordsBack}
          >
            返回对话
          </button>
        </div>
      )}
    >
      {chatView === 'records' ? (
        <ChatRecordsPanel
          currentSessionId={currentSessionId}
          sessions={sessions}
          onSelectSession={switchSession}
          onContinueSession={handleContinueSession}
        />
      ) : (
        <>
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
              onBack={handleBackToSource}
            />
          ) : null}

          {chatReadError && messages.length === 0 ? (
            <div className="chat-error-banner">
              <span className="chat-error-banner-icon">!</span>
              <span>数据加载失败：{chatReadError}</span>
              <button type="button" className="chat-error-retry-btn" onClick={handleRetryRead}>重试</button>
            </div>
          ) : null}

          {intentHint ? (
            <div className="chat-intent-hint">
              <span className="chat-intent-hint-text">{intentHint.text}</span>
            </div>
          ) : null}

          {isHydrating && messages.length === 0 ? (
            <div className="chat-loading-skeleton">
              <div className="chat-loading-skeleton-bar" />
              <div className="chat-loading-skeleton-bar short" />
              <div className="chat-loading-skeleton-bar medium" />
            </div>
          ) : messages.length === 0 ? null : (
            <div
              ref={messagesContainerRef}
              className="chat-message-list-scroll"
            >
              {pendingConfirmation ? (
                <PendingConfirmationCard
                  pendingConfirmation={pendingConfirmation}
                  latestActionSummary={latestActionSummary}
                  onConfirmIntent={handleConfirmPendingIntent}
                />
              ) : null}
              {hasExecutedStage && latestActionSummary ? (
                <ResultSummaryCard
                  latestActionSummary={latestActionSummary}
                  onOpenDeepLink={handleOpenDeepLink}
                />
              ) : null}
              <MessageList
                messages={messages}
                isTyping={isTyping}
                onMessageAction={handleMessageAction}
                onCopyMessage={handleCopyMessage}
                onDeleteMessage={handleDeleteMessage}
                onRegenerateMessage={handleRegenerateMessage}
              />
            </div>
          )}
        </>
      )}
    </ChatEditorialShell>
  );
}
