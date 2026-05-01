import { BookishCard } from './BookishCard';
import { StitchDivider } from './StitchDivider';
import { QuoteBlock } from './QuoteBlock';
import { OrnamentDivider } from './OrnamentDivider';
import { MetaText } from './MetaText';
import { StatusBadge } from './StatusBadge';
import { PaperButton } from './PaperButton';

export function SystemBriefCard({
  title = '系统简报',
  time,
  source,
  content,
  citation,
  status,
  actions,
  className = '',
}: {
  title?: string;
  time?: string;
  source?: string;
  content: string;
  citation?: string;
  status?: 'pending' | 'success' | 'neutral';
  actions?: Array<{ label: string; primary?: boolean; onClick: () => void }>;
  className?: string;
}) {
  const metaItems = [time, source].filter(Boolean) as string[];

  return (
    <BookishCard title={title} ornament="diamond" variant="raised" className={className}>
      <div style={{ display: 'flex', gap: 12 }}>
        <StitchDivider height={64} />
        <div style={{ flex: 1 }}>
          <QuoteBlock tone="accent" cite={citation}>
            {content}
          </QuoteBlock>
        </div>
      </div>

      {metaItems.length > 0 || status ? (
        <>
          <OrnamentDivider ornament="none" dashed />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            {metaItems.length > 0 ? <MetaText items={metaItems} /> : <span />}
            {status ? <StatusBadge label={status === 'success' ? '已执行' : status === 'pending' ? '待处理' : '进行中'} tone={status} /> : null}
          </div>
        </>
      ) : null}

      {actions && actions.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {actions.map((a) => (
            <PaperButton key={a.label} active={a.primary} onClick={a.onClick}>
              {a.label}
            </PaperButton>
          ))}
        </div>
      ) : null}
    </BookishCard>
  );
}
