import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TabBar from './TabBar';

export type PageVariant = 'main' | 'secondary' | 'auth' | 'report';

interface PageLayoutProps {
  children: ReactNode;
  variant?: PageVariant;
  showTabBar?: boolean;
  showDecorativeCorners?: boolean;
  showStatusBar?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function PageLayout({ 
  children, 
  variant = 'main',
  showTabBar,
  showDecorativeCorners,
  showStatusBar,
  className = '',
  style 
}: PageLayoutProps) {
  const config = getVariantConfig(variant);
  const finalShowTabBar = showTabBar ?? config.showTabBar;
  const finalShowDecorativeCorners = showDecorativeCorners ?? config.showDecorativeCorners;
  const finalShowStatusBar = showStatusBar ?? config.showStatusBar;

  return (
    <div className={`app ${className}`} style={style}>
      {finalShowDecorativeCorners && (
        <>
          <div className="decorative-corner top-left" />
          <div className="decorative-corner top-right" />
        </>
      )}
      
      {finalShowStatusBar && <div className="status-bar" />}

      {children}

      {finalShowTabBar && <TabBar />}
    </div>
  );
}

function getVariantConfig(variant: PageVariant) {
  switch (variant) {
    case 'main':
      return { showTabBar: true, showDecorativeCorners: true, showStatusBar: true };
    case 'secondary':
      return { showTabBar: false, showDecorativeCorners: false, showStatusBar: false };
    case 'auth':
      return { showTabBar: false, showDecorativeCorners: true, showStatusBar: false };
    case 'report':
      return { showTabBar: false, showDecorativeCorners: false, showStatusBar: false };
    default:
      return { showTabBar: false, showDecorativeCorners: false, showStatusBar: false };
  }
}

export interface MetaLink {
  label: string;
  onClick?: () => void;
}

interface MastheadProps {
  title: string;
  subtitle?: string;
  ornaments?: [string, string];
  meta?: string;
  metaLinks?: MetaLink[];
  leftButton?: ReactNode;
  rightButton?: ReactNode;
}

export function Masthead({ 
  title, 
  subtitle, 
  ornaments = ['✦ AI ✦', '✦ BRIEFING ✦'],
  meta,
  metaLinks,
  leftButton,
  rightButton,
}: MastheadProps) {
  return (
    <header className="masthead">
      {leftButton && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 110,
        }}>
          {leftButton}
        </div>
      )}
      
      {rightButton && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 110,
        }}>
          {rightButton}
        </div>
      )}

      <div className="masthead-content">
        <div className="masthead-top">
          <span className="masthead-ornament">{ornaments[0]}</span>
          <span className="masthead-ornament">{ornaments[1]}</span>
        </div>
        <h1 className="masthead-title">{title}</h1>
        {subtitle && (
          <div className="masthead-divider">
            <span>{subtitle}</span>
          </div>
        )}
        {metaLinks && metaLinks.length > 0 ? (
          <div className="masthead-meta masthead-meta-links">
            {metaLinks.map((link, index) => (
              <span key={index}>
                {link.onClick ? (
                  <button className="masthead-meta-link" onClick={link.onClick}>
                    {link.label}
                  </button>
                ) : (
                  <span>{link.label}</span>
                )}
                {index < metaLinks.length - 1 && <span className="masthead-meta-dot"> · </span>}
              </span>
            ))}
          </div>
        ) : meta ? (
          <div className="masthead-meta">
            <span>{meta}</span>
          </div>
        ) : null}
      </div>
    </header>
  );
}

interface SecondaryHeaderProps {
  title: string;
  label?: string;
  subtitle?: string;
  showBack?: boolean;
  rightButton?: ReactNode;
}

export function SecondaryHeader({ 
  title, 
  label = 'PAGE',
  subtitle,
  showBack = true,
  rightButton,
}: SecondaryHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="masthead masthead-secondary">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="back-button"
          aria-label="返回上一页"
        >
          <ArrowLeft size={20} />
          <span className="back-button-text">返回</span>
        </button>
      )}
      {rightButton && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 110,
        }}>
          {rightButton}
        </div>
      )}
      <div className="masthead-content">
        <div className="masthead-header-row">
          {label && <span className="masthead-label">{label}</span>}
        </div>
        <h1 className="masthead-title">{title}</h1>
        {subtitle && <p className="masthead-subtitle">{subtitle}</p>}
      </div>
    </header>
  );
}

interface PageContentProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function PageContent({ 
  children, 
  className = '',
  style,
  onScroll,
}: PageContentProps) {
  return (
    <main 
      className={className}
      style={{
        flex: 1,
        overflow: 'auto',
        ...style,
      }}
      onScroll={onScroll}
    >
      {children}
    </main>
  );
}

interface PageBodyProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  density?: 'comfortable' | 'compact';
}

export function PageBody({
  children,
  className = '',
  style,
  density = 'comfortable',
}: PageBodyProps) {
  return (
    <div
      className={`page-body ${density === 'compact' ? 'page-body-compact' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

interface PageSectionProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

export function PageSection({
  children,
  className = '',
  style,
  compact = false,
}: PageSectionProps) {
  return (
    <section
      className={`section page-section ${compact ? 'page-section-compact' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </section>
  );
}

interface PageSectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageSectionHeader({
  title,
  description,
  action,
  className = '',
}: PageSectionHeaderProps) {
  return (
    <div className={`section-header page-section-header ${className}`.trim()}>
      <div className="page-section-heading">
        <div className="section-title">{title}</div>
        {description ? <p className="page-section-description">{description}</p> : null}
      </div>
      {action ? <div className="page-section-action">{action}</div> : null}
    </div>
  );
}

interface PagePanelProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tone?: 'default' | 'plain' | 'accent';
}

export function PagePanel({
  children,
  className = '',
  style,
  tone = 'default',
}: PagePanelProps) {
  return (
    <div
      className={`page-panel page-panel-${tone} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

interface PageFooterProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

export function PageFooter({ children, style }: PageFooterProps) {
  return (
    <div style={{
      flexShrink: 0,
      padding: '20px',
      paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
      textAlign: 'center',
      background: 'var(--paper-warm)',
      borderTop: '2px solid var(--ink)',
      boxSizing: 'border-box',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function PageFooterDecorative() {
  return (
    <PageFooter>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '10px',
      }}>
        <div style={{ width: '32px', height: '1px', background: 'var(--border)' }} />
        <div style={{
          width: '6px',
          height: '6px',
          background: 'var(--gold)',
          transform: 'rotate(45deg)',
        }} />
        <div style={{ width: '32px', height: '1px', background: 'var(--border)' }} />
      </div>

      <p style={{
        fontSize: '13px',
        color: 'var(--ink-muted)',
        letterSpacing: '0.08em',
        marginBottom: '8px',
      }}>
        每天一份简报 · 收集世界 · 记录自己
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
      }}>
        {[0.3, 0.5, 1, 0.5, 0.3].map((opacity, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: '4px',
              background: 'var(--gold)',
              transform: 'rotate(45deg)',
              opacity,
            }}
          />
        ))}
      </div>
    </PageFooter>
  );
}

interface PageActionBarProps {
  children: ReactNode;
}

export function PageActionBar({ children }: PageActionBarProps) {
  return (
    <div style={{
      flexShrink: 0,
      padding: '16px',
      background: 'var(--paper-warm)',
      borderTop: '2px solid var(--ink)',
      display: 'flex',
      gap: '12px',
      boxSizing: 'border-box',
    }}>
      {children}
    </div>
  );
}
