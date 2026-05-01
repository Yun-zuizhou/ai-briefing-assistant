import { Bookmark, MessageSquare, Share2 } from 'lucide-react';

import { Button } from '../../ui';
import type { ArticleFontSize } from '../../../types/article';

export function ArticleActionRow({
  isCollected,
  onAsk,
  onCollect,
  onShare,
}: {
  isCollected: boolean;
  onAsk: () => void;
  onCollect: () => void;
  onShare: () => void;
}) {
  return (
    <div className="article-actions-row">
      <Button onClick={onCollect} variant="secondary" className="article-action-btn">
        <Bookmark size={16} fill={isCollected ? 'currentColor' : 'none'} />
        {isCollected ? '已收藏' : '收藏'}
      </Button>
      <Button onClick={onShare} variant="secondary" className="article-action-btn">
        <Share2 size={16} />
        分享
      </Button>
      <Button onClick={onAsk} variant="secondary" className="article-action-btn">
        <MessageSquare size={16} />
        追问
      </Button>
    </div>
  );
}

export function ArticleFontControls({
  fontSize,
  onFontSizeChange,
}: {
  fontSize: ArticleFontSize;
  onFontSizeChange: (size: ArticleFontSize) => void;
}) {
  return (
    <div className="article-font-controls">
      {(['small', 'medium', 'large'] as const).map((size) => (
        <Button
          key={size}
          onClick={() => onFontSizeChange(size)}
          variant="secondary"
          className={`article-font-btn ${fontSize === size ? 'is-active' : ''}`}
        >
          {size === 'small' ? '小字' : size === 'medium' ? '中字' : '大字'}
        </Button>
      ))}
    </div>
  );
}
