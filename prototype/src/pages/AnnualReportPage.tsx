import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Download, MessageCircle, Share2, Sparkles, Target, TrendingUp, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { PageContent, PageLayout, SecondaryHeader } from '../components/layout';
import { apiService } from '../services/api';
import type { AnnualReportData } from '../types/page-data';
import { downloadFile } from '../utils/exportUtils';

const fallbackAnnualReport: AnnualReportData = {
  year: new Date().getFullYear(),
  stats: {
    topicsViewed: 0,
    opinionsPosted: 0,
    plansCompleted: 0,
    daysActive: 0,
  },
  keywords: ['记录者', '行动者', '回顾者'],
  interests: ['信息输入', '个人记录', '行动转化'],
  thinkingSection: '你的年度沉淀仍在持续积累中，继续记录与回看会让年度画像更稳定。',
  actionSection: '你已经开始把记录、收藏、待办与历史行为收成稳定动作链，接下来更适合继续放大真正有效的长期主题。',
  closing: '这份年度报告当前已经接入正式接口读取，当前展示的是年度回看主链的最小稳定版本。',
};

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

export default function AnnualReportPage() {
  const location = useLocation();
  const [annualReport, setAnnualReport] = useState<AnnualReportData>(fallbackAnnualReport);
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
        setAnnualReport(response.data ?? fallbackAnnualReport);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载年度报告失败');
        setAnnualReport(fallbackAnnualReport);
      } finally {
        setLoading(false);
      }
    };

    void fetchAnnualReport();
  }, [reportId]);

  const exportContent = useMemo(() => buildAnnualMarkdown(annualReport), [annualReport]);

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
      <SecondaryHeader title={`${annualReport.year} · 年度报告`} label="ANNUAL REPORT" subtitle="年度回看" />

      <PageContent style={{ padding: '16px' }}>
        {error ? (
          <div className="domain-card" style={{ marginBottom: '16px', padding: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '6px' }}>{error}</p>
            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', margin: 0 }}>当前会保留最小年度报告结构，但详情页入口仍可继续使用。</p>
          </div>
        ) : null}

        <div style={{ padding: '24px', background: 'var(--paper-warm)', border: '2px solid var(--ink)', marginBottom: '16px', textAlign: 'center', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '3px', left: '3px', right: '3px', bottom: '3px', border: '1px solid var(--ink)', pointerEvents: 'none' }} />
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📖</div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--ink)', fontFamily: 'var(--font-serif-cn)', marginBottom: '8px' }}>
            我的时代印记
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontFamily: 'var(--font-serif-cn)', margin: 0 }}>
            {loading ? '年度报告加载中...' : '记录你在时代中的每一次思考'}
          </p>
        </div>

        <Section title="📊 这一年，你见证了" icon={<TrendingUp size={16} />}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '2px solid var(--ink)', textAlign: 'center', marginBottom: '16px' }}>
            <StatItem number={annualReport.stats.topicsViewed} label="热点" />
            <StatItem number={annualReport.stats.opinionsPosted} label="观点" />
            <StatItem number={annualReport.stats.plansCompleted} label="计划" />
          </div>
          <div style={{ textAlign: 'center', padding: '14px', background: 'var(--paper-warm)', border: '1px solid var(--ink)' }}>
            <Calendar size={16} style={{ color: 'var(--accent)', marginBottom: '4px' }} />
            <div style={{ color: 'var(--ink-muted)', fontSize: '14px' }}>
              活跃了 <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '18px' }}>{annualReport.stats.daysActive}</span> 天
            </div>
          </div>
        </Section>

        <Section title="🎯 你最关注的领域" icon={<Target size={16} />}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {annualReport.interests.map((interest, i) => (
              <span
                key={interest}
                style={{
                  padding: '8px 14px',
                  background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--gold)' : 'var(--ink)',
                  color: 'var(--paper)',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-serif-cn)',
                }}
              >
                #{interest}
              </span>
            ))}
          </div>
        </Section>

        <Section title="💭 你的思考轨迹" icon={<Sparkles size={16} />}>
          <p style={{ fontSize: '14px', lineHeight: 1.9, color: 'var(--ink-light)', whiteSpace: 'pre-line', margin: 0 }}>
            {annualReport.thinkingSection}
          </p>
        </Section>

        <Section title="🚀 你的行动足迹" icon={<Target size={16} />}>
          <p style={{ fontSize: '14px', lineHeight: 1.9, color: 'var(--ink-light)', whiteSpace: 'pre-line', margin: 0 }}>
            {annualReport.actionSection}
          </p>
        </Section>

        <Section title="🏷️ 年度关键词" icon={<MessageCircle size={16} />}>
          <div style={{ background: 'var(--paper-warm)', border: '1px solid var(--ink)', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', fontFamily: 'var(--font-serif-cn)' }}>
              {annualReport.keywords.map((keyword, i) => (
                <span
                  key={keyword}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--gold)' : 'var(--ink)',
                    color: 'var(--paper)',
                  }}
                >
                  {getKeywordEmoji(keyword)} {keyword}
                </span>
              ))}
            </div>
          </div>
        </Section>

        <Section title="✨ 结语" icon={<Sparkles size={16} />}>
          <p style={{ fontSize: '14px', lineHeight: 1.9, color: 'var(--ink-light)', whiteSpace: 'pre-line', margin: 0 }}>
            {annualReport.closing}
          </p>
        </Section>

        <div style={{ marginTop: '20px', marginBottom: '20px', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowExportModal(true)}
            style={{ flex: 1, padding: '14px', background: 'var(--ink)', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: 'var(--paper)', fontFamily: 'var(--font-serif-cn)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Download size={18} />
            导出年度报告
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            style={{ flex: 1, padding: '14px', background: 'var(--paper)', border: '2px solid var(--ink)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: 'var(--ink)', fontFamily: 'var(--font-serif-cn)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative' }}
          >
            <span style={{ position: 'absolute', top: '2px', left: '2px', right: '2px', bottom: '2px', border: '1px solid var(--ink)', pointerEvents: 'none' }} />
            <Share2 size={18} />
            分享年度报告
          </button>
        </div>

        {showExportModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ width: '100%', maxWidth: '430px', background: 'var(--paper)', border: '2px solid var(--ink)', padding: '20px', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '3px', left: '3px', right: '3px', bottom: '3px', border: '1px solid var(--ink)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-cn)' }}>📤 导出年度报告</h3>
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
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-cn)' }}>📤 分享年度报告</h3>
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

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '10px 12px', background: 'var(--ink)', color: 'var(--paper)' }}>
        {icon}
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-serif-cn)' }}>
          {title}
        </h3>
      </div>
      <div style={{ padding: '14px', background: 'var(--paper)', border: '1px solid var(--ink)' }}>
        {children}
      </div>
    </div>
  );
}

function StatItem({ number, label }: { number: number; label: string }) {
  return (
    <div style={{ padding: '14px 8px', borderRight: '1px solid var(--ink)' }}>
      <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent)', fontFamily: 'var(--font-serif-cn)' }}>{number}</div>
      <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{label}</div>
    </div>
  );
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
