import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { useChatLogic } from '../hooks';
import type { ChatEditorialView } from '../components/chat';

type ChatActionContext = {
  presetInput?: string;
  sourceContentRef?: string;
  sourceTitle?: string;
} | null;

type ChatMessageAction = {
  action: string;
  deepLink?: string;
  targetIntent?: string;
  correctionFrom?: string;
  sourceContext?: string;
};

export function useChatPageLogic() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const actionContext = location.state as ChatActionContext;
  const chatView: ChatEditorialView = searchParams.get('view') === 'records' ? 'records' : 'conversation';
  const [inputValue, setInputValue] = useState(() => actionContext?.presetInput ?? '');
  const [isTyping, setIsTyping] = useState(false);
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
    deleteMessage,
    currentSessionId,
    isHydrating,
    chatReadError,
    intentHint,
    sessions,
    switchSession,
    refreshSessionState,
    createNewSession,
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

  const buildSendOptions = useCallback(() => ({
    sourceContext: actionContext?.sourceContentRef ? 'article_action' : undefined,
    autoCommit: false,
    preferredIntent: composeMode === 'smart' ? undefined : composeMode,
  }), [actionContext?.sourceContentRef, composeMode]);

  const sendWithTyping = useCallback((text: string) => {
    setIsTyping(true);
    void sendMessage(text, buildSendOptions()).finally(() => setIsTyping(false));
  }, [buildSendOptions, sendMessage]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isTyping) return;
    const userMessage = inputValue.trim();
    setInputValue('');
    sendWithTyping(userMessage);
  }, [inputValue, isTyping, sendWithTyping]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleQuickAction = useCallback((text: string, autoSend: boolean = false) => {
    if (autoSend) {
      setInputValue('');
      sendWithTyping(text);
      return;
    }
    setInputValue(text);
  }, [sendWithTyping]);

  const handleMessageAction = useCallback((item: ChatMessageAction) => {
    if (item.deepLink) {
      navigate(item.deepLink);
      return;
    }
    if (item.targetIntent && item.correctionFrom) {
      setIsTyping(true);
      void reclassifyMessage({
        originalUserMessage: item.action,
        correctionFrom: item.correctionFrom,
        targetIntent: item.targetIntent,
        sourceContext: item.sourceContext,
      }).finally(() => setIsTyping(false));
      return;
    }
    if (item.targetIntent === 'create_todo' || item.targetIntent === 'record_thought' || item.targetIntent === 'fragmented_thought' || item.targetIntent === 'chat_only') {
      setComposeMode(item.targetIntent);
    }
    setInputValue(item.action);
  }, [navigate, reclassifyMessage, setComposeMode]);

  const handleCopyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Clipboard API may be unavailable in embedded or restricted browsers.
    }
  }, []);

  const handleDeleteMessage = useCallback((messageId: number) => {
    void deleteMessage(messageId);
  }, [deleteMessage]);

  const handleRegenerateMessage = useCallback(() => {
    const lastUserIndex = [...messages].reverse().findIndex((message) => message.role === 'user');
    if (lastUserIndex < 0) return;
    const lastUserMessage = messages[messages.length - 1 - lastUserIndex];
    sendWithTyping(lastUserMessage.content);
  }, [messages, sendWithTyping]);

  const handleConfirmPendingIntent = useCallback((confirmedType: string) => {
    setIsTyping(true);
    setTimeout(() => {
      void confirmPendingIntent(confirmedType).finally(() => setIsTyping(false));
    }, 200);
  }, [confirmPendingIntent]);

  const handleNewSession = useCallback(() => {
    void createNewSession();
  }, [createNewSession]);

  const handleViewChange = useCallback((nextView: ChatEditorialView) => {
    if (nextView === 'records') {
      setSearchParams({ view: 'records' });
      return;
    }
    setSearchParams({});
  }, [setSearchParams]);

  const handleRecordsBack = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const handleContinueSession = useCallback((sessionId: number) => {
    switchSession(sessionId);
    setSearchParams({});
  }, [setSearchParams, switchSession]);

  const handleRetryRead = useCallback(() => {
    void refreshSessionState(currentSessionId);
  }, [currentSessionId, refreshSessionState]);

  const handleBackToSource = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleOpenDeepLink = useCallback((deepLink: string) => {
    navigate(deepLink);
  }, [navigate]);

  return {
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
  };
}
