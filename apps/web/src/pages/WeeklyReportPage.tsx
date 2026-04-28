import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Share2, X, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { Button } from '../components/ui';
import { useAppContext } from '../context/useAppContext';
import { apiService } from '../services/api';
import type { PeriodicReportData } from '../types/page-data';
import { downloadFile } from '../utils/exportUtils';

function buildWeeklyMarkdown(report: PeriodicReportData): string {
  const { overview, topicTrends, growth } = report;
  let markdown = `# 简报助手 · 周报\n\n`;
  markdown += `**周期**: ${overview.period}\n\n`;
  markdown += `## 本周概览\n\n`;
  markdown += `- 关注：${overview.viewed}\n`;
  markdown += `- 记录：${overview.recorded}\n`;
  markdown += `- 收藏：${overview.collected}\n`;
  markdown += `- 完成：${overview.completed}\n`;
  markdown += `- 连续打卡：${overview.streak} 天\n\n`;

  if (topicTrends.length > 0) {
    markdown += `## 主题趋势\n\n`;
    topicTrends.forEach((trend) => {
      markdown += `### ${trend.icon} ${trend.title}\n`;
      markdown += `- 热度变化：${trend.heatData.change > 0 ? '↑' : trend.heatData.change < 0 ? '↓' : '→'}${Math.abs(trend.heatData.change)}%\n`;
      markdown += `- 热点：${trend.hotSpot.title}\n`;
      markdown += `- 洞察：${trend.insights.join('；')}\n\n`;
    });
  }

  markdown += `## 成长回顾\n\n`;
  markdown += `${growth.trajectory.description}\n\n`;

  if (growth.selectedThoughts.length > 0) {
    markdown += `### 本周想法\n\n`;
    growth.selectedThoughts.forEach((thought) => {
      markdown += `- ${thought.date}：${thought.content}\n`;
    });
    markdown += `\n`;
  }

  markdown += `### 下周建议\n\n`;
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

export default function WeeklyReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenChatPanel } = useAppContext();
  const [reportData, setReportData] = useState<PeriodicReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'html' | 'text'>('markdown');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
        const response = await apiService.getWeeklyReport(reportId);
        if (response.error) {
          throw new Error(response.error);
        }
        setReportData(response.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '周报暂时加载失败，请稍后重试。');
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchReport();
  }, [reportId]);

  const exportContent = useMemo(() => (reportData ? buildWeeklyMarkdown(reportData) : ''), [reportData]);

  const handleRecordThought = useCallback(() => {
    setOpenChatPanel(true);
  }, [setOpenChatPanel]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  }, []);

  const handleExport = useCallback(() => {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      if (exportFormat === 'html') {
        downloadFile(`<pre>${exportContent}</pre>`, `周报_${dateStr}.html`, 'text/html');
      } else {
        downloadFile(exportContent, `周报_${dateStr}.${exportFormat === 'text' ? 'txt' : 'md'}`, exportFormat === 'text' ? 'text/plain' : 'text/markdown');
      }
      setShowExportModal(false);
      showToast('导出成功');
    } catch {
      showToast('导出失败，请稍后重试');
    }
  }, [exportContent, exportFormat, showToast]);

  const handleShare = useCallback((method: 'link' | 'wechat' | 'weibo') => {
    const copyContent = async (successText: string) => {
      try {
        await navigator.clipboard.writeText(exportContent);
        showToast(successText);
      } catch {
        showToast('复制失败，请手动复制后再分享');
      }
    };

    if (method === 'link') {
      void copyContent('已复制周报内容');
    } else if (method === 'wechat') {
      void copyContent('已复制，可粘贴到微信');
    } else {
      const opened = window.open(`https://service.weibo.com/share/share.php?title=${encodeURIComponent(exportContent.slice(0, 300))}`, '_blank');
      showToast(opened ? '已打开微博分享页' : '浏览器拦截了弹窗，请允许后重试');
    }

    setShowShareModal(false);
  }, [exportContent, showToast]);

  const handleOpenHotspotDetail = useCallback((contentRef?: string) => {
    if (!contentRef) {
      return;
    }
    navigate(`/article?ref=${encodeURIComponent(contentRef)}`);
  }, [navigate]);

  return (
    <PageLayout variant="report">
      <SecondaryHeader title="周 报" label="WEEKLY REPORT" subtitle="本周回顾" />

      <PageContent className="weekly-report-page-content">
        {error ? (
          <div className="domain-card weekly-report-error-card">
            <p className="weekly-report-error-text">{error}</p>
            <p className="weekly-report-error-note">当前不会再展示伪周报内容，请稍后重试。</p>
          </div>
        ) : null}
        {loading ? (
          <div className="domain-card weekly-report-loading-card">
            <p className="weekly-report-loading-text">周报加载中...</p>
          </div>
        ) : !reportData ? (
          <div className="domain-card weekly-report-empty-card">
            <p className="weekly-report-empty-title">当前还没有正式生成的周报。</p>
            <p className="weekly-report-empty-text">继续记录、收藏与行动，等真实周报生成后再查看和导出。</p>
            <Button type="button" variant="secondary" className="trend-action-btn font-sans-cn weekly-report-empty-btn" onClick={handleRecordThought}>
              💬 去记录一条本周想法
            </Button>
          </div>
        ) : (
          <>
            {reportData.dataQuality ? (
              <div className={`domain-card weekly-report-quality-card ${reportData.dataQuality.insufficientData ? 'is-warning' : ''}`}>
                <p className="weekly-report-quality-title">
                  数据可信度：{formatConfidenceLabel(reportData.dataQuality.confidence)}
                </p>
                <p className="weekly-report-quality-text">
                  {reportData.dataQuality.insufficientData
                    ? '当前周报只展示已经确认的真实记录，不再用补位趋势填满页面。'
                    : `当前周报基于 ${reportData.dataQuality.evidence.join('，')}。`}
                </p>
              </div>
            ) : null}
            <section className="report-section weekly-report-section">
              <div className="section-header weekly-report-header weekly-report-header-gold">
                📈 本周概览
              </div>
              <div className="section-content">
                <div className="overview-stats">
                  <div className="overview-stat">
                    <div className="overview-value">{reportData.overview.viewed}</div>
                    <div className="overview-label">关注</div>
                  </div>
                  <div className="overview-stat">
                    <div className="overview-value weekly-overview-recorded">{reportData.overview.recorded}</div>
                    <div className="overview-label">记录</div>
                  </div>
                  <div className="overview-stat">
                    <div className="overview-value weekly-overview-collected">{reportData.overview.collected}</div>
                    <div className="overview-label">收藏</div>
                  </div>
                  <div className="overview-stat">
                    <div className="overview-value weekly-overview-completed">{reportData.overview.completed}</div>
                    <div className="overview-label">完成</div>
                  </div>
                </div>
                <div className="weekly-overview-streak-wrap">
                  <div className="streak-badge">
                    🔥 连续打卡 {reportData.overview.streak} 天
                  </div>
                </div>
              </div>
            </section>

            {reportData.topicTrends.map((trend) => (
              <section key={trend.id} className="report-section weekly-report-section weekly-report-stack-section">
                <div className={`section-header weekly-report-header ${trend.heatData.trend === 'up' ? 'weekly-report-header-up' : 'weekly-report-header-down'}`}>
                  {trend.icon} {trend.title} · 周趋势
                </div>
                <div className="section-content">
                  <div className="trend-heat">
                    <div className="heat-label">📊 讨论热度变化</div>
                    <div className="heat-bar-container">
                      <progress
                        className={`heat-bar weekly-trend-heat-bar ${trend.heatData.trend === 'up' ? 'is-up' : 'is-down'}`}
                        value={Math.max(0, Math.min(trend.heatData.current, 100))}
                        max={100}
                        aria-label={`${trend.title} 热度`}
                      />
                    </div>
                    <div className="heat-info">
                      <span>{trend.hotSpot.title}</span>
                      <span className={`weekly-trend-change ${trend.heatData.trend === 'up' ? 'is-up' : 'is-down'}`}>
                        {trend.heatData.change > 0 ? '↑' : trend.heatData.change < 0 ? '↓' : '→'}
                        {Math.abs(trend.heatData.change)}%
                      </span>
                    </div>
                  </div>

                  <div className="trend-hotspot">
                    <div className="hotspot-label">🔥 本周热点</div>
                    <div className="hotspot-title">{trend.hotSpot.title}</div>
                    {trend.hotSpot.contentRef ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="trend-action-btn font-sans-cn weekly-hotspot-detail-btn"
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
                    <div className="insights-label">💡 趋势洞察</div>
                    <ul className="insights-list">
                      {trend.insights.map((insight, i) => (
                        <li key={i}>• {insight}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="trend-actions">
                    <Button type="button" variant="secondary" className="trend-action-btn font-sans-cn" onClick={handleRecordThought}>
                      💬 记录本周感悟
                    </Button>
                  </div>
                </div>
              </section>
            ))}

            <section className="report-section weekly-report-section weekly-report-stack-section">
              <div className="section-header weekly-report-header weekly-report-header-ink">
                📖 我的成长 · 周回顾
              </div>
              <div className="section-content">
                <div className="growth-stats">
                  <div className="growth-stat-item">
                    <div className="growth-stat-label">关注</div>
                    <div className="growth-stat-value">{reportData.growth.stats.viewed}</div>
                  </div>
                  <div className="growth-stat-item">
                    <div className="growth-stat-label">记录</div>
                    <div className="growth-stat-value">{reportData.growth.stats.recorded}</div>
                  </div>
                  <div className="growth-stat-item">
                    <div className="growth-stat-label">收藏</div>
                    <div className="growth-stat-value">{reportData.growth.stats.collected}</div>
                  </div>
                  <div className="growth-stat-item">
                    <div className="growth-stat-label">完成</div>
                    <div className="growth-stat-value">{reportData.growth.stats.completed}</div>
                  </div>
                </div>

                <div className="growth-trajectory weekly-growth-trajectory">
                  <div className="trajectory-label">🎯 成长轨迹</div>
                  <div className="trajectory-title">{reportData.growth.trajectory.title}</div>
                  <p className="trajectory-description">{reportData.growth.trajectory.description}</p>
                </div>

                <div className="growth-thoughts">
                  <div className="thoughts-label">💭 本周想法记录</div>
                  {reportData.growth.selectedThoughts.length > 0 ? reportData.growth.selectedThoughts.map((thought) => (
                    <div key={thought.id} className="thought-item">
                      <span className="thought-date">{thought.date}</span>
                      <span className="thought-content">"{thought.content}"</span>
                    </div>
                  )) : (
                    <p className="weekly-growth-empty">当前还没有可引用的真实记录。</p>
                  )}
                </div>

                <div className="growth-suggestions">
                  <div className="suggestions-label">🎯 下周建议</div>
                  <ul className="suggestions-list">
                    {reportData.growth.suggestions.map((suggestion, i) => (
                      <li key={i}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <div className="report-actions weekly-report-actions">
              <Button type="button" variant="primary" className="report-action-btn font-sans-cn" onClick={() => setShowExportModal(true)}>
                <Download size={16} className="weekly-report-action-icon" />
                导出周报
              </Button>
              <Button type="button" variant="secondary" className="report-action-btn font-sans-cn" onClick={() => setShowShareModal(true)}>
                <Share2 size={16} className="weekly-report-action-icon" />
                分享周报
              </Button>
            </div>
          </>
        )}
      </PageContent>

      {reportData && showExportModal && (
        <div className="weekly-report-modal-overlay">
          <div className="weekly-report-modal-panel">
            <span className="weekly-report-modal-frame" />
            <div className="weekly-report-modal-head">
              <h3 className="weekly-report-modal-title">📤 导出周报</h3>
              <Button type="button" variant="unstyled" onClick={() => setShowExportModal(false)} className="weekly-report-modal-close" aria-label="关闭导出弹窗">
                <X size={20} />
              </Button>
            </div>
            <div className="weekly-report-modal-body">
              <p className="weekly-report-modal-label">导出格式</p>
              <div className="weekly-report-format-list">
                {[
                  { id: 'markdown' as const, label: 'Markdown', desc: '适合笔记软件' },
                  { id: 'html' as const, label: 'HTML', desc: '适合网页展示' },
                  { id: 'text' as const, label: '纯文本', desc: '适合复制粘贴' },
                ].map((format) => (
                  <Button
                    key={format.id}
                    type="button"
                    variant="unstyled"
                    className={`weekly-report-format-option ${exportFormat === format.id ? 'is-active' : ''}`}
                    onClick={() => setExportFormat(format.id)}
                  >
                    <div className="weekly-report-format-meta">
                      <span className="weekly-report-format-title">{format.label}</span>
                      <span className="weekly-report-format-desc">{format.desc}</span>
                    </div>
                    <div className={`weekly-report-format-radio ${exportFormat === format.id ? 'is-active' : ''}`}>
                      {exportFormat === format.id ? <span className="weekly-report-format-dot" /> : null}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            <div className="weekly-report-modal-actions">
              <Button type="button" onClick={() => setShowExportModal(false)} variant="secondary" className="weekly-report-modal-btn">取消</Button>
              <Button type="button" onClick={handleExport} variant="primary" className="weekly-report-modal-btn">导出</Button>
            </div>
          </div>
        </div>
      )}

      {reportData && showShareModal && (
        <div className="weekly-report-modal-overlay">
          <div className="weekly-report-modal-panel">
            <span className="weekly-report-modal-frame" />
            <div className="weekly-report-modal-head">
              <h3 className="weekly-report-modal-title">📤 分享周报</h3>
              <Button type="button" variant="unstyled" onClick={() => setShowShareModal(false)} className="weekly-report-modal-close" aria-label="关闭分享弹窗">
                <X size={20} />
              </Button>
            </div>
            <div className="weekly-report-modal-body">
              <p className="weekly-report-modal-label">分享方式</p>
              <div className="weekly-report-share-options">
                <Button type="button" onClick={() => handleShare('link')} variant="secondary" className="weekly-report-share-btn">复制周报</Button>
                <Button type="button" onClick={() => handleShare('wechat')} variant="secondary" className="weekly-report-share-btn">复制到微信</Button>
                <Button type="button" onClick={() => handleShare('weibo')} variant="secondary" className="weekly-report-share-btn">微博</Button>
              </div>
            </div>
            <Button type="button" onClick={() => setShowShareModal(false)} variant="secondary" className="weekly-report-share-cancel">取消</Button>
          </div>
        </div>
      )}

      {toastMessage ? (
        <div className="weekly-report-toast">
          <Check size={16} className="weekly-report-toast-icon" />
          {toastMessage}
        </div>
      ) : null}
    </PageLayout>
  );
}
