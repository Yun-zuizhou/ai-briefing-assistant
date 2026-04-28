import type { ReactNode } from 'react';

export function ChatQuickActionButton({
  text,
  onClick,
  highlight,
}: {
  text: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`action-chip ${highlight ? 'primary' : ''}`}
    >
      {text}
    </button>
  );
}

export function ChatFeedbackCard({
  label,
  children,
  tone = 'default',
}: {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'accent' | 'plain';
}) {
  const background =
    tone === 'accent'
      ? 'linear-gradient(180deg, var(--paper-warm) 0%, var(--accent-light) 100%)'
      : tone === 'plain'
        ? 'var(--paper)'
        : 'var(--paper-warm)';

  const border =
    tone === 'accent' ? '1px solid rgba(166, 61, 47, 0.25)' : '1px solid var(--border)';

  return (
    <div
      className={`feedback-card ${tone === 'accent' ? 'accent' : tone === 'plain' ? 'plain' : 'default'}`}
      style={{ background, border }}
    >
      <div
        style={{
          fontFamily: 'var(--font-sans-cn)',
          fontSize: '11px',
          color: 'var(--accent)',
          fontWeight: 700,
          marginBottom: '8px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export function ChatStatusPill({
  text,
  tone = 'neutral',
}: {
  text: string;
  tone?: 'neutral' | 'pending' | 'success';
}) {
  const background =
    tone === 'pending'
      ? 'rgba(245, 235, 211, 0.7)'
      : tone === 'success'
        ? 'rgba(45, 90, 39, 0.12)'
        : 'rgba(237, 233, 220, 0.95)';
  const borderColor =
    tone === 'pending'
      ? 'rgba(139, 105, 20, 0.3)'
      : tone === 'success'
        ? 'rgba(45, 90, 39, 0.28)'
        : 'rgba(212, 205, 184, 0.95)';
  const color = tone === 'success' ? 'var(--semantic-success, #2D5A27)' : 'var(--ink)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        border: `1px solid ${borderColor}`,
        background,
        color,
        fontFamily: 'var(--font-sans-cn)',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.04em',
      }}
    >
      {text}
    </span>
  );
}
