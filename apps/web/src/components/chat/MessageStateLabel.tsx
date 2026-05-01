import type { ChatMessageState } from '../../types/page-data';
import { ChatStatusPill as StatusPill } from '../business';
import { formatIntentLabel } from '../../utils/intentLabels';

export function MessageStateLabel({
  messageState,
  confirmedType,
}: {
  messageState?: ChatMessageState;
  confirmedType?: string;
}) {
  if (!messageState) return null;

  let text = '';
  let tone: 'neutral' | 'pending' | 'success' | 'error' = 'neutral';

  if (messageState === 'sending') {
    text = '发送中...';
  } else if (messageState === 'recognized') {
    text = '已发送';
  } else if (messageState === 'pending_confirmation') {
    text = '待确认';
    tone = 'pending';
  } else if (messageState === 'confirmation') {
    text = confirmedType ? `已确认 ${formatIntentLabel(confirmedType)}` : '已确认';
  } else if (messageState === 'executed') {
    text = confirmedType ? `已执行 ${formatIntentLabel(confirmedType)}` : '已执行';
    tone = 'success';
  } else if (messageState === 'error') {
    text = '处理出错';
    tone = 'error';
  }

  return <StatusPill text={text} tone={tone} />;
}
