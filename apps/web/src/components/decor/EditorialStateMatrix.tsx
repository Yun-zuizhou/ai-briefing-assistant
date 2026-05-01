import { BookishCheckbox } from './BookishCheckbox';
import { BookishChip } from './BookishChip';
import { BookishRadio } from './BookishRadio';
import { BookishToggle } from './BookishToggle';
import { EditorialIcon } from './EditorialIcon';
import { PaperButton } from './PaperButton';
import { StatusBadge } from './StatusBadge';

export function EditorialStateMatrix({ className = '' }: { className?: string }) {
  return (
    <div className={`editorial-state-matrix ${className}`.trim()}>
      <section className="editorial-state-section">
        <h3>正式候选</h3>

        <div className="editorial-state-row">
          <span className="editorial-state-label">Button</span>
          <div className="editorial-state-cases">
            <PaperButton>默认</PaperButton>
            <PaperButton active>主操作</PaperButton>
            <PaperButton muted>禁用</PaperButton>
          </div>
        </div>

        <div className="editorial-state-row">
          <span className="editorial-state-label">Status</span>
          <div className="editorial-state-cases">
            <StatusBadge label="待处理" tone="pending" />
            <StatusBadge label="已完成" tone="success" />
            <StatusBadge label="进行中" tone="neutral" />
          </div>
        </div>

        <div className="editorial-state-row">
          <span className="editorial-state-label">Action</span>
          <div className="editorial-state-cases editorial-state-icons">
            <span><EditorialIcon name="search" size={20} />搜索</span>
            <span><EditorialIcon name="send" size={20} />发送</span>
            <span><EditorialIcon name="archive" size={20} />归档</span>
          </div>
        </div>
      </section>

      <section className="editorial-state-section editorial-state-section--exploration">
        <h3>探索附录</h3>

        <div className="editorial-state-row">
          <span className="editorial-state-label">Chip</span>
          <div className="editorial-state-cases">
            <BookishChip label="默认" />
            <BookishChip label="选中" active />
          </div>
        </div>

        <div className="editorial-state-row">
          <span className="editorial-state-label">Choice</span>
          <div className="editorial-state-cases">
            <BookishCheckbox label="未选" checked={false} />
            <BookishCheckbox label="已选" checked />
            <BookishRadio label="未选" checked={false} />
            <BookishRadio label="已选" checked />
          </div>
        </div>

        <div className="editorial-state-row">
          <span className="editorial-state-label">Switch</span>
          <div className="editorial-state-cases">
            <BookishToggle active={false} />
            <BookishToggle active />
          </div>
        </div>
      </section>
    </div>
  );
}
