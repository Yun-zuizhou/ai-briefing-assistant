import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useAppContext } from '../context/useAppContext';

type FilterType = 'all' | 'news' | 'paper' | 'job';

const typeIcons: Record<string, string> = {
  news: '📰',
  paper: '📚',
  job: '💼',
};

const filterLabels: Record<FilterType, string> = {
  all: '全部',
  news: '资讯',
  paper: '文献',
  job: '兼职',
};

export default function CollectionPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
  const { collectedItems, setCollectedItems } = useAppContext();

  const handleOpenArticle = useCallback((item: typeof collectedItems[0]) => {
    navigate('/article', {
      state: {
        article: {
          id: String(item.id),
          title: item.title,
          source: item.source,
          url: item.sourceUrl,
          summary: item.summary,
          category: item.category,
        }
      }
    });
  }, [navigate]);

  const filteredItems = useMemo(() => {
    return collectedItems.filter((item) => {
      const matchesFilter = filter === 'all' || item.type === filter;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [collectedItems, filter, searchQuery]);

  const handleDelete = useCallback(() => {
    if (deleteItemId) {
      setCollectedItems((prev) => prev.filter((item) => item.id !== deleteItemId));
    }
    setShowDeleteModal(false);
    setDeleteItemId(null);
  }, [deleteItemId, setCollectedItems]);

  const toggleTrackStep = useCallback((itemId: number, stepIndex: number) => {
    setCollectedItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId && item.trackProgress) {
          const newProgress = [...item.trackProgress];
          newProgress[stepIndex] = { ...newProgress[stepIndex], done: !newProgress[stepIndex].done };
          return { ...item, trackProgress: newProgress };
        }
        return item;
      })
    );
  }, [setCollectedItems]);

  const handleAddTracking = useCallback((itemId: number) => {
    setCollectedItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, tracking: true, trackProgress: [
          { step: '收藏机会', done: true, date: new Date().toLocaleDateString() },
          { step: '准备简历', done: false },
          { step: '投递申请', done: false },
          { step: '等待回复', done: false },
          { step: '面试/试稿', done: false },
        ]} : i
      )
    );
  }, [setCollectedItems]);

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="我的收藏" label="MY COLLECTIONS" />

      <PageContent style={{ padding: '16px' }}>
        <div className="newspaper-search" style={{ marginBottom: '16px' }}>
          <Search size={18} style={{ color: 'var(--ink-muted)' }} />
          <input
            type="text"
            placeholder="搜索收藏内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
        }}>
          {(Object.keys(filterLabels) as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1,
                padding: '10px',
                background: filter === f ? 'var(--ink)' : 'var(--paper-warm)',
                border: '2px solid var(--ink)',
                color: filter === f ? 'var(--paper)' : 'var(--ink)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-serif-cn)',
                position: 'relative',
              }}
            >
              <span style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                right: '2px',
                bottom: '2px',
                border: filter === f ? '1px solid var(--paper)' : '1px solid var(--ink)',
                pointerEvents: 'none',
              }} />
              {filterLabels[f]}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--ink-muted)',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: '2px solid var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                right: '4px',
                bottom: '4px',
                border: '1px solid var(--ink)',
                pointerEvents: 'none',
              }} />
              <span style={{ fontSize: '32px' }}>📚</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
              暂无收藏内容
            </p>
            <p style={{ fontSize: '13px' }}>
              在首页推送中点击收藏按钮即可添加
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="collection-card" style={{ marginBottom: '12px' }}>
              <div className="collection-card-content">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px',
                }}>
                  <span style={{ fontSize: '20px' }}>{typeIcons[item.type]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}>
                      <span style={{
                        padding: '2px 6px',
                        background: 'var(--ink)',
                        color: 'var(--paper)',
                        fontSize: '9px',
                        fontWeight: 600,
                      }}>
                        {item.category}
                      </span>
                      {item.tracking && (
                        <span style={{
                          padding: '2px 6px',
                          background: 'var(--accent)',
                          color: 'var(--paper)',
                          fontSize: '9px',
                          fontWeight: 600,
                        }}>
                          追踪中
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                      {item.title}
                    </h4>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.6, margin: 0 }}>
                  {item.summary}
                </p>

                {item.tracking && item.trackProgress && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      onClick={() => setExpandedTrack(expandedTrack === item.id ? null : item.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'var(--paper-warm)',
                        border: '2px solid var(--ink)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-serif-cn)',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📋 进度追踪
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.deadline && (
                          <span style={{ fontSize: '11px', color: 'var(--gold)' }}>截止: {item.deadline}</span>
                        )}
                        {expandedTrack === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>
                    
                    {expandedTrack === item.id && (
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {item.trackProgress.map((step, index) => (
                          <button
                            key={index}
                            onClick={() => toggleTrackStep(item.id, index)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              background: step.done ? 'var(--paper-warm)' : 'var(--paper)',
                              border: `1px solid ${step.done ? 'var(--accent)' : 'var(--border)'}`,
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontFamily: 'var(--font-serif-cn)',
                            }}
                          >
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid var(--ink)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: step.done ? 'var(--ink)' : 'var(--paper)',
                              color: 'var(--paper)',
                              fontSize: '10px',
                            }}>
                              {step.done && '✓'}
                            </div>
                            <span style={{ fontSize: '12px', color: step.done ? 'var(--accent)' : 'var(--ink)', fontWeight: step.done ? 600 : 400 }}>
                              {step.step}
                            </span>
                            {step.date && (
                              <span style={{ fontSize: '10px', color: 'var(--ink-muted)', marginLeft: 'auto' }}>
                                {step.date}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px dashed var(--border)',
                }}>
                  <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>
                    来源: {item.source} · {item.collectedAt}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {item.type === 'job' && !item.tracking && (
                      <button
                        onClick={() => handleAddTracking(item.id)}
                        style={{
                          padding: '4px 10px',
                          background: 'var(--ink)',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: 'var(--paper)',
                          fontFamily: 'var(--font-serif-cn)',
                        }}
                      >
                        加入追踪
                      </button>
                    )}
                    <button 
                      onClick={() => handleOpenArticle(item)}
                      style={{
                      padding: '3px 8px',
                      background: 'var(--paper-warm)',
                      border: '1px solid var(--ink)',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-serif-cn)',
                      color: 'var(--ink)',
                    }}>
                      原文
                    </button>
                    <button
                      onClick={() => {
                        setDeleteItemId(item.id);
                        setShowDeleteModal(true);
                      }}
                      style={{
                        padding: '3px 8px',
                        background: 'var(--paper-warm)',
                        border: '1px solid var(--accent)',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'var(--accent)',
                        fontFamily: 'var(--font-serif-cn)',
                      }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </PageContent>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="确定要删除这条收藏吗？"
        confirmLabel="删除"
        cancelLabel="取消"
        confirmStyle="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </PageLayout>
  );
}
