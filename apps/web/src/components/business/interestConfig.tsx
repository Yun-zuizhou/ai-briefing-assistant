import { ArrowLeft, Briefcase, ChevronRight, Compass, Cpu, PenLine } from 'lucide-react';

import { Button } from '../ui';

interface InterestCategory {
  iconKey: 'technology' | 'writing' | 'career' | 'life';
  items: string[];
  name: string;
  purpose: string;
}

function InterestCategoryIcon({
  iconKey,
}: {
  iconKey: InterestCategory['iconKey'];
}) {
  const props = { size: 16, strokeWidth: 1.9, 'aria-hidden': true };
  if (iconKey === 'technology') return <Cpu {...props} />;
  if (iconKey === 'writing') return <PenLine {...props} />;
  if (iconKey === 'career') return <Briefcase {...props} />;
  return <Compass {...props} />;
}

export function InterestConfigBackButton({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <Button type="button" variant="unstyled" onClick={onBack} className="interest-config-nav-btn">
      <ArrowLeft size={22} className="interest-config-nav-icon" />
    </Button>
  );
}

export function InterestConfigCompleteButton({
  disabled,
  onComplete,
  saving,
  selectedCount,
}: {
  disabled: boolean;
  onComplete: () => void;
  saving: boolean;
  selectedCount: number;
}) {
  return (
    <Button
      type="button"
      variant="unstyled"
      onClick={onComplete}
      className={`interest-config-complete-btn${selectedCount > 0 ? ' is-enabled' : ''}`}
      disabled={disabled}
    >
      {saving ? '保存中' : '完成'}
    </Button>
  );
}

export function InterestConfigErrorCard({
  error,
}: {
  error: string | null;
}) {
  if (!error) return null;

  return (
    <div className="domain-card interest-config-error-card">
      <p className="interest-config-error-text">{error}</p>
    </div>
  );
}

export function InterestConfigHero({
  loading,
  selectedCount,
}: {
  loading: boolean;
  selectedCount: number;
}) {
  return (
    <section className="interest-config-hero">
      <p className="interest-config-hero-title">
        选择简报应该优先关注什么
      </p>
      <p className="interest-config-hero-desc">
        这些关注会影响简报摘要、关注领域报道和后续推荐，不是普通标签收藏。
      </p>
      <div className="interest-config-hero-ornament">
        <span className="interest-config-ornament-line" />
        <span className="interest-config-ornament-diamond" />
        <span className="interest-config-ornament-line" />
      </div>
      <div className="interest-config-count-row">
        <span className="interest-config-count-label">已选择</span>
        <span className={`interest-config-count-value${selectedCount > 0 ? ' is-active' : ''}`}>
          {loading ? '...' : selectedCount}
        </span>
        <span className="interest-config-count-label">个领域</span>
      </div>
      <p className="interest-config-hero-tip">
        建议先选 3-5 个；以后也可以在对话里确认新增或移除关注。
      </p>
    </section>
  );
}

export function InterestConfigCategoryList({
  categories,
  disabled,
  onToggle,
  selectedInterests,
}: {
  categories: InterestCategory[];
  disabled: boolean;
  onToggle: (interest: string) => void;
  selectedInterests: string[];
}) {
  return (
    <>
      {categories.map((category) => (
        <div key={category.name} className="domain-card interest-config-category-card">
          <div className="domain-header">
            <div className="domain-name">
              <span className="interest-config-category-icon">
                <InterestCategoryIcon iconKey={category.iconKey} />
              </span>
              {category.name}
            </div>
          </div>
          <div className="interest-config-category-body">
            <p className="interest-config-category-purpose">
              {category.purpose}
            </p>
            <div className="interest-config-interest-grid">
              {category.items.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <Button
                    key={interest}
                    type="button"
                    variant="unstyled"
                    onClick={() => onToggle(interest)}
                    disabled={disabled}
                    className={`interest-config-interest-chip${isSelected ? ' is-selected' : ''}`}
                  >
                    {interest}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function InterestConfigSubmitButton({
  disabled,
  onComplete,
  saving,
}: {
  disabled: boolean;
  onComplete: () => void;
  saving: boolean;
}) {
  return (
    <Button
      onClick={onComplete}
      variant="primary"
      className="interest-config-submit-btn"
      disabled={disabled}
    >
      {saving ? '保存中...' : <>开始使用 <ChevronRight size={20} /></>}
    </Button>
  );
}
