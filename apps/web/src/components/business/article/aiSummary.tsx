import { ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '../../ui';

export function ArticleAiSummaryCard({
  aiSummaryPoints,
  setShowAiSummary,
  showAiSummary,
}: {
  aiSummaryPoints: string[];
  setShowAiSummary: (updater: (prev: boolean) => boolean) => void;
  showAiSummary: boolean;
}) {
  if (aiSummaryPoints.length === 0) return null;

  return (
    <div className="article-ai-card">
      <span className="article-ai-frame" />
      <Button
        type="button"
        variant="unstyled"
        onClick={() => setShowAiSummary((prev) => !prev)}
        className="article-ai-toggle"
      >
        <span className="article-ai-label">AI 摘要</span>
        {showAiSummary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </Button>
      {showAiSummary ? (
        <div className="article-ai-list">
          {aiSummaryPoints.map((point) => (
            <p key={point} className="article-ai-point">
              {point}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
