import type { ReactNode } from 'react';

export type SealTone = 'red' | 'gold' | 'ink' | 'vermilion';

const toneStyles: Record<SealTone, { bg: string; border: string; text: string; shadow: string }> = {
  red: {
    bg: 'rgba(166, 61, 47, 0.08)',
    border: 'rgba(166, 61, 47, 0.6)',
    text: '#A63D2F',
    shadow: '0 0 0 1px rgba(166, 61, 47, 0.15), inset 0 0 8px rgba(166, 61, 47, 0.06)',
  },
  gold: {
    bg: 'rgba(184, 154, 70, 0.08)',
    border: 'rgba(184, 154, 70, 0.6)',
    text: '#B89A46',
    shadow: '0 0 0 1px rgba(184, 154, 70, 0.15), inset 0 0 8px rgba(184, 154, 70, 0.06)',
  },
  ink: {
    bg: 'rgba(44, 36, 22, 0.04)',
    border: 'rgba(44, 36, 22, 0.4)',
    text: '#2C2416',
    shadow: '0 0 0 1px rgba(44, 36, 22, 0.1), inset 0 0 8px rgba(44, 36, 22, 0.04)',
  },
  vermilion: {
    bg: 'rgba(200, 80, 60, 0.08)',
    border: 'rgba(200, 80, 60, 0.55)',
    text: '#C8503C',
    shadow: '0 0 0 1px rgba(200, 80, 60, 0.12), inset 0 0 8px rgba(200, 80, 60, 0.05)',
  },
};

export function SealStamp({
  children,
  tone = 'red',
  size = 'md',
  shape = 'square',
  className = '',
}: {
  children: ReactNode;
  tone?: SealTone;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'square' | 'circle';
  className?: string;
}) {
  const style = toneStyles[tone];
  const sizeMap = { sm: 48, md: 64, lg: 80 };
  const pixelSize = sizeMap[size];
  const borderRadius = shape === 'circle' ? '50%' : '4px';

  return (
    <div
      className={`seal-stamp ${className}`.trim()}
      style={{
        width: pixelSize,
        height: pixelSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius,
        color: style.text,
        fontFamily: 'var(--font-serif-cn)',
        fontSize: pixelSize * 0.35,
        fontWeight: 700,
        letterSpacing: '0.08em',
        boxShadow: style.shadow,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* 内边框装饰 */}
      <span
        style={{
          position: 'absolute',
          inset: 4,
          border: `1px dashed ${style.border}`,
          borderRadius: shape === 'circle' ? '50%' : '2px',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />
      {children}
    </div>
  );
}

export function SealText({
  text,
  tone = 'red',
  size = 'md',
  vertical = false,
  className = '',
}: {
  text: string;
  tone?: SealTone;
  size?: 'sm' | 'md' | 'lg';
  vertical?: boolean;
  className?: string;
}) {
  const style = toneStyles[tone];
  const sizeMap = { sm: 40, md: 56, lg: 72 };
  const pixelSize = sizeMap[size];

  return (
    <div
      className={`seal-text ${className}`.trim()}
      style={{
        width: vertical ? pixelSize * 0.6 : pixelSize,
        minHeight: pixelSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: 3,
        color: style.text,
        fontFamily: 'var(--font-serif-cn)',
        fontSize: vertical ? pixelSize * 0.28 : pixelSize * 0.3,
        fontWeight: 700,
        letterSpacing: vertical ? '0.2em' : '0.08em',
        writingMode: vertical ? 'vertical-rl' : 'horizontal-tb',
        boxShadow: style.shadow,
        padding: vertical ? '8px 4px' : '4px 8px',
        lineHeight: 1.4,
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
}
