import { formatIntentLabel } from '../../utils/intentLabels';

export function MessageMeta({
  candidateIntents,
  sourceContext,
  matchedBy,
}: {
  candidateIntents?: string[];
  confidence?: number;
  sourceContext?: string;
  matchedBy?: string;
}) {
  const lines: string[] = [];

  if (candidateIntents && candidateIntents.length > 1) {
    const readable = candidateIntents.map((i) => formatIntentLabel(i));
    lines.push(`也可能理解为：${readable.join('、')}`);
  }
  if (sourceContext === 'article_action') {
    lines.push('这条消息来自你正在看的文章。');
  }
  if (matchedBy === 'reclassify') {
    lines.push('你手动调整了这条的处理方式。');
  }

  if (lines.length === 0) {
    return null;
  }

  return (
    <details className="chat-meta-details">
      <summary>为什么这样理解？</summary>
      <div className="chat-meta-details-body">
        {lines.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
    </details>
  );
}
