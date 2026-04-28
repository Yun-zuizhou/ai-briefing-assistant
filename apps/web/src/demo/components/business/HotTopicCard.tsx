import { TrendingUp, TrendingDown } from 'lucide-react';

interface HotTopicCardProps {
  rank: number;
  title: string;
  source?: string;
  category?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  onClick?: () => void;
}

export default function HotTopicCard({
  rank,
  title,
  source,
  category,
  trend = 'up',
  trendValue,
  onClick,
}: HotTopicCardProps) {
  const formattedRank = rank.toString().padStart(2, '0');
  const isUp = trend === 'up';
  const fallbackTrendValue = `${isUp ? '↑' : '↓'} ${30 + (rank % 20)}%`;
  
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 0',
        borderBottom: '1px dashed var(--border)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        minWidth: '48px',
      }}>
        <span style={{
          fontFamily: 'var(--font-serif-cn)',
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--ink)',
        }}>
          {formattedRank}
        </span>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '11px',
          color: isUp ? '#16a34a' : '#dc2626',
        }}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trendValue || fallbackTrendValue}
        </span>
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--ink)',
          lineHeight: 1.5,
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {title}
        </h3>
        {(source || category) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--ink-muted)',
          }}>
            {source && <span>{source}</span>}
            {source && category && <span>·</span>}
            {category && <span>{category}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
