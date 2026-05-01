import { Button } from '../../ui';

export function ArticleEmptyState({
  loadingDetail,
  onBackToToday,
}: {
  loadingDetail: boolean;
  onBackToToday: () => void;
}) {
  return (
    <div className="article-empty-state">
      <p className="article-empty-text">
        {loadingDetail ? '正在加载详情…' : '文章不存在或暂时无法打开。'}
      </p>
      <Button onClick={onBackToToday} variant="primary" className="article-empty-btn">
        返回今日页
      </Button>
    </div>
  );
}

export function ArticleProgressBar({ readingProgress }: { readingProgress: number }) {
  return (
    <div className="article-progress-track">
      <progress className="article-progress-fill" value={readingProgress} max={100} aria-label="阅读进度" />
    </div>
  );
}

export function ArticleToast({
  message,
  visible,
}: {
  message: string;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="article-toast">
      {message}
    </div>
  );
}
