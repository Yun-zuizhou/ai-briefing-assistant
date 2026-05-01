import type { ComponentProps } from 'react';

export type BookishIconTone = 'gold' | 'primary' | 'secondary' | 'faint';
export type BookishIconName =
  | 'chevron-diamond' | 'lantern' | 'scroll' | 'inbox'
  | 'bell' | 'search' | 'refresh' | 'arrow-left' | 'arrow-right'
  | 'close' | 'more' | 'settings' | 'edit' | 'bookmark' | 'send' | 'archive'
  | 'brief' | 'briefing' | 'editorial' | 'complete'
  | 'dot' | 'corner-mark' | 'section-break';

const toneVar: Record<BookishIconTone, string> = {
  gold: 'var(--bookish-gold)',
  primary: 'var(--bookish-line-brown)',
  secondary: 'var(--bookish-ink-secondary)',
  faint: 'var(--bookish-ink-faint)',
};

/*
  Style spec: 24x24 grid, 2px stroke, round caps/joins, 2px padding, currentColor only.
  Generated following icon-set-generator SVG rules.
*/

function StyledSvg({ c, children }: { c: string; children: React.ReactNode }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

/* ─── 参考风格复现图标 ─── */

function ChevronDiamond({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M12 3.8 20.2 12 12 20.2 3.8 12 12 3.8Z" />
      <path d="m10.2 8.2 3.8 3.8-3.8 3.8" />
    </StyledSvg>
  );
}

function Lantern({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M12 3v3" />
      <path d="M8.5 6h7" />
      <path d="M8 12c0-3.4 1.8-6 4-6s4 2.6 4 6-1.8 6-4 6-4-2.6-4-6Z" />
      <path d="M6 12c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6-6-2.7-6-6Z" />
      <path d="M8.5 18h7" />
      <path d="M12 18v3.5" />
      <path d="M10.5 21.5h3" />
    </StyledSvg>
  );
}

function Scroll({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M7 5h12v14H7" />
      <path d="M7 19c-2.2 0-3.5-.9-3.5-2.5V7.4C3.5 5.9 4.8 5 7 5s3.5.9 3.5 2.4V19" />
      <path d="M3.5 16.5c0 1.5 1.3 2.5 3.5 2.5" />
      <path d="M13 9h3.5" />
      <path d="M13 12h3.5" />
      <path d="M13 15h3.5" />
    </StyledSvg>
  );
}

function Inbox({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M5 9.5h14v8A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5v-8Z" />
      <path d="M7.5 6h9L19 9.5H5L7.5 6Z" />
      <path d="M9 14h2l1 1.5 1-1.5h2" />
    </StyledSvg>
  );
}

/* ─── 通用功能图标 ─── */

function Bell({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M12 4v3" />
      <path d="M8 7h8" />
      <path d="M6.5 12c0-3.2 2.5-5.5 5.5-5.5s5.5 2.3 5.5 5.5-2.5 5.5-5.5 5.5S6.5 15.2 6.5 12Z" />
      <path d="M9.4 7.2c-.9 1.3-1.4 2.9-1.4 4.8s.5 3.5 1.4 4.8" />
      <path d="M14.6 7.2c.9 1.3 1.4 2.9 1.4 4.8s-.5 3.5-1.4 4.8" />
      <path d="M8.8 17.5h6.4" />
      <path d="M12 17.5v3.5" />
      <path d="M10.5 21h3" />
    </StyledSvg>
  );
}

function Search({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" />
    </StyledSvg>
  );
}

function Refresh({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M21 2v5h-5M3 22v-5h5" />
      <path d="M21 7A9 9 0 0 0 5.5 4.5M3 17a9 9 0 0 0 15.5 2.5" />
    </StyledSvg>
  );
}

function ArrowLeft({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <polyline points="15 5 7 12 15 19" />
    </StyledSvg>
  );
}

function ArrowRight({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <polyline points="9 5 17 12 9 19" />
    </StyledSvg>
  );
}

function Close({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <line x1="7" y1="7" x2="17" y2="17" />
      <line x1="17" y1="7" x2="7" y2="17" />
    </StyledSvg>
  );
}

function More({ c }: { c: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={c} xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function Settings({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M5 7h14" />
      <path d="M5 12h14" />
      <path d="M5 17h14" />
      <circle cx="9" cy="7" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="11" cy="17" r="1.5" />
    </StyledSvg>
  );
}

function Edit({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M8 20l4-3 4 3V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2z" />
    </StyledSvg>
  );
}

function Bookmark({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M7 4.5h10v15l-5-3-5 3v-15Z" />
      <path d="M9.5 8h5" />
    </StyledSvg>
  );
}

function Send({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M4 12 20 5l-6.5 15-2.8-6.7L4 12z" />
      <path d="M10.7 13.3 20 5" />
    </StyledSvg>
  );
}

function Archive({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <rect x="4" y="5" width="16" height="4" rx="1.5" />
      <path d="M6 9v9.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V9" />
      <path d="M9 13h6" />
    </StyledSvg>
  );
}

/* ─── 模块标识图标 ─── */

function Brief({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M5.5 4.5h13v15h-13v-15Z" />
      <path d="M8.5 8h7" />
      <path d="M8.5 11h7" />
      <path d="M8.5 14h4" />
      <path d="M15 14h.5" />
    </StyledSvg>
  );
}

function Editorial({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 3v18M16 3v18M6 8h12" />
    </StyledSvg>
  );
}

function Complete({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <polyline points="7 13 10 16 17 9" />
    </StyledSvg>
  );
}

/* ─── 装饰性图标 ─── */

function Dot({ c }: { c: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4" fill={c} />
    </svg>
  );
}

function CornerMark({ c }: { c: string }) {
  return (
    <StyledSvg c={c}>
      <path d="M5 5v4h4M19 19v-4h-4" />
    </StyledSvg>
  );
}

function SectionBreak({ c }: { c: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={c} xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="9" width="4" height="4" rx="0.5" transform="rotate(45 5 11)" />
      <rect x="10" y="9" width="4" height="4" rx="0.5" transform="rotate(45 12 11)" />
      <rect x="17" y="9" width="4" height="4" rx="0.5" transform="rotate(45 19 11)" />
    </svg>
  );
}

/* ─── 主组件 ─── */

type Variant = 'fill' | 'outline';

const iconFactory: Record<BookishIconName, React.FC<{ c: string }>> = {
  'chevron-diamond': ChevronDiamond,
  lantern: Lantern,
  scroll: Scroll,
  inbox: Inbox,
  bell: Bell,
  search: Search,
  refresh: Refresh,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  close: Close,
  more: More,
  settings: Settings,
  edit: Edit,
  bookmark: Bookmark,
  send: Send,
  archive: Archive,
  brief: Brief,
  briefing: Brief,
  editorial: Editorial,
  complete: Complete,
  dot: Dot,
  'corner-mark': CornerMark,
  'section-break': SectionBreak,
};

export function BookishIcon({
  name,
  size = 24,
  variant = 'outline',
  tone = 'primary',
  className = '',
  ...rest
}: {
  name: BookishIconName;
  size?: number;
  variant?: Variant;
  tone?: BookishIconTone;
  className?: string;
} & ComponentProps<'span'>) {
  const IconComponent = iconFactory[name];
  const color = toneVar[tone];

  return (
    <span
      className={`bookish-icon bookish-icon--${variant} ${className}`.trim()}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color,
      }}
      aria-hidden="true"
      {...rest}
    >
      <IconComponent c="currentColor" />
    </span>
  );
}
