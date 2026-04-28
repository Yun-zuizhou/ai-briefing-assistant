import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { useAppContext } from '../context/useAppContext';
import { apiService } from '../services/api';
import type { PeriodicReportData } from '../types/page-data';
import { downloadFile } from '../utils/exportUtils';

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

function formatConfidenceLabel(confidence?: string) {
  if (confidence === 'high') return '高';
  if (confidence === 'medium') return '中';
  if (confidence === 'low') return '低';
  return confidence ?? '待评估';
}

function buildTrendBarWidth(value: number, baseline: number) {
  if (baseline <= 0) {
    return value > 0 ? 100 : 22;
  }
  return Math.max(22, Math.round((value / baseline) * 100));
}

export default function MonthlyReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenChatPanel } = useAppContext();
  const [reportData, setReportData] = useState<PeriodicReportData | null>(null);
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
        if (response.error) {
          throw new Error(response.error);
        }
        setReportData(response.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载月报失败');
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchReport();
  }, [reportId]);

  const exportContent = useMemo(() => (reportData ? buildMonthlyMarkdown(reportData) : ''), [reportData]);

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
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>当前不会再展示伪月报内容，请稍后重试。</p>
          </div>
        ) : null}

        {loading ? (
          <div className="domain-card" style={{ marginTop: '16px', padding: '14px' }}>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>月报加载中...</p>
          </div>
        ) : !reportData ? (
          <div className="domain-card" style={{ marginTop: '16px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--ink)', marginBottom: '8px' }}>当前还没有正式生成的月报。</p>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '12px' }}>继续积累真实记录、收藏和完成事项，等正式月报生成后再查看和导出。</p>
            <button className="trend-action-btn font-sans-cn" onClick={() => setOpenChatPanel(true)}>💬 记录一条月度感悟</button>
          </div>
        ) : (
          <>
        {reportData.dataQuality ? (
          <div className="domain-card" style={{ marginBottom: '16px', padding: '14px', background: 'var(--paper-warm)' }}>
            <p style={{ fontSize: '13px', color: reportData.dataQuality.insufficientData ? 'var(--accent)' : 'var(--ink)', fontWeight: 700, margin: '0 0 6px' }}>
              数据可信度：{formatConfidenceLabel(reportData.dataQuality.confidence)}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.7, margin: 0 }}>
              {reportData.dataQuality.insufficientData
                ? '当前月报只展示真实样本，不再补假趋势。'
                : `当前月报基于 ${reportData.dataQuality.evidence.join('，')}。`}
            </p>
          </div>
        ) : null}
        <section className="report-section">
          <div className="section-header" style={{ background: 'var(--gold)' }}>
            📈 本月概览
          </div>
          <div className="section-content">
            <div className="overview-stats">
              <div className="overview-stat">
                <div className="overview-value">{reportData.overview.viewed}</div>
                <div className="overview-label">关注</div>
              </div>
              <div className="overview-stat">
                <div className="overview-value" style={{ color: 'var(--ink)' }}>{reportData.overview.recorded}</div>
                <div className="overview-label">记录</div>
              </div>
              <div className="overview-stat">
                <div className="overview-value" style={{ color: 'var(--accent)' }}>{reportData.overview.collected}</div>
                <div className="overview-label">收藏</div>
              </div>
              <div className="overview-stat">
                <div className="overview-value" style={{ color: 'var(--gold)' }}>{reportData.overview.completed}</div>
                <div className="overview-label">完成</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <div className="streak-badge">
                🔥 连续打卡 {reportData.overview.streak} 天
              </div>
            </div>
          </div>
        </section>

        {reportData.topicTrends.map((trend) => (
          <section key={trend.id} className="report-section" style={{ marginTop: '16px' }}>
            <div className="section-header" style={{ background: trend.heatData.trend === 'up' ? 'var(--accent)' : 'var(--ink)' }}>
              {trend.icon} {trend.title} · 月度趋势
            </div>
            <div className="section-content">
              <div className="trend-heat">
                <div className="heat-label">📊 月度热度趋势</div>
                <div className="heat-chart">
                  {([
                    { label: '上期', value: trend.heatData.previous },
                    { label: '本期', value: trend.heatData.current },
                  ]).map((item) => (
                    <div
                      key={item.label}
                      className="heat-chart-bar"
                      style={{
                        height: `${buildTrendBarWidth(item.value, Math.max(trend.heatData.current, trend.heatData.previous))}%`,
                        background: item.label === '本期' ? 'var(--accent)' : 'rgba(44, 36, 22, 0.35)',
                      }}
                    >
                      <span className="heat-chart-label">{item.label}</span>
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
                    className="trend-action-btn font-sans-cn"
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
                <button className="trend-action-btn font-sans-cn" onClick={() => setOpenChatPanel(true)}>💬 记录月度感悟</button>
              </div>
            </div>
          </section>
        ))}

        <section className="report-section" style={{ marginTop: '16px' }}>
          <div className="section-header" style={{ background: 'var(--ink)' }}>
            📖 我的成长 · 月度回顾
          </div>
          <div className="section-content">
            {reportData.growth.comparison ? (
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
                          <span>{reportData.growth.comparison?.current[item.index] ?? 0}</span>
                          <span>{reportData.growth.comparison?.previous[item.index] ?? 0}</span>
                          <span style={{ color: 'var(--accent)' }}>
                            {(reportData.growth.comparison?.change[item.index] ?? 0) >= 0 ? '↑' : '↓'}{Math.abs(reportData.growth.comparison?.change[item.index] ?? 0)}
                          </span>
                        </div>
                      ))}
                </div>
              </div>
            ) : null}

            <div className="growth-trajectory">
              <div className="trajectory-label">🎯 成长轨迹</div>
              <div className="trajectory-title">{reportData.growth.trajectory.title}</div>
              <p className="trajectory-description">{reportData.growth.trajectory.description}</p>
              <div className="trajectory-keywords">
                {reportData.growth.trajectory.keywords.map((keyword, i) => (
                  <span key={i} className="trajectory-keyword">{keyword}</span>
                ))}
              </div>
            </div>

            <div className="growth-thoughts">
              <div className="thoughts-label">💭 月度想法精选</div>
              {reportData.growth.selectedThoughts.length > 0 ? reportData.growth.selectedThoughts.map((thought) => (
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
                {reportData.growth.suggestions.map((suggestion, i) => (
                  <li key={i}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="report-actions">
          <button className="report-action-btn font-sans-cn" onClick={() => setShowExportModal(true)}>
            <Download size={16} style={{ marginRight: '6px' }} />
            导出月报
          </button>
          <button className="report-action-btn font-sans-cn" onClick={() => setShowShareModal(true)}>
            <Share2 size={16} style={{ marginRight: '6px' }} />
            分享月报
          </button>
        </div>
          </>
        )}

      {reportData && showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: '430px', background: 'var(--paper)', border: '2px solid var(--ink)', padding: '20px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '3px', left: '3px', right: '3px', bottom: '3px', border: '1px solid var(--ink)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans-cn)' }}>📤 导出月报</h3>
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

      {reportData && showShareModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: '430px', background: 'var(--paper)', border: '2px solid var(--ink)', padding: '20px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '3px', left: '3px', right: '3px', bottom: '3px', border: '1px solid var(--ink)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans-cn)' }}>📤 分享月报</h3>
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
