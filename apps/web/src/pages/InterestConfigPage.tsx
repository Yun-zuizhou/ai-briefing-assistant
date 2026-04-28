import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout, Masthead, PageContent, PageFooter } from '../components/layout';
import { Button } from '../components/ui';
import { apiService } from '../services/api';

const interestCategories = [
  {
    name: '科技前沿',
    icon: '🚀',
    items: ['AI前沿', '区块链', 'Web3', '元宇宙', '量子计算'],
  },
  {
    name: '职业发展',
    icon: '💼',
    items: ['求职机会', '职场技能', '面试经验', '薪资行情', '职业规划'],
  },
  {
    name: '学习成长',
    icon: '📚',
    items: ['编程学习', '产品思维', '设计灵感', '商业洞察', '心理学'],
  },
  {
    name: '生活品质',
    icon: '✨',
    items: ['健康养生', '理财投资', '旅行探索', '美食文化', '阅读写作'],
  },
];

export default function InterestConfigPage() {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getUserInterests();
        if (response.error) {
          throw new Error(response.error);
        }
        setSelectedInterests(response.data?.interests ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载关注失败');
      } finally {
        setLoading(false);
      }
    };

    void fetchInterests();
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      return [...prev, interest];
    });
  }, []);

  const handleComplete = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await apiService.updateUserInterests(selectedInterests);
      if (response.error) {
        throw new Error(response.error);
      }
      navigate('/today');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存关注失败');
    } finally {
      setSaving(false);
    }
  }, [navigate, selectedInterests]);

  return (
    <PageLayout variant="auth">
      <Masthead
        title="选择关注"
        subtitle="定制你的专属简报"
        ornaments={['✦ AI ✦', '✦ BRIEFING ✦']}
        leftButton={
          <Button type="button" variant="unstyled" onClick={() => navigate(-1)} className="interest-config-nav-btn">
            <ArrowLeft size={22} className="interest-config-nav-icon" />
          </Button>
        }
        rightButton={
          <Button
            type="button"
            variant="unstyled"
            onClick={() => void handleComplete()}
            className={`interest-config-complete-btn${selectedInterests.length > 0 ? ' is-enabled' : ''}`}
            disabled={saving}
          >
            {saving ? '保存中' : '完成'}
          </Button>
        }
      />

      <PageContent className="interest-config-page-content">
        {error ? (
          <div className="domain-card interest-config-error-card">
            <p className="interest-config-error-text">{error}</p>
          </div>
        ) : null}

        <section className="interest-config-hero">
          <p className="interest-config-hero-title">
            选择你感兴趣的领域
          </p>
          <p className="interest-config-hero-desc">
            AI 将根据你的选择，每天为你推送专属简报
          </p>
          <div className="interest-config-hero-ornament">
            <span className="interest-config-ornament-line" />
            <span className="interest-config-ornament-diamond" />
            <span className="interest-config-ornament-line" />
          </div>
          <div className="interest-config-count-row">
            <span className="interest-config-count-label">已选择</span>
            <span className={`interest-config-count-value${selectedInterests.length > 0 ? ' is-active' : ''}`}>
              {loading ? '...' : selectedInterests.length}
            </span>
            <span className="interest-config-count-label">个领域</span>
          </div>
          <p className="interest-config-hero-tip">
            建议：选择 3-5 个领域效果最佳
          </p>
        </section>

        {interestCategories.map((category) => (
          <div key={category.name} className="domain-card interest-config-category-card">
            <div className="domain-header">
              <div className="domain-name">
                <span className="interest-config-category-icon">{category.icon}</span>
                {category.name}
              </div>
            </div>
            <div className="interest-config-category-body">
              <div className="interest-config-interest-grid">
                {category.items.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <Button
                      key={interest}
                      type="button"
                      variant="unstyled"
                      onClick={() => toggleInterest(interest)}
                      disabled={loading || saving}
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
      </PageContent>

      <PageFooter className="interest-config-footer">
        <Button
          onClick={() => void handleComplete()}
          variant="primary"
          className="interest-config-submit-btn"
          disabled={selectedInterests.length === 0 || loading || saving}
        >
          {saving ? '保存中...' : <>开始使用 <ChevronRight size={20} /></>}
        </Button>
      </PageFooter>
    </PageLayout>
  );
}
