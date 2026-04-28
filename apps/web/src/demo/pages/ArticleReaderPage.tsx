import { useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Share2, ExternalLink, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { PageLayout, PageContent } from '../../components/layout';
import { Button } from '../../components/ui';
import { useDemoAppContext } from '../context/useDemoAppContext';

interface ArticleData {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  category: string;
}

const mockArticleContent = `
随着人工智能技术的飞速发展，大语言模型已经成为了科技领域最热门的话题之一。从GPT系列到Claude，再到国内的文心一言、通义千问，各大科技公司都在积极布局这一领域。

## 技术突破

最新的研究表明，通过增加模型参数和训练数据，大语言模型展现出了惊人的能力。它们不仅能够进行流畅的对话，还能完成代码编写、文章创作、数据分析等复杂任务。

### 多模态能力

新一代模型开始支持多模态输入，能够理解图像、音频等多种形式的信息。这使得AI助手的应用场景更加广泛，从简单的文字对话扩展到了图像理解、视频分析等领域。

## 行业影响

AI技术的进步正在深刻改变各个行业：

- **教育领域**：个性化学习助手帮助学生更高效地学习
- **医疗健康**：AI辅助诊断提高了医疗效率
- **内容创作**：自动化工具降低了创作门槛
- **软件开发**：代码生成工具提升了开发效率

## 未来展望

专家预测，未来几年AI技术将继续快速发展。更强大的模型、更智能的Agent、更广泛的应用场景，都将推动AI成为人类最重要的工具之一。

然而，我们也需要关注AI发展带来的挑战，包括伦理问题、就业影响、数据安全等。只有在技术进步和社会责任之间找到平衡，AI才能真正造福人类。
`;

const aiSummary = [
  '大语言模型技术持续突破，多模态能力成为新趋势',
  'AI正在深刻改变教育、医疗、内容创作等多个行业',
  '未来发展需要在技术进步与社会责任之间寻求平衡',
];

const relatedArticles = [
  { id: '2', title: 'GPT-5技术预览版发布：多模态能力大幅提升', source: 'OpenAI Blog' },
  { id: '3', title: 'AI Agent：下一代人工智能的关键技术', source: 'MIT Tech Review' },
  { id: '4', title: '如何有效使用大语言模型提升工作效率', source: '效率周刊' },
];

export default function ArticleReaderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { collectedItems, setCollectedItems } = useDemoAppContext();
  
  const article = (location.state as { article?: ArticleData })?.article;
  
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showAiSummary, setShowAiSummary] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  
  const isCollected = useMemo(() => {
    if (!article) return false;
    return collectedItems.some(item => item.title === article.title);
  }, [collectedItems, article]);

  const handleCollect = useCallback(() => {
    if (!article) return;
    
    if (isCollected) {
      setCollectedItems(prev => prev.filter(item => item.title !== article.title));
      setToastMessage('已取消收藏');
    } else {
      const newItem = {
        id: Date.now(),
        type: 'article',
        category: article.category,
        title: article.title,
        summary: article.summary,
        source: article.source,
        sourceUrl: article.url,
        collectedAt: new Date().toLocaleDateString('zh-CN'),
        tracking: false,
      };
      setCollectedItems(prev => [newItem, ...prev]);
      setToastMessage('已收藏');
    }
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  }, [isCollected, article, setCollectedItems]);

  const handleShare = useCallback(() => {
    if (navigator.share && article) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage('链接已复制');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    }
  }, [article]);

  const handleOpenOriginal = useCallback(() => {
    if (article?.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  }, [article]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const progress = Math.min((scrollTop / scrollHeight) * 100, 100);
    setReadingProgress(Math.round(progress));
  }, []);

  const handleRelatedClick = useCallback((id: string) => {
    navigate('/article', { 
      state: { 
        article: {
          id,
          title: relatedArticles.find(a => a.id === id)?.title || '',
          source: relatedArticles.find(a => a.id === id)?.source || '',
          url: `https://example.com/article/${id}`,
          summary: '这是一篇相关的文章...',
          category: article?.category || 'AI',
        }
      }
    });
  }, [navigate, article?.category]);

  const fontSizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px',
  };

  if (!article) {
    return (
      <PageLayout variant="secondary">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-muted)' }}>文章不存在</p>
          <Button onClick={() => navigate(-1)} variant="secondary" style={{ marginTop: '16px' }}>
            返回
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="secondary">
      <header style={{
        position: 'sticky',
        top: 0,
        background: 'var(--paper)',
        borderBottom: '2px solid var(--ink)',
        zIndex: 100,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink)',
              fontSize: '14px',
              fontFamily: 'var(--font-serif-cn)',
            }}
          >
            <ArrowLeft size={18} />
            返回
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCollect}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                background: isCollected ? 'var(--gold)' : 'var(--paper-warm)',
                border: '1px solid var(--ink)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'var(--font-serif-cn)',
                color: isCollected ? 'var(--paper)' : 'var(--ink)',
              }}
            >
              <Bookmark size={14} fill={isCollected ? 'currentColor' : 'none'} />
              {isCollected ? '已收藏' : '收藏'}
            </button>
            <button
              onClick={handleShare}
              style={{
                padding: '6px 10px',
                background: 'var(--paper-warm)',
                border: '1px solid var(--ink)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'var(--font-serif-cn)',
                color: 'var(--ink)',
              }}
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
        
        <div style={{
          height: '3px',
          background: 'var(--paper-warm)',
        }}>
          <div style={{
            height: '100%',
            width: `${readingProgress}%`,
            background: 'var(--accent)',
            transition: 'width 0.1s',
          }} />
        </div>
      </header>

      <PageContent onScroll={handleScroll} style={{ paddingBottom: '100px' }}>
        <article style={{ padding: '20px 16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '12px',
          }}>
            <span style={{
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: 'var(--ink-muted)',
            }}>
              ✦ ARTICLE ✦
            </span>
            <span style={{
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: 'var(--ink-muted)',
            }}>
              ✦ {article.category.toUpperCase()} ✦
            </span>
          </div>

          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--ink)',
            lineHeight: 1.4,
            marginBottom: '16px',
            fontFamily: 'var(--font-serif-cn)',
            textAlign: 'center',
          }}>
            {article.title}
          </h1>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px dashed var(--border)',
          }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'var(--ink-muted)',
            }}>
              <User size={12} />
              {article.source}
            </span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'var(--ink-muted)',
            }}>
              <Clock size={12} />
              {new Date().toLocaleDateString('zh-CN')}
            </span>
          </div>

          <div style={{
            padding: '12px',
            background: 'var(--paper-warm)',
            border: '1px solid var(--border)',
            marginBottom: '24px',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute',
              inset: '4px',
              border: '1px dashed var(--border)',
              pointerEvents: 'none',
            }} />
            <p style={{
              fontSize: '14px',
              color: 'var(--ink)',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}>
              {article.summary}
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px',
          }}>
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                style={{
                  padding: '4px 12px',
                  background: fontSize === size ? 'var(--ink)' : 'var(--paper-warm)',
                  border: '1px solid var(--ink)',
                  color: fontSize === size ? 'var(--paper)' : 'var(--ink)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-serif-cn)',
                }}
              >
                {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
              </button>
            ))}
          </div>

          <div style={{
            fontSize: fontSizeMap[fontSize],
            color: 'var(--ink)',
            lineHeight: 1.8,
            fontFamily: 'var(--font-serif-cn)',
          }}>
            {mockArticleContent.split('\n').map((paragraph, i) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={i} style={{
                    fontSize: '1.3em',
                    fontWeight: 700,
                    marginTop: '24px',
                    marginBottom: '12px',
                    color: 'var(--ink)',
                  }}>
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={i} style={{
                    fontSize: '1.15em',
                    fontWeight: 600,
                    marginTop: '16px',
                    marginBottom: '8px',
                    color: 'var(--ink)',
                  }}>
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('- **')) {
                const text = paragraph.replace('- **', '').replace('**', ': ');
                return (
                  <p key={i} style={{ marginBottom: '8px', paddingLeft: '16px' }}>
                    • <strong>{text.split(':')[0]}</strong>{text.split(':').slice(1).join(':')}
                  </p>
                );
              }
              if (paragraph.trim()) {
                return <p key={i} style={{ marginBottom: '16px' }}>{paragraph}</p>;
              }
              return null;
            })}
          </div>

          <div style={{
            marginTop: '32px',
            padding: '16px',
            background: 'var(--paper-warm)',
            border: '2px solid var(--ink)',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute',
              inset: '4px',
              border: '1px solid var(--ink)',
              pointerEvents: 'none',
            }} />
            
            <button
              onClick={() => setShowAiSummary(!showAiSummary)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginBottom: showAiSummary ? '12px' : 0,
              }}
            >
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--accent)',
                fontFamily: 'var(--font-serif-cn)',
              }}>
                🤖 AI 摘要
              </span>
              {showAiSummary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            {showAiSummary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {aiSummary.map((point, i) => (
                  <p key={i} style={{
                    fontSize: '13px',
                    color: 'var(--ink)',
                    lineHeight: 1.6,
                    paddingLeft: '12px',
                    borderLeft: '2px solid var(--accent)',
                  }}>
                    {point}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div style={{
            marginTop: '24px',
            display: 'flex',
            gap: '8px',
          }}>
            <button
              onClick={handleOpenOriginal}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                background: 'var(--paper-warm)',
                border: '2px solid var(--ink)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'var(--font-serif-cn)',
                color: 'var(--ink)',
              }}
            >
              <ExternalLink size={16} />
              查看原文
            </button>
            <button
              onClick={handleCollect}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                background: isCollected ? 'var(--gold)' : 'var(--ink)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'var(--font-serif-cn)',
                color: 'var(--paper)',
              }}
            >
              <Bookmark size={16} fill="currentColor" />
              {isCollected ? '已收藏' : '收藏文章'}
            </button>
          </div>

          <section style={{ marginTop: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--ink)',
                fontFamily: 'var(--font-serif-cn)',
              }}>
                相关推荐
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {relatedArticles.map((related) => (
                <div
                  key={related.id}
                  onClick={() => handleRelatedClick(related.id)}
                  style={{
                    padding: '12px',
                    background: 'var(--paper-warm)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    inset: '3px',
                    border: '1px solid var(--border)',
                    pointerEvents: 'none',
                  }} />
                  <p style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    marginBottom: '4px',
                    fontFamily: 'var(--font-serif-cn)',
                  }}>
                    {related.title}
                  </p>
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--ink-muted)',
                  }}>
                    {related.source}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </article>
      </PageContent>

      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'var(--font-serif-cn)',
          border: '2px solid var(--paper)',
          zIndex: 1000,
        }}>
          {toastMessage}
        </div>
      )}
    </PageLayout>
  );
}
