import { PaperButton } from '../decor';
import type { ComposeMode } from '../../hooks';

const MODE_LABELS: Record<ComposeMode, string> = {
  smart: '智能',
  create_todo: '待办',
  record_thought: '想法',
  fragmented_thought: '碎片',
  chat_only: '聊天',
};

export function ModeChips({
  mode,
  onChange,
  variants = ['smart', 'create_todo', 'record_thought'],
}: {
  mode: ComposeMode;
  onChange: (mode: ComposeMode) => void;
  variants?: readonly ComposeMode[];
}) {
  return (
    <>
      {variants.map((key) => (
        <PaperButton
          key={key}
          active={mode === key}
          onClick={() => onChange(key)}
        >
          {MODE_LABELS[key]}
        </PaperButton>
      ))}
    </>
  );
}
