import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageLayout, Masthead, PageContent, PageFooter } from '../components/layout';
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
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <ArrowLeft size={22} style={{ color: 'var(--ink)' }} />
          </button>
        }
        rightButton={
          <button
            onClick={() => void handleComplete()}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 12px',
              fontSize: '13px',
              color: selectedInterests.length > 0 ? 'var(--accent)' : 'var(--ink-muted)',
              fontWeight: 600,
              fontFamily: 'var(--font-sans-cn)',
            }}
            disabled={saving}
          >
            {saving ? '保存中' : '完成'}
          </button>
        }
      />

      <PageContent style={{ padding: '16px' }}>
        {error ? (
          <div className="domain-card" style={{ marginBottom: '16px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--accent)', margin: 0 }}>{error}</p>
          </div>
        ) : null}

        <div style={{
          textAlign: 'center',
          padding: '24px 16px',
          marginBottom: '20px',
          background: 'linear-gradient(180deg, var(--paper-warm) 0%, var(--paper) 100%)',
          borderRadius: '0',
          border: '2px solid var(--ink)',
          boxShadow: '3px 3px 0 var(--paper-dark)',
        }}>
          <p style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--ink)',
            fontFamily: 'var(--font-serif-cn)',
            marginBottom: '12px',
            lineHeight: 1.6,
          }}>
            选择你感兴趣的领域
          </p>
          <p style={{
            fontSize: '14px',
            color: 'var(--ink-muted)',
            lineHeight: 1.7,
            margin: 0,
          }}>
            AI 将根据你的选择，每天为你推送专属简报
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '16px',
          }}>
            <div style={{ width: '30px', height: '1px', background: 'var(--gold)' }} />
            <div style={{
              width: '8px',
              height: '8px',
              background: 'var(--gold)',
              transform: 'rotate(45deg)',
            }} />
            <div style={{ width: '30px', height: '1px', background: 'var(--gold)' }} />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '16px',
          }}>
            <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>已选择</span>
            <span style={{
              fontSize: '24px',
              fontWeight: 900,
              color: selectedInterests.length > 0 ? 'var(--accent)' : 'var(--ink-muted)',
              fontFamily: 'var(--font-serif-cn)',
            }}>
              {loading ? '...' : selectedInterests.length}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>个领域</span>
          </div>
          <p style={{
            fontSize: '12px',
            color: 'var(--gold)',
            marginTop: '8px',
          }}>
            建议：选择 3-5 个领域效果最佳
          </p>
        </div>

        {interestCategories.map((category) => (
          <div key={category.name} className="domain-card" style={{ marginBottom: '12px' }}>
            <div className="domain-header">
              <div className="domain-name">
                <span style={{ marginRight: '6px' }}>{category.icon}</span>
                {category.name}
              </div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {category.items.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      disabled={loading || saving}
                      style={{
                        padding: '8px 14px',
                        background: isSelected ? 'var(--ink)' : 'var(--paper-warm)',
                        border: '1px solid var(--ink)',
                        color: isSelected ? 'var(--paper)' : 'var(--ink)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-sans-cn)',
                        transition: 'all 0.15s ease',
                        borderRadius: '2px',
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </PageContent>

      <PageFooter>
        <button
          onClick={() => void handleComplete()}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '16px' }}
          disabled={selectedInterests.length === 0 || loading || saving}
        >
          {saving ? '保存中...' : <>开始使用 <ChevronRight size={20} /></>}
        </button>
      </PageFooter>
    </PageLayout>
  );
}
