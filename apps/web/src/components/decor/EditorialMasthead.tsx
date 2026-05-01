import { BookishSymbol } from './BookishSymbol';
import { EditorialIcon, type EditorialIconName } from './EditorialIcon';

export type EditorialMastheadVariant = 'front' | 'section' | 'compact';
export type EditorialMastheadTransitionState = 'static' | 'sticky-collapsed';

export function EditorialMasthead({
  title,
  eyebrow = 'EDITORIAL',
  edition,
  meta = [],
  dek,
  icon = 'briefing',
  variant = 'section',
  className = '',
}: {
  title: string;
  eyebrow?: string;
  edition?: string;
  meta?: string[];
  dek?: string;
  icon?: EditorialIconName;
  variant?: EditorialMastheadVariant;
  className?: string;
}) {
  const hasMeta = edition || meta.length > 0;

  return (
    <header className={`editorial-masthead editorial-masthead--${variant} ${className}`.trim()}>
      {hasMeta ? (
        <div className="editorial-masthead-meta">
          {edition ? <span>{edition}</span> : null}
          {meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}

      <div className="editorial-masthead-eyebrow">
        <BookishSymbol shape="diamond" size={8} />
        <span>{eyebrow}</span>
        <BookishSymbol shape="diamond" size={8} />
      </div>

      <div className="editorial-masthead-title-row">
        <EditorialIcon name={icon} size={variant === 'compact' ? 20 : 24} tone="primary" />
        <h2>{title}</h2>
        <EditorialIcon name={icon} size={variant === 'compact' ? 20 : 24} tone="primary" />
      </div>

      {dek ? (
        <p>{dek}</p>
      ) : null}
    </header>
  );
}
