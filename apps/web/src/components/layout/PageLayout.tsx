import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TabBar from './TabBar';
import Button from '../ui/Button';

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
      return { showTabBar: true, showDecorativeCorners: false, showStatusBar: false };
    case 'secondary':
      return { showTabBar: false, showDecorativeCorners: false, showStatusBar: false };
    case 'auth':
      return { showTabBar: false, showDecorativeCorners: false, showStatusBar: false };
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
        <div className="masthead-side-button is-left">
          {leftButton}
        </div>
      )}
      
      {rightButton && (
        <div className="masthead-side-button is-right">
          {rightButton}
        </div>
      )}

      <div className={`masthead-content${leftButton ? ' has-left-button' : ''}${rightButton ? ' has-right-button' : ''}`}>
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
                  <Button type="button" variant="unstyled" className="masthead-meta-link" onClick={link.onClick}>
                    {link.label}
                  </Button>
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
        <Button
          type="button"
          variant="unstyled"
          onClick={() => navigate(-1)}
          className="back-button"
          aria-label="返回上一页"
        >
          <ArrowLeft size={20} />
          <span className="back-button-text">返回</span>
        </Button>
      )}
      {rightButton && (
        <div className="masthead-side-button is-right">
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
      className={`page-content ${className}`.trim()}
      style={style}
      onScroll={onScroll}
    >
      {children}
    </main>
  );
}

interface PageFooterProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function PageFooter({ children, className = '', style }: PageFooterProps) {
  return (
    <div
      className={`page-footer ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

export function PageFooterDecorative() {
  const dotClasses = ['is-faint', 'is-mid', 'is-strong', 'is-mid', 'is-faint'];

  return (
    <PageFooter>
      <div className="page-footer-decorative">
        <div className="page-footer-decorative-line" />
        <div className="page-footer-decorative-diamond" />
        <div className="page-footer-decorative-line" />
      </div>

      <p className="page-footer-decorative-text">
        每天一份简报 · 收集世界 · 记录自己
      </p>

      <div className="page-footer-decorative-dots">
        {dotClasses.map((dotClass, i) => (
          <div
            key={i}
            className={`page-footer-decorative-dot ${dotClass}`}
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
    <div className="page-action-bar">
      {children}
    </div>
  );
}
