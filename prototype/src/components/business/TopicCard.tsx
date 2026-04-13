import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import type { TopicCard as TopicCardType } from '../../data/types';
import { useAppContext } from '../../context/useAppContext';

const trendConfig = {
  up: { label: '热度↑', color: '#A63D2F' },
  down: { label: '热度↓', color: '#5A4D3A' },
  new: { label: '新增', color: '#2D5A27' },
  stable: { label: '稳定', color: '#8B7D66' },
};

interface TopicCardProps {
  topic: TopicCardType;
}

export default function TopicCard({ topic }: TopicCardProps) {
  const navigate = useNavigate();
  const { collectedItems, setCollectedItems } = useAppContext();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const trend = trendConfig[topic.trend];

  const isCollected = collectedItems.some(
    item => item.title === topic.title && item.category === topic.title
  );

  const handleCollect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isCollected) {
      setCollectedItems(prev => prev.filter(item => !(item.title === topic.title && item.category === topic.title)));
      setToastMessage('已取消收藏');
    } else {
      const newItem = {
        id: Date.now(),
        type: 'topic',
        category: topic.title,
        title: topic.title,
        summary: topic.summary,
        source: topic.contents?.[0]?.source || 'AI整理',
        sourceUrl: topic.contents?.[0]?.url || '',
        collectedAt: new Date().toLocaleDateString('zh-CN'),
        tracking: false,
      };
      setCollectedItems(prev => [newItem, ...prev]);
      setToastMessage('已收藏');
    }
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  }, [isCollected, topic, setCollectedItems]);

  const handleArticleClick = useCallback((content: { id: string; title: string; source: string; url: string }) => {
    navigate('/article', { 
      state: { 
        article: {
          id: content.id,
          title: content.title,
          source: content.source,
          url: content.url,
          summary: topic.summary,
          category: topic.title,
        }
      }
    });
  }, [navigate, topic.summary, topic.title]);

  const handleViewMore = useCallback(() => {
    navigate('/hot-topics');
  }, [navigate]);

  return (
    <div className="domain-card">
      <div className="domain-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="domain-name" style={{ color: trend.color }}>
            {topic.icon} {topic.title}
          </div>
          <button
            onClick={handleCollect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              background: isCollected ? 'var(--gold)' : 'var(--paper-warm)',
              border: '1px solid var(--ink)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-serif-cn)',
              color: isCollected ? 'var(--paper)' : 'var(--ink)',
              transition: 'all 0.2s',
            }}
          >
            <Bookmark size={12} fill={isCollected ? 'currentColor' : 'none'} />
            {isCollected ? '已收藏' : '收藏'}
          </button>
        </div>
        <p className="domain-summary">{topic.summary}</p>
        
        <div className="domain-trend">
          <div className="domain-trend-title">近7日话题热度变化</div>
          <div className="trend-bars">
            {[40, 55, 45, 60, 75, 90, 100].map((height, i) => (
              <div 
                key={i} 
                className={`trend-bar ${i === 6 ? 'active' : ''}`}
                style={{ height: `${height}%` }}
              >
                <span className="trend-bar-label">{['一','二','三','四','五','六','日'][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {topic.insights && topic.insights.length > 0 && (
        <div className="article-list">
          {topic.contents && topic.contents.length > 0 ? (
            topic.contents.slice(0, 4).map((content, i) => (
              <div 
                key={i} 
                className="article-item"
                onClick={() => handleArticleClick(content)}
                style={{ cursor: 'pointer' }}
              >
                <h3 className="article-title">{content.title}</h3>
                <div className="article-meta">
                  <span className="article-source">{content.source}</span>
                  <span className="article-arrow">→</span>
                </div>
              </div>
            ))
          ) : (
            topic.insights.slice(0, 4).map((insight, i) => (
              <div key={i} className="article-item">
                <h3 className="article-title">{insight}</h3>
                <div className="article-meta">
                  <span className="article-source">{topic.contents?.[i]?.source || 'AI整理'}</span>
                  <span className="article-arrow">→</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="domain-footer">
        <span 
          className="domain-more" 
          onClick={handleViewMore}
          style={{ cursor: 'pointer' }}
        >
          查看更多文章 →
        </span>
      </div>

      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'var(--font-serif-cn)',
          border: '2px solid var(--paper)',
          zIndex: 1000,
          animation: 'fadeInOut 1.5s ease',
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
