import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Download, MessageCircle, Share2, Sparkles, Target, TrendingUp, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { Button } from '../components/ui';
import { apiService } from '../services/api';
import type { AnnualReportData } from '../types/page-data';
import { downloadFile } from '../utils/exportUtils';

function buildAnnualMarkdown(report: AnnualReportData): string {
  let markdown = `# 简报助手 · ${report.year} 年度报告\n\n`;
  markdown += `## 年度概览\n\n`;
  markdown += `- 热点：${report.stats.topicsViewed}\n`;
  markdown += `- 观点：${report.stats.opinionsPosted}\n`;
  markdown += `- 计划：${report.stats.plansCompleted}\n`;
  markdown += `- 活跃天数：${report.stats.daysActive}\n\n`;
  markdown += `## 关注领域\n\n`;
  report.interests.forEach((interest) => {
    markdown += `- ${interest}\n`;
  });
  markdown += `\n## 思考轨迹\n\n${report.thinkingSection}\n\n`;
  markdown += `## 行动足迹\n\n${report.actionSection}\n\n`;
  markdown += `## 年度关键词\n\n`;
  report.keywords.forEach((keyword) => {
    markdown += `- ${keyword}\n`;
  });
  markdown += `\n## 结语\n\n${report.closing}\n`;
  return markdown;
}

function formatConfidenceLabel(confidence?: string) {
  if (confidence === 'high') return '高';
  if (confidence === 'medium') return '中';
  if (confidence === 'low') return '低';
  return confidence ?? '待评估';
}

export default function AnnualReportPage() {
  const location = useLocation();
  const [annualReport, setAnnualReport] = useState<AnnualReportData | null>(null);
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
    const fetchAnnualReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getAnnualReport(reportId);
        if (response.error) {
          throw new Error(response.error);
        }
        setAnnualReport(response.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载年度报告失败');
        setAnnualReport(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnnualReport();
  }, [reportId]);

  const exportContent = useMemo(() => (annualReport ? buildAnnualMarkdown(annualReport) : ''), [annualReport]);

  const handleExport = useCallback(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    if (exportFormat === 'html') {
      downloadFile(`<pre>${exportContent}</pre>`, `年度报告_${dateStr}.html`, 'text/html');
    } else {
      downloadFile(exportContent, `年度报告_${dateStr}.${exportFormat === 'text' ? 'txt' : 'md'}`, exportFormat === 'text' ? 'text/plain' : 'text/markdown');
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
      <SecondaryHeader title={`${annualReport?.year ?? new Date().getFullYear()} · 年度报告`} label="ANNUAL REPORT" subtitle="年度回看" />

      <PageContent className="annual-page-content">
        {error ? (
          <div className="domain-card annual-error-card">
            <p className="annual-error-text">{error}</p>
            <p className="annual-error-note">当前不会再展示伪年度报告内容，请稍后重试。</p>
          </div>
        ) : null}

        <div className="annual-hero">
          <span className="annual-hero-frame" />
          <div className="annual-hero-icon" aria-hidden="true">📖</div>
          <h2 className="type-page-title annual-hero-title">
            我的时代印记
          </h2>
          <p className="type-hero-copy annual-hero-subtitle">
            {loading ? '年度报告加载中...' : annualReport ? '记录你在时代中的每一次思考' : '等待正式年度报告生成'}
          </p>
        </div>

        {loading ? (
          <div className="domain-card annual-state-card">
            <p className="annual-state-text">年度报告加载中...</p>
          </div>
        ) : !annualReport ? (
          <div className="domain-card annual-state-card is-empty">
            <p className="annual-state-title">当前还没有正式生成的年度报告。</p>
            <p className="annual-state-text">等年度报告正式生成后，这里再展示真实统计、关键词与回看内容。</p>
          </div>
        ) : (
          <>
            {annualReport.dataQuality ? (
              <div className="domain-card annual-quality-card">
                <p className={`annual-quality-title${annualReport.dataQuality.insufficientData ? ' is-warning' : ''}`}>
                  数据可信度：{formatConfidenceLabel(annualReport.dataQuality.confidence)}
                </p>
                <p className="annual-quality-text">
                  {annualReport.dataQuality.insufficientData
                    ? '当前年度报告已经切到真实数据口径，但样本仍偏少，因此只展示已确认事实。'
                    : `当前年度报告基于 ${annualReport.dataQuality.evidence.join('，')}。`}
                </p>
              </div>
            ) : null}

            <Section title="📊 这一年，你见证了" icon={<TrendingUp size={16} />} tone="ink">
              <div className="annual-overview-grid">
                <StatItem number={annualReport.stats.topicsViewed} label="热点" />
                <StatItem number={annualReport.stats.opinionsPosted} label="观点" />
                <StatItem number={annualReport.stats.plansCompleted} label="计划" />
              </div>
              <div className="annual-active-days">
                <Calendar size={16} className="annual-active-days-icon" />
                <p className="annual-active-days-text">
                  活跃了 <span className="annual-active-days-number">{annualReport.stats.daysActive}</span> 天
                </p>
              </div>
            </Section>

            <Section title="🎯 你最关注的领域" icon={<Target size={16} />} tone="accent">
              <div className="annual-chip-list">
                {annualReport.interests.map((interest, i) => (
                  <span key={interest} className={`annual-chip ${getToneClass(i)}`}>
                    #{interest}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="💭 你的思考轨迹" icon={<Sparkles size={16} />} tone="ink">
              <p className="annual-paragraph">{annualReport.thinkingSection}</p>
            </Section>

            <Section title="🚀 你的行动足迹" icon={<Target size={16} />} tone="ink">
              <p className="annual-paragraph">{annualReport.actionSection}</p>
            </Section>

            <Section title="🏷️ 年度关键词" icon={<MessageCircle size={16} />} tone="gold">
              <div className="annual-keyword-box">
                <div className="annual-chip-list annual-keyword-list">
                  {annualReport.keywords.map((keyword, i) => (
                    <span key={keyword} className={`annual-chip annual-keyword-chip ${getToneClass(i)}`}>
                      <span aria-hidden="true">{getKeywordEmoji(keyword)}</span>
                      <span>{keyword}</span>
                    </span>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="✨ 结语" icon={<Sparkles size={16} />} tone="ink">
              <p className="annual-paragraph">{annualReport.closing}</p>
            </Section>

            <div className="report-actions annual-actions">
              <Button
                type="button"
                variant="primary"
                onClick={() => setShowExportModal(true)}
                className="report-action-btn annual-action-btn is-primary"
              >
                <Download size={16} />
                导出年度报告
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowShareModal(true)}
                className="report-action-btn annual-action-btn"
              >
                <Share2 size={16} />
                分享年度报告
              </Button>
            </div>
          </>
        )}

        {annualReport && showExportModal && (
          <div className="report-sheet-overlay">
            <div className="report-sheet">
              <div className="report-sheet-head">
                <h3 className="report-sheet-title">📤 导出年度报告</h3>
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
        )}

        {annualReport && showShareModal && (
          <div className="report-sheet-overlay">
            <div className="report-sheet">
              <div className="report-sheet-head">
                <h3 className="report-sheet-title">📤 分享年度报告</h3>
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
        )}
      </PageContent>
    </PageLayout>
  );
}

function Section({
  title,
  children,
  icon,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  tone: 'ink' | 'accent' | 'gold';
}) {
  return (
    <section className="report-section annual-section">
      <div className={`section-header annual-section-header tone-${tone}`}>
        {icon}
        <h3 className="type-content-title annual-section-title">
          {title}
        </h3>
      </div>
      <div className="section-content annual-section-content">{children}</div>
    </section>
  );
}

function StatItem({ number, label }: { number: number; label: string }) {
  return (
    <div className="annual-overview-stat">
      <div className="type-stat-number annual-overview-number">{number}</div>
      <div className="annual-overview-label">{label}</div>
    </div>
  );
}

function getToneClass(index: number): string {
  if (index === 0) return 'tone-accent';
  if (index === 1) return 'tone-gold';
  return 'tone-ink';
}

function getKeywordEmoji(keyword: string): string {
  const emojiMap: Record<string, string> = {
    探索者: '🔍',
    记录者: '📝',
    思考者: '💡',
    行动者: '🚀',
    回顾者: '🌱',
  };
  return emojiMap[keyword] || '⭐';
}
