import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { Button } from '../components/ui';
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

  const handleOpenHotspotDetail = useCallback((contentRef?: string) => {
    if (!contentRef) {
      return;
    }
    navigate(`/article?ref=${encodeURIComponent(contentRef)}`);
  }, [navigate]);

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

      <PageContent className="monthly-report-page-content">
        {error ? (
          <div className="domain-card monthly-report-error-card">
            <p className="monthly-report-error-text">{error}</p>
            <p className="monthly-report-error-note">当前不会再展示伪月报内容，请稍后重试。</p>
          </div>
        ) : null}

        {loading ? (
          <div className="domain-card monthly-report-loading-card">
            <p className="monthly-report-loading-text">月报加载中...</p>
          </div>
        ) : !reportData ? (
          <div className="domain-card monthly-report-empty-card">
            <p className="monthly-report-empty-title">当前还没有正式生成的月报。</p>
            <p className="monthly-report-empty-text">继续积累真实记录、收藏和完成事项，等正式月报生成后再查看和导出。</p>
            <Button type="button" variant="secondary" className="trend-action-btn font-sans-cn monthly-report-empty-btn" onClick={() => setOpenChatPanel(true)}>
              💬 记录一条月度感悟
            </Button>
          </div>
        ) : (
          <>
            {reportData.dataQuality ? (
              <div className={`domain-card monthly-report-quality-card ${reportData.dataQuality.insufficientData ? 'is-warning' : ''}`}>
                <p className="monthly-report-quality-title">
                  数据可信度：{formatConfidenceLabel(reportData.dataQuality.confidence)}
                </p>
                <p className="monthly-report-quality-text">
                  {reportData.dataQuality.insufficientData
                    ? '当前月报只展示真实样本，不再补假趋势。'
                    : `当前月报基于 ${reportData.dataQuality.evidence.join('，')}。`}
                </p>
              </div>
            ) : null}

            <section className="report-section monthly-report-section">
              <div className="section-header monthly-report-header monthly-report-header-gold">
                📈 本月概览
              </div>
              <div className="section-content">
                <div className="overview-stats">
                  <div className="overview-stat">
                    <div className="overview-value">{reportData.overview.viewed}</div>
                    <div className="overview-label">关注</div>
                  </div>
                  <div className="overview-stat">
                    <div className="overview-value monthly-overview-recorded">{reportData.overview.recorded}</div>
                    <div className="overview-label">记录</div>
                  </div>
                  <div className="overview-stat">
                    <div className="overview-value monthly-overview-collected">{reportData.overview.collected}</div>
                    <div className="overview-label">收藏</div>
                  </div>
                  <div className="overview-stat">
                    <div className="overview-value monthly-overview-completed">{reportData.overview.completed}</div>
                    <div className="overview-label">完成</div>
                  </div>
                </div>
                <div className="monthly-overview-streak-wrap">
                  <div className="streak-badge">
                    🔥 连续打卡 {reportData.overview.streak} 天
                  </div>
                </div>
              </div>
            </section>

            {reportData.topicTrends.map((trend) => (
              <section key={trend.id} className="report-section monthly-report-section monthly-report-stack-section">
                <div className={`section-header monthly-report-header ${trend.heatData.trend === 'up' ? 'monthly-report-header-up' : 'monthly-report-header-down'}`}>
                  {trend.icon} {trend.title} · 月度趋势
                </div>
                <div className="section-content">
                  <div className="trend-heat">
                    <div className="heat-label">📊 月度热度趋势</div>
                    <div className="heat-chart">
                      {([
                        { label: '上期', value: trend.heatData.previous },
                        { label: '本期', value: trend.heatData.current },
                      ]).map((item) => {
                        const barHeight = buildTrendBarWidth(item.value, Math.max(trend.heatData.current, trend.heatData.previous));
                        return (
                          <div
                            key={item.label}
                            className={`heat-chart-bar monthly-heat-chart-bar ${item.label === '本期' ? 'is-current' : 'is-previous'}`}
                          >
                            <svg className="monthly-heat-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                              <rect
                                className="monthly-heat-chart-rect"
                                x="0"
                                y={Math.max(0, 100 - barHeight)}
                                width="100"
                                height={barHeight}
                                rx="8"
                                ry="8"
                              />
                            </svg>
                            <span className="heat-chart-label">{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="heat-info">
                      <span>{trend.hotSpot.title}</span>
                      <span className={`monthly-trend-change ${trend.heatData.trend === 'up' ? 'is-up' : 'is-down'}`}>
                        {trend.heatData.change > 0 ? '↑' : trend.heatData.change < 0 ? '↓' : '→'}{Math.abs(trend.heatData.change)}%
                      </span>
                    </div>
                  </div>

                  <div className="trend-hotspot">
                    <div className="hotspot-label">🔥 月度热点</div>
                    <div className="hotspot-title">{trend.hotSpot.title}</div>
                    {trend.hotSpot.contentRef ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="trend-action-btn font-sans-cn monthly-hotspot-detail-btn"
                        onClick={() => handleOpenHotspotDetail(trend.hotSpot.contentRef)}
                      >
                        查看热点详情
                      </Button>
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

                  {trend.userAttentionChange ? (
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
                  ) : null}

                  <div className="trend-actions">
                    <Button type="button" variant="secondary" className="trend-action-btn font-sans-cn" onClick={() => setOpenChatPanel(true)}>
                      💬 记录月度感悟
                    </Button>
                  </div>
                </div>
              </section>
            ))}

            <section className="report-section monthly-report-section monthly-report-stack-section">
              <div className="section-header monthly-report-header monthly-report-header-ink">
                📖 我的成长 · 月度回顾
              </div>
              <div className="section-content">
                {reportData.growth.comparison ? (
                  <div className="growth-comparison">
                    <div className="comparison-label">📊 月度数据对比</div>
                    <div className="comparison-table">
                      <div className="comparison-row comparison-header">
                        <span />
                        <span>本月</span>
                        <span>上月</span>
                        <span>变化</span>
                      </div>
                      {[
                        { label: '关注', index: 0 },
                        { label: '记录', index: 1 },
                        { label: '收藏', index: 2 },
                        { label: '完成', index: 3 },
                      ].map((item) => {
                        const change = reportData.growth.comparison?.change[item.index] ?? 0;
                        return (
                          <div key={item.label} className="comparison-row">
                            <span>{item.label}</span>
                            <span>{reportData.growth.comparison?.current[item.index] ?? 0}</span>
                            <span>{reportData.growth.comparison?.previous[item.index] ?? 0}</span>
                            <span className={`monthly-comparison-change ${change >= 0 ? 'is-up' : 'is-down'}`}>
                              {change >= 0 ? '↑' : '↓'}{Math.abs(change)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="growth-trajectory monthly-growth-trajectory">
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
                    <p className="monthly-growth-empty">当前还没有足够的月度想法可展示。</p>
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

            <div className="report-actions monthly-report-actions">
              <Button type="button" variant="primary" className="report-action-btn font-sans-cn" onClick={() => setShowExportModal(true)}>
                <Download size={16} className="monthly-report-action-icon" />
                导出月报
              </Button>
              <Button type="button" variant="secondary" className="report-action-btn font-sans-cn" onClick={() => setShowShareModal(true)}>
                <Share2 size={16} className="monthly-report-action-icon" />
                分享月报
              </Button>
            </div>
          </>
        )}
      </PageContent>

      {reportData && showExportModal ? (
        <div className="report-sheet-overlay">
          <div className="report-sheet">
            <div className="report-sheet-head">
              <h3 className="report-sheet-title">📤 导出月报</h3>
              <Button type="button" variant="unstyled" onClick={() => setShowExportModal(false)} className="report-sheet-close" aria-label="关闭导出弹窗">
                <X size={18} />
              </Button>
            </div>
            <div className="report-sheet-body">
              <p className="report-sheet-label">导出格式</p>
              {[
                { id: 'markdown' as const, label: 'Markdown', desc: '适合笔记软件' },
                { id: 'html' as const, label: 'HTML', desc: '适合网页展示' },
                { id: 'text' as const, label: '纯文本', desc: '适合复制粘贴' },
              ].map((format) => (
                <Button
                  type="button"
                  key={format.id}
                  variant="unstyled"
                  className={`report-sheet-option${exportFormat === format.id ? ' is-active' : ''}`}
                  onClick={() => setExportFormat(format.id)}
                >
                  <span className="report-sheet-option-main">
                    <span className="report-sheet-option-title">{format.label}</span>
                    <span className="report-sheet-option-desc">{format.desc}</span>
                  </span>
                  <span className="report-sheet-radio">
                    {exportFormat === format.id ? <span className="report-sheet-radio-dot" /> : null}
                  </span>
                </Button>
              ))}
            </div>
            <div className="report-sheet-actions">
              <Button type="button" variant="secondary" onClick={() => setShowExportModal(false)} className="report-action-btn">取消</Button>
              <Button type="button" variant="primary" onClick={handleExport} className="report-action-btn is-primary">导出</Button>
            </div>
          </div>
        </div>
      ) : null}

      {reportData && showShareModal ? (
        <div className="report-sheet-overlay">
          <div className="report-sheet">
            <div className="report-sheet-head">
              <h3 className="report-sheet-title">📤 分享月报</h3>
              <Button type="button" variant="unstyled" onClick={() => setShowShareModal(false)} className="report-sheet-close" aria-label="关闭分享弹窗">
                <X size={18} />
              </Button>
            </div>
            <div className="report-sheet-body">
              <p className="report-sheet-label">分享方式</p>
              <div className="report-sheet-share-grid">
                <Button type="button" variant="secondary" onClick={() => handleShare('link')} className="report-action-btn">复制内容</Button>
                <Button type="button" variant="secondary" onClick={() => handleShare('wechat')} className="report-action-btn">微信</Button>
                <Button type="button" variant="secondary" onClick={() => handleShare('weibo')} className="report-action-btn">微博</Button>
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={() => setShowShareModal(false)} className="report-action-btn report-sheet-cancel">取消</Button>
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
