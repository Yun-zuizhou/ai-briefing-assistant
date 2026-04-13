import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { useAppContext } from '../context/useAppContext';
import { apiService } from '../services/api';
import type { PeriodicReportData } from '../types/page-data';
import { downloadFile } from '../utils/exportUtils';

const fallbackReport: PeriodicReportData = {
  reportType: 'monthly',
  overview: {
    period: '本月',
    viewed: 0,
    recorded: 0,
    collected: 0,
    completed: 0,
    streak: 0,
  },
  topicTrends: [],
  growth: {
    stats: {
      viewed: 0,
      recorded: 0,
      collected: 0,
      completed: 0,
    },
    comparison: {
      current: [0, 0, 0, 0],
      previous: [0, 0, 0, 0],
      change: [0, 0, 0, 0],
    },
    trajectory: {
      title: '月度沉淀仍在建立中',
      description: '你的真实记录仍在积累中，继续记录、收藏和行动，月度判断会更稳定。',
      keywords: ['记录', '行动', '回顾'],
    },
    selectedThoughts: [],
    suggestions: [
      '继续积累带标签的记录，让月度画像更稳定。',
      '优先把已收藏内容转成可执行动作，避免信息堆积。',
    ],
  },
};

function buildMonthlyMarkdown(report: PeriodicReportData): string {
  const { overview, topicTrends, growth } = report;
  let markdown = `# 简报助手 · 月报\n\n`;
  markdown += `**周期**: ${overview.period}\n\n`;
  markdown += `## 本月概览\n\n`;
  markdown += `- 关注：${overview.viewed}\n`;
  markdown += `- 记录：${overview.recorded}\n`;
  markdown += `- 收藏：${overview.collected}\n`;
  markdown += `- 完成：${overview.completed}\n`;
  markdown += `- 连续打卡：${overview.streak} 天\n\n`;

  if (topicTrends.length > 0) {
    markdown += `## 月度趋势\n\n`;
    topicTrends.forEach((trend) => {
      markdown += `### ${trend.icon} ${trend.title}\n`;
      markdown += `- 热度变化：${trend.heatData.change > 0 ? '↑' : trend.heatData.change < 0 ? '↓' : '→'}${Math.abs(trend.heatData.change)}%\n`;
      markdown += `- 月度热点：${trend.hotSpot.title}\n`;
      markdown += `- 洞察：${trend.insights.join('；')}\n\n`;
    });
  }

  markdown += `## 月度回顾\n\n`;
  markdown += `${growth.trajectory.description}\n\n`;

  if (growth.selectedThoughts.length > 0) {
    markdown += `### 月度想法精选\n\n`;
    growth.selectedThoughts.forEach((thought) => {
      markdown += `- ${thought.date}：${thought.content}\n`;
    });
    markdown += `\n`;
  }

  markdown += `### 下月建议\n\n`;
  growth.suggestions.forEach((suggestion) => {
    markdown += `- ${suggestion}\n`;
  });

  return markdown;
}

export default function MonthlyReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenChatPanel } = useAppContext();
  const [reportData, setReportData] = useState<PeriodicReportData>(fallbackReport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'html' | 'text'>('markdown');
  const reportId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('reportId');
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [location.search]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getMonthlyReport(reportId);
        setReportData(response.data ?? fallbackReport);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载月报失败');
        setReportData(fallbackReport);
      } finally {
        setLoading(false);
      }
    };

    void fetchReport();
  }, [reportId]);

  const { overview, topicTrends, growth } = reportData;
  const exportContent = useMemo(() => buildMonthlyMarkdown(reportData), [reportData]);

  const handleOpenHotspotDetail = (contentRef?: string) => {
    if (!contentRef) {
      return;
    }
    navigate(`/article?ref=${encodeURIComponent(contentRef)}`);
  };

  const handleExport = useCallback(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    if (exportFormat === 'html') {
      downloadFile(`<pre>${exportContent}</pre>`, `月报_${dateStr}.html`, 'text/html');
    } else {
      downloadFile(exportContent, `月报_${dateStr}.${exportFormat === 'text' ? 'txt' : 'md'}`, exportFormat === 'text' ? 'text/plain' : 'text/markdown');
    }
    setShowExportModal(false);
  }, [exportContent, exportFormat]);

  const handleShare = useCallback((method: 'link' | 'wechat' | 'weibo') => {
    if (method === 'link') {
      void navigator.clipboard.writeText(exportContent);
    } else if (method === 'wechat') {
      void navigator.clipboard.writeText(exportContent);
    } else {
      window.open(`https://service.weibo.com/share/share.php?title=${encodeURIComponent(exportContent.slice(0, 300))}`, '_blank');
    }
    setShowShareModal(false);
  }, [exportContent]);

  return (
    <PageLayout variant="report">
      <SecondaryHeader title="月 报" label="MONTHLY REPORT" subtitle="月度回顾" />

      <PageContent style={{ padding: '16px' }}>
        {error ? (
          <div className="domain-card" style={{ marginBottom: '16px', padding: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '6px' }}>{error}</p>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>当前会保留最小月报结构，但正式详情页入口仍可继续使用。</p>
          </div>
        ) : null}

        <section className="report-section">
          <div className="section-header" style={{ background: 'var(--gold)' }}>
            📈 本月概览
          </div>
          <div className="section-content">
            <div className="overview-stats">
              <div className="overview-stat">
                <div className="overview-value">{overview.viewed}</div>
                <div className="overview-label">关注</div>
              </div>
              <div className="overview-stat">
                <div className="overview-value" style={{ color: 'var(--ink)' }}>{overview.recorded}</div>
                <div className="overview-label">记录</div>
              </div>
              <div className="overview-stat">
                <div className="overview-value" style={{ color: 'var(--accent)' }}>{overview.collected}</div>
                <div className="overview-label">收藏</div>
              </div>
              <div className="overview-stat">
                <div className="overview-value" style={{ color: 'var(--gold)' }}>{overview.completed}</div>
                <div className="overview-label">完成</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <div className="streak-badge">
                🔥 连续打卡 {overview.streak} 天
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="domain-card" style={{ marginTop: '16px', padding: '14px' }}>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>月报加载中...</p>
          </div>
        ) : topicTrends.map((trend) => (
          <section key={trend.id} className="report-section" style={{ marginTop: '16px' }}>
            <div className="section-header" style={{ background: trend.heatData.trend === 'up' ? 'var(--accent)' : 'var(--ink)' }}>
              {trend.icon} {trend.title} · 月度趋势
            </div>
            <div className="section-content">
              <div className="trend-heat">
                <div className="heat-label">📊 月度热度趋势</div>
                <div className="heat-chart">
                  {[0.55, 0.7, 0.82, Math.max(0.4, trend.heatData.current / 100)].map((height, index) => (
                    <div key={index} className="heat-chart-bar" style={{ height: `${height * 100}%` }}>
                      <span className="heat-chart-label">第{index + 1}周</span>
                    </div>
                  ))}
                </div>
                <div className="heat-info">
                  <span>{trend.hotSpot.title}</span>
                  <span style={{ color: trend.heatData.trend === 'up' ? 'var(--accent)' : 'var(--gold)' }}>
                    {trend.heatData.change > 0 ? '↑' : trend.heatData.change < 0 ? '↓' : '→'}{Math.abs(trend.heatData.change)}%
                  </span>
                </div>
              </div>

              <div className="trend-hotspot">
                <div className="hotspot-label">🔥 月度热点</div>
                <div className="hotspot-title">{trend.hotSpot.title}</div>
                {trend.hotSpot.contentRef ? (
                  <button
                    className="trend-action-btn"
                    style={{ marginTop: '8px' }}
                    onClick={() => handleOpenHotspotDetail(trend.hotSpot.contentRef)}
                  >
                    查看热点详情
                  </button>
                ) : null}
                <div className="hotspot-meta">
                  讨论量：{trend.hotSpot.discussionCount}条 | 你的参与：{trend.hotSpot.userParticipation}条
                </div>
                <p className="hotspot-summary">{trend.hotSpot.summary}</p>
              </div>

              <div className="trend-insights">
                <div className="insights-label">💡 月度洞察</div>
                <ul className="insights-list">
                  {trend.insights.map((insight, i) => (
                    <li key={i}>• {insight}</li>
                  ))}
                </ul>
              </div>

              {trend.userAttentionChange && (
                <div className="attention-change">
                  <div className="attention-label">📈 你的关注变化</div>
                  <p className="attention-text">
                    本月你对{trend.title}的关注度提升了 <strong>{trend.userAttentionChange.change}%</strong>
                  </p>
                  {trend.userAttentionChange.newTopics.length > 0 ? (
                    <p className="attention-new">
                      新增关注主题：{trend.userAttentionChange.newTopics.join('、')}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="trend-actions">
                <button className="trend-action-btn">📊 查看详细数据</button>
                <button className="trend-action-btn" onClick={() => setOpenChatPanel(true)}>💬 记录月度感悟</button>
              </div>
            </div>
          </section>
        ))}

        <section className="report-section" style={{ marginTop: '16px' }}>
          <div className="section-header" style={{ background: 'var(--ink)' }}>
            📖 我的成长 · 月度回顾
          </div>
          <div className="section-content">
            {growth.comparison ? (
              <div className="growth-comparison">
                <div className="comparison-label">📊 月度数据对比</div>
                <div className="comparison-table">
                  <div className="comparison-row comparison-header">
                    <span></span>
                    <span>本月</span>
                    <span>上月</span>
                    <span>变化</span>
                  </div>
                  {[
                    { label: '关注', index: 0 },
                    { label: '记录', index: 1 },
                    { label: '收藏', index: 2 },
                    { label: '完成', index: 3 },
                  ].map((item) => (
                    <div key={item.label} className="comparison-row">
                      <span>{item.label}</span>
                      <span>{growth.comparison?.current[item.index] ?? 0}</span>
                      <span>{growth.comparison?.previous[item.index] ?? 0}</span>
                      <span style={{ color: 'var(--accent)' }}>
                        {(growth.comparison?.change[item.index] ?? 0) >= 0 ? '↑' : '↓'}{Math.abs(growth.comparison?.change[item.index] ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="growth-trajectory">
              <div className="trajectory-label">🎯 成长轨迹</div>
              <div className="trajectory-title">{growth.trajectory.title}</div>
              <p className="trajectory-description">{growth.trajectory.description}</p>
              <div className="trajectory-keywords">
                {growth.trajectory.keywords.map((keyword, i) => (
                  <span key={i} className="trajectory-keyword">{keyword}</span>
                ))}
              </div>
            </div>

            <div className="growth-thoughts">
              <div className="thoughts-label">💭 月度想法精选</div>
              {growth.selectedThoughts.length > 0 ? growth.selectedThoughts.map((thought) => (
                <div key={thought.id} className="thought-item">
                  <span className="thought-date">{thought.date}</span>
                  <span className="thought-content">"{thought.content}"</span>
                </div>
              )) : (
                <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>当前还没有足够的月度想法可展示。</p>
              )}
            </div>

            <div className="growth-suggestions">
              <div className="suggestions-label">🎯 下月建议</div>
              <ul className="suggestions-list">
                {growth.suggestions.map((suggestion, i) => (
                  <li key={i}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="report-actions">
          <button className="report-action-btn" onClick={() => setShowExportModal(true)}>
            <Download size={16} style={{ marginRight: '6px' }} />
            导出月报
          </button>
          <button className="report-action-btn" onClick={() => setShowShareModal(true)}>
            <Share2 size={16} style={{ marginRight: '6px' }} />
            分享月报
          </button>
        </div>

      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: '430px', background: 'var(--paper)', border: '2px solid var(--ink)', padding: '20px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '3px', left: '3px', right: '3px', bottom: '3px', border: '1px solid var(--ink)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-cn)' }}>📤 导出月报</h3>
              <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} style={{ color: 'var(--ink)' }} />
              </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '8px' }}>导出格式</p>
              {[
                { id: 'markdown' as const, label: 'Markdown', desc: '适合笔记软件' },
                { id: 'html' as const, label: 'HTML', desc: '适合网页展示' },
                { id: 'text' as const, label: '纯文本', desc: '适合复制粘贴' },
              ].map((format) => (
                <label
                  key={format.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: exportFormat === format.id ? 'var(--paper-warm)' : 'var(--paper)', border: exportFormat === format.id ? '2px solid var(--ink)' : '1px solid var(--border)', marginBottom: '8px', cursor: 'pointer' }}
                  onClick={() => setExportFormat(format.id)}
                >
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{format.label}</span>
                    <span style={{ fontSize: '11px', color: 'var(--ink-muted)', marginLeft: '8px' }}>{format.desc}</span>
                  </div>
                  <div style={{ width: '18px', height: '18px', border: '2px solid var(--ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {exportFormat === format.id && <div style={{ width: '10px', height: '10px', background: 'var(--ink)', borderRadius: '50%' }} />}
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowExportModal(false)} className="btn" style={{ flex: 1 }}>取消</button>
              <button onClick={handleExport} className="btn btn-primary" style={{ flex: 1 }}>导出</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: '430px', background: 'var(--paper)', border: '2px solid var(--ink)', padding: '20px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '3px', left: '3px', right: '3px', bottom: '3px', border: '1px solid var(--ink)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-cn)' }}>📤 分享月报</h3>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} style={{ color: 'var(--ink)' }} />
              </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '12px' }}>分享方式</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleShare('link')} className="btn" style={{ flex: 1, padding: '12px' }}>复制内容</button>
                <button onClick={() => handleShare('wechat')} className="btn" style={{ flex: 1, padding: '12px' }}>微信</button>
                <button onClick={() => handleShare('weibo')} className="btn" style={{ flex: 1, padding: '12px' }}>微博</button>
              </div>
            </div>
            <button onClick={() => setShowShareModal(false)} className="btn" style={{ width: '100%' }}>取消</button>
          </div>
        </div>
      )}
      </PageContent>
    </PageLayout>
  );
}
