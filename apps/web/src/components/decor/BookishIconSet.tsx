import type { ComponentProps } from 'react';

type Tone = 'gold' | 'primary' | 'secondary' | 'faint' | 'accent';
type IconSize = 'sm' | 'md' | 'lg' | 'xl';

export type BookishIconName =
  /* ─── 通用功能 ─── */
  | 'send' | 'copy' | 'trash' | 'refresh' | 'edit' | 'check'
  | 'close' | 'more' | 'search' | 'bell' | 'settings'
  | 'arrow-left' | 'arrow-right' | 'arrow-up' | 'arrow-down'
  | 'chevron-left' | 'chevron-right' | 'chevron-up' | 'chevron-down'
  | 'external' | 'download' | 'upload' | 'link' | 'share'
  /* ─── 对话相关 ─── */
  | 'message' | 'message-square' | 'chat-bubble' | 'quote'
  | 'microphone' | 'image' | 'attachment' | 'emoji'
  /* ─── 内容相关 ─── */
  | 'bookmark' | 'heart' | 'star' | 'flag' | 'pin'
  | 'folder' | 'file' | 'document' | 'list' | 'grid'
  | 'calendar' | 'clock' | 'history' | 'time'
  /* ─── 状态相关 ─── */
  | 'info' | 'warning' | 'error' | 'success' | 'help'
  | 'loading' | 'spinner' | 'dot' | 'circle' | 'square'
  /* ─── 国风装饰 ─── */
  | 'seal' | 'scroll' | 'fan' | 'lantern' | 'cloud'
  | 'mountain' | 'wave' | 'bamboo' | 'plum' | 'orchid'
  | 'chrysanthemum' | 'bamboo-leaf' | 'pine' | 'crane'
  | 'ink-wash' | 'stamp' | 'coin' | 'knot' | 'ruyi'
  /* ─── 导航相关 ─── */
  | 'home' | 'user' | 'users' | 'profile' | 'logout'
  | 'menu' | 'filter' | 'sort' | 'view-list' | 'view-grid';

const toneVar: Record<Tone, string> = {
  gold: 'var(--bookish-gold, #B89A46)',
  primary: 'var(--bookish-ink-primary, #4A3F35)',
  secondary: 'var(--bookish-ink-secondary, #7A6D60)',
  faint: 'var(--bookish-ink-faint, #A89A8C)',
  accent: 'var(--accent, #A63D2F)',
};

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/* ═══════════════════════════════════════
   SVG Icon Components — 国风线条风格
   设计规范：24x24 视口，1.5px 描边，
   圆角端点，currentColor 填充
   ═══════════════════════════════════════ */

function IconSvg({ c, children, size = 24 }: { c: string; children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

/* ─── 通用功能图标 ─── */

function Send({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </IconSvg>
  );
}

function Copy({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </IconSvg>
  );
}

function Trash({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </IconSvg>
  );
}

function Refresh({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </IconSvg>
  );
}

function Edit({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </IconSvg>
  );
}

function Check({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <polyline points="20 6 9 17 4 12" />
    </IconSvg>
  );
}

function Close({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </IconSvg>
  );
}

function More({ c, s }: { c: string; s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

function Search({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </IconSvg>
  );
}

function Bell({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </IconSvg>
  );
}

function Settings({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </IconSvg>
  );
}

function ArrowLeft({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </IconSvg>
  );
}

function ArrowRight({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </IconSvg>
  );
}

function ArrowUp({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </IconSvg>
  );
}

function ArrowDown({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </IconSvg>
  );
}

function ChevronLeft({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <polyline points="15 18 9 12 15 6" />
    </IconSvg>
  );
}

function ChevronRight({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <polyline points="9 18 15 12 9 6" />
    </IconSvg>
  );
}

function ChevronUp({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <polyline points="18 15 12 9 6 15" />
    </IconSvg>
  );
}

function ChevronDown({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <polyline points="6 9 12 15 18 9" />
    </IconSvg>
  );
}

function External({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </IconSvg>
  );
}

function Download({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </IconSvg>
  );
}

function Upload({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </IconSvg>
  );
}

function Link({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </IconSvg>
  );
}

function Share({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </IconSvg>
  );
}

/* ─── 对话相关 ─── */

function Message({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </IconSvg>
  );
}

function MessageSquare({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </IconSvg>
  );
}

function ChatBubble({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M8 12h8M8 16h4" />
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </IconSvg>
  );
}

function Quote({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </IconSvg>
  );
}

function Microphone({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </IconSvg>
  );
}

function Image({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </IconSvg>
  );
}

function Attachment({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </IconSvg>
  );
}

function Emoji({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </IconSvg>
  );
}

/* ─── 内容相关 ─── */

function Bookmark({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </IconSvg>
  );
}

function Heart({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </IconSvg>
  );
}

function Star({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </IconSvg>
  );
}

function Flag({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </IconSvg>
  );
}

function Pin({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-4H5v4z" />
      <path d="M12 2L8 9h8l-4-7z" />
    </IconSvg>
  );
}

function Folder({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </IconSvg>
  );
}

function File({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </IconSvg>
  );
}

function Document({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </IconSvg>
  );
}

function List({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </IconSvg>
  );
}

function Grid({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </IconSvg>
  );
}

function Calendar({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </IconSvg>
  );
}

function Clock({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </IconSvg>
  );
}

function History({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </IconSvg>
  );
}

function Time({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 16" />
      <path d="M21.54 15H17a2 2 0 0 0-2 2v4" />
    </IconSvg>
  );
}

/* ─── 状态相关 ─── */

function Info({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </IconSvg>
  );
}

function Warning({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </IconSvg>
  );
}

function Error({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </IconSvg>
  );
}

function Success({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </IconSvg>
  );
}

function Help({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </IconSvg>
  );
}

function Loading({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </IconSvg>
  );
}

function Spinner({ c, s }: { c: string; s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spinner { transform-origin: center; animation: spin 1s linear infinite; }
      `}</style>
      <g className="spinner" stroke={c} strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" fill="none" opacity="0.25" />
        <path d="M12 3a9 9 0 0 1 9 9" fill="none" />
      </g>
    </svg>
  );
}

function Dot({ c, s }: { c: string; s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4" fill={c} />
    </svg>
  );
}

function Circle({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="12" cy="12" r="10" />
    </IconSvg>
  );
}

function Square({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </IconSvg>
  );
}

/* ─── 国风装饰图标 ─── */

function Seal({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <rect x="6" y="6" width="12" height="12" rx="0.5" />
      <path d="M9 12h6M12 9v6" strokeWidth="1" />
    </IconSvg>
  );
}

function Scroll({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <line x1="6" y1="8" x2="18" y2="8" />
      <line x1="6" y1="16" x2="18" y2="16" />
      <path d="M4 8H2M4 16H2" />
      <path d="M20 8h2M20 16h2" />
    </IconSvg>
  );
}

function Fan({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10" />
      <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M12 12l-8 4M12 12l8 4" />
    </IconSvg>
  );
}

function Lantern({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <rect x="7" y="6" width="10" height="12" rx="2" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="9" y1="2" x2="15" y2="2" />
      <line x1="9" y1="22" x2="15" y2="22" />
      <path d="M9 10h6M9 14h6" strokeWidth="1" />
    </IconSvg>
  );
}

function Cloud({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </IconSvg>
  );
}

function Mountain({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M3 20h18L14 8l-4 6-3-4-4 10z" />
      <path d="M14 8l3-4 4 16" strokeWidth="1" opacity="0.5" />
    </IconSvg>
  );
}

function Wave({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 6 0" />
      <path d="M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 6 0" strokeWidth="1" opacity="0.5" />
    </IconSvg>
  );
}

function Bamboo({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="18" x2="16" y2="18" />
      <path d="M16 6c2-1 3-3 3-4M16 12c2 0 4-1 4-2M16 18c2 1 3 2 3 3" strokeWidth="1" />
    </IconSvg>
  );
}

function Plum({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M12 22V12" />
      <path d="M12 12c-2-3-5-4-7-3M12 12c2-3 5-4 7-3" strokeWidth="1" />
      <circle cx="8" cy="7" r="1.5" fill={c} stroke="none" />
      <circle cx="16" cy="7" r="1.5" fill={c} stroke="none" />
      <circle cx="12" cy="4" r="1.5" fill={c} stroke="none" />
      <circle cx="6" cy="10" r="1" fill={c} stroke="none" opacity="0.5" />
      <circle cx="18" cy="10" r="1" fill={c} stroke="none" opacity="0.5" />
    </IconSvg>
  );
}

function Orchid({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M12 22c0-5-2-8-4-10" strokeWidth="1" />
      <path d="M12 22c0-5 2-8 4-10" strokeWidth="1" />
      <path d="M8 12c-2-1-4 0-5 2M16 12c2-1 4 0 5 2" strokeWidth="1" />
      <ellipse cx="8" cy="10" rx="2" ry="1.5" fill="none" />
      <ellipse cx="16" cy="10" rx="2" ry="1.5" fill="none" />
      <ellipse cx="12" cy="7" rx="2" ry="1.5" fill="none" />
    </IconSvg>
  );
}

function Chrysanthemum({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="12" cy="12" r="2" fill={c} stroke="none" />
      <ellipse cx="12" cy="6" rx="1.5" ry="3" fill="none" />
      <ellipse cx="12" cy="18" rx="1.5" ry="3" fill="none" />
      <ellipse cx="6" cy="12" rx="3" ry="1.5" fill="none" />
      <ellipse cx="18" cy="12" rx="3" ry="1.5" fill="none" />
      <ellipse cx="7.5" cy="7.5" rx="2" ry="1.2" fill="none" transform="rotate(45 7.5 7.5)" />
      <ellipse cx="16.5" cy="16.5" rx="2" ry="1.2" fill="none" transform="rotate(45 16.5 16.5)" />
      <ellipse cx="16.5" cy="7.5" rx="2" ry="1.2" fill="none" transform="rotate(-45 16.5 7.5)" />
      <ellipse cx="7.5" cy="16.5" rx="2" ry="1.2" fill="none" transform="rotate(-45 7.5 16.5)" />
    </IconSvg>
  );
}

function BambooLeaf({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M12 2c-4 4-6 8-6 12s2 8 6 8 6-4 6-8-2-8-6-12z" />
      <line x1="12" y1="6" x2="12" y2="20" strokeWidth="1" />
    </IconSvg>
  );
}

function Pine({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="12" y1="22" x2="12" y2="18" />
      <path d="M6 18h12l-2-4H8z" />
      <path d="M5 14h14l-3-4H8z" />
      <path d="M4 10h16l-4-4H8z" />
      <path d="M8 6h8l-4-4z" />
    </IconSvg>
  );
}

function Crane({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M20 4c-2 0-4 2-5 4l-2 3" />
      <path d="M13 11c-1 2-3 3-5 3H4" />
      <path d="M15 7c1-1 3-1 4 0" strokeWidth="1" />
      <path d="M8 14c0 2 1 4 3 5" strokeWidth="1" />
      <path d="M4 14l-1 3M6 14l1 3" strokeWidth="1" />
    </IconSvg>
  );
}

function InkWash({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M4 20c2-6 6-10 8-14 2 4 6 8 8 14" opacity="0.6" />
      <path d="M8 20c1-4 3-6 4-8 1 2 3 4 4 8" opacity="0.4" />
      <circle cx="12" cy="4" r="1.5" fill={c} stroke="none" opacity="0.3" />
    </IconSvg>
  );
}

function Stamp({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <rect x="5" y="3" width="14" height="14" rx="1" />
      <path d="M8 8h8M8 11h5" strokeWidth="1" />
      <path d="M4 17h16v4H4z" />
    </IconSvg>
  );
}

function Coin({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <circle cx="12" cy="12" r="9" />
      <rect x="9" y="9" width="6" height="6" rx="0.5" />
    </IconSvg>
  );
}

function Knot({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M12 2v20" />
      <path d="M6 6c0 3 2.5 6 6 6s6-3 6-6" />
      <path d="M6 18c0-3 2.5-6 6-6s6 3 6 6" />
      <circle cx="12" cy="12" r="2" fill={c} stroke="none" />
    </IconSvg>
  );
}

function Ruyi({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M8 4c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V4z" />
      <path d="M10 8v10c0 2 1.5 4 3.5 4s3.5-2 3.5-4" />
      <path d="M8 12h4" strokeWidth="1" />
    </IconSvg>
  );
}

/* ─── 导航相关 ─── */

function Home({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </IconSvg>
  );
}

function User({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </IconSvg>
  );
}

function Users({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconSvg>
  );
}

function Profile({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M16 21v-2a4 4 0 0 0-4-4" opacity="0.3" />
    </IconSvg>
  );
}

function Logout({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </IconSvg>
  );
}

function Menu({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </IconSvg>
  );
}

function Filter({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </IconSvg>
  );
}

function Sort({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <path d="M11 5h10M11 9h7M11 13h4" />
      <path d="M3 5l2 2M3 9l2-2" strokeWidth="1" />
      <path d="M3 13h4M3 17h6" />
    </IconSvg>
  );
}

function ViewList({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </IconSvg>
  );
}

function ViewGrid({ c, s }: { c: string; s: number }) {
  return (
    <IconSvg c={c} size={s}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </IconSvg>
  );
}

/* ═══════════════════════════════════════
   Icon Factory & Main Component
   ═══════════════════════════════════════ */

const iconFactory: Record<BookishIconName, React.FC<{ c: string; s: number }>> = {
  /* 通用功能 */
  send: Send, copy: Copy, trash: Trash, refresh: Refresh, edit: Edit, check: Check,
  close: Close, more: More, search: Search, bell: Bell, settings: Settings,
  'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, 'arrow-up': ArrowUp, 'arrow-down': ArrowDown,
  'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'chevron-up': ChevronUp, 'chevron-down': ChevronDown,
  external: External, download: Download, upload: Upload, link: Link, share: Share,
  /* 对话相关 */
  message: Message, 'message-square': MessageSquare, 'chat-bubble': ChatBubble, quote: Quote,
  microphone: Microphone, image: Image, attachment: Attachment, emoji: Emoji,
  /* 内容相关 */
  bookmark: Bookmark, heart: Heart, star: Star, flag: Flag, pin: Pin,
  folder: Folder, file: File, document: Document, list: List, grid: Grid,
  calendar: Calendar, clock: Clock, history: History, time: Time,
  /* 状态相关 */
  info: Info, warning: Warning, error: Error, success: Success, help: Help,
  loading: Loading, spinner: Spinner, dot: Dot, circle: Circle, square: Square,
  /* 国风装饰 */
  seal: Seal, scroll: Scroll, fan: Fan, lantern: Lantern, cloud: Cloud,
  mountain: Mountain, wave: Wave, bamboo: Bamboo, plum: Plum, orchid: Orchid,
  chrysanthemum: Chrysanthemum, 'bamboo-leaf': BambooLeaf, pine: Pine, crane: Crane,
  'ink-wash': InkWash, stamp: Stamp, coin: Coin, knot: Knot, ruyi: Ruyi,
  /* 导航相关 */
  home: Home, user: User, users: Users, profile: Profile, logout: Logout,
  menu: Menu, filter: Filter, sort: Sort, 'view-list': ViewList, 'view-grid': ViewGrid,
};

export interface BookishIconSetProps extends ComponentProps<'span'> {
  name: BookishIconName;
  size?: IconSize | number;
  tone?: Tone;
  className?: string;
}

export function BookishIconSet({
  name,
  size = 'md',
  tone = 'primary',
  className = '',
  ...rest
}: BookishIconSetProps) {
  const IconComponent = iconFactory[name];
  const color = toneVar[tone];
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];

  if (!IconComponent) {
    console.warn(`[BookishIconSet] Unknown icon name: ${name}`);
    return null;
  }

  return (
    <span
      className={`bookish-icon-set ${className}`.trim()}
      style={{
        width: pixelSize,
        height: pixelSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color,
      }}
      aria-hidden="true"
      {...rest}
    >
      <IconComponent c="currentColor" s={pixelSize} />
    </span>
  );
}

/* ═══════════════════════════════════════
   Animated Icons
   ═══════════════════════════════════════ */

export function AnimatedSpinner({
  size = 'md',
  tone = 'primary',
  className = '',
}: {
  size?: IconSize | number;
  tone?: Tone;
  className?: string;
}) {
  const color = toneVar[tone];
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <span
      className={`bookish-icon-set bookish-spinner ${className}`.trim()}
      style={{
        width: pixelSize,
        height: pixelSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color,
      }}
      aria-hidden="true"
    >
      <svg width={pixelSize} height={pixelSize} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes bookish-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .bookish-spinner-ring {
            transform-origin: center;
            animation: bookish-spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>
        <g className="bookish-spinner-ring" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" fill="none" opacity="0.2" />
          <path d="M12 3a9 9 0 0 1 9 9" fill="none" />
        </g>
      </svg>
    </span>
  );
}

export function TypingDots({
  size = 'md',
  tone = 'secondary',
  className = '',
}: {
  size?: IconSize | number;
  tone?: Tone;
  className?: string;
}) {
  const color = toneVar[tone];
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  const dotSize = pixelSize * 0.25;

  return (
    <span
      className={`bookish-typing-dots ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dotSize * 0.6,
        height: pixelSize,
        color,
      }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="bookish-typing-dot"
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: 'currentColor',
            animation: `bookish-typing-bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
          }}
        />
      ))}
    </span>
  );
}
