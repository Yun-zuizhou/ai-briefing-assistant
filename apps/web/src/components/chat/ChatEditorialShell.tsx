import { useCallback, useEffect, useState, type ReactNode, type UIEvent } from 'react';
import { PageContent, PageFooter, PageLayout } from '../layout';
import { DecorFrame, EditorialMasthead, OrnamentDivider, PaperButton } from '../decor';

export type ChatEditorialView = 'conversation' | 'records';
export type ChatMastheadState = 'expanded' | 'compact' | 'collapsed';

function getDefaultMastheadState(view: ChatEditorialView, isEmpty: boolean): ChatMastheadState {
  if (view === 'records') return 'collapsed';
  return isEmpty ? 'expanded' : 'compact';
}

export function ChatEditorialHeader({
  view,
  mastheadState,
  onViewChange,
  onNewSession,
  density = 'full',
}: {
  view: ChatEditorialView;
  mastheadState: ChatMastheadState;
  onViewChange: (view: ChatEditorialView) => void;
  onNewSession: () => void;
  density?: 'full' | 'sample';
}) {
  return (
    <section
      className={`chat-editorial-head chat-editorial-head--${mastheadState} chat-editorial-head--${density}`}
      aria-label="对话页控制区"
    >
      <EditorialMasthead
        variant={mastheadState === 'expanded' ? 'section' : 'compact'}
        title="对话"
        eyebrow="CHAT DIGEST"
        icon="send"
        className="chat-editorial-masthead"
      />
      <OrnamentDivider
        ornament="diamond"
        dashed
        className="chat-editorial-head-divider"
      />
      <div className="chat-editorial-head-controls">
        {density === 'full' ? (
          <div className="chat-masthead-actions">
            <PaperButton onClick={onNewSession}>
              新对话
            </PaperButton>
          </div>
        ) : null}
        <div className="chat-view-toggle" aria-label="对话视图">
          <PaperButton
            active={view === 'conversation'}
            onClick={() => onViewChange('conversation')}
          >
            对话
          </PaperButton>
          <PaperButton
            active={view === 'records'}
            onClick={() => onViewChange('records')}
          >
            记录
          </PaperButton>
        </div>
      </div>
    </section>
  );
}

export function ChatEditorialSurface({ children }: { children: ReactNode }) {
  return (
    <DecorFrame className="chat-page-surface chat-editorial-surface decor-frame-flex">
      <OrnamentDivider
        ornament="none"
        dashed
        className="chat-editorial-surface-divider"
      />
      {children}
    </DecorFrame>
  );
}

export function ChatEditorialShell({
  view,
  isEmpty = false,
  onViewChange,
  onNewSession,
  children,
  footer,
}: {
  view: ChatEditorialView;
  isEmpty?: boolean;
  onViewChange: (view: ChatEditorialView) => void;
  onNewSession: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const [mastheadState, setMastheadState] = useState<ChatMastheadState>(
    () => getDefaultMastheadState(view, isEmpty),
  );

  useEffect(() => {
    setMastheadState(getDefaultMastheadState(view, isEmpty));
  }, [isEmpty, view]);

  const handleContentScroll = useCallback((event: UIEvent<HTMLElement>) => {
    const top = event.currentTarget.scrollTop;
    if (top > 48) {
      setMastheadState('collapsed');
      return;
    }
    if (top > 6) {
      setMastheadState('compact');
      return;
    }
    setMastheadState(getDefaultMastheadState(view, isEmpty));
  }, [isEmpty, view]);

  const pageClassName = [
    'chat-editorial-page',
    `chat-editorial-page--${view}`,
    `chat-editorial-page--masthead-${mastheadState}`,
    view === 'conversation' && isEmpty ? 'chat-editorial-page--empty' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <PageLayout className={pageClassName}>
      <ChatEditorialHeader
        view={view}
        mastheadState={mastheadState}
        onViewChange={onViewChange}
        onNewSession={onNewSession}
      />

      <PageContent
        className="chat-page-content chat-page-content-shell"
        onScroll={handleContentScroll}
      >
        <ChatEditorialSurface>
          {children}
        </ChatEditorialSurface>
      </PageContent>

      <PageFooter className="chat-footer">
        {footer}
      </PageFooter>
    </PageLayout>
  );
}
