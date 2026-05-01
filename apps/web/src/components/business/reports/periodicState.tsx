import { Button } from '../../ui';
import type { PeriodicReportData } from '../../../types/page-data';
import { formatConfidenceLabel } from '../../../utils/reportPageFormatting';

const PERIODIC_EMPTY_COPY = {
  weekly: {
    title: '当前还没有正式生成的周报。',
    text: '继续记录、收藏与行动，等真实周报生成后再查看和导出。',
    action: '记录一条本周想法',
  },
  monthly: {
    title: '当前还没有正式生成的月报。',
    text: '继续积累真实记录、收藏和完成事项，等正式月报生成后再查看和导出。',
    action: '记录一条月度感悟',
  },
};

const PERIODIC_QUALITY_COPY = {
  weekly: '当前周报只展示已经确认的真实记录，不再用补位趋势填满页面。',
  monthly: '当前月报只展示真实样本，不再补假趋势。',
};

export function PeriodicReportStateCard({
  error,
  loading,
  reportData,
  sectionPrefix,
  onRecordThought,
}: {
  error: string | null;
  loading: boolean;
  reportData: PeriodicReportData | null;
  sectionPrefix: 'weekly' | 'monthly';
  onRecordThought: () => void;
}) {
  const copy = PERIODIC_EMPTY_COPY[sectionPrefix];
  const reportKind = sectionPrefix === 'weekly' ? '周报' : '月报';

  if (error) {
    return (
      <div className={`domain-card ${sectionPrefix}-report-error-card`}>
        <p className={`${sectionPrefix}-report-error-text`}>{error}</p>
        <p className={`${sectionPrefix}-report-error-note`}>当前不会再展示伪{reportKind}内容，请稍后重试。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`domain-card ${sectionPrefix}-report-loading-card`}>
        <p className={`${sectionPrefix}-report-loading-text`}>{reportKind}加载中...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className={`domain-card ${sectionPrefix}-report-empty-card`}>
        <p className={`${sectionPrefix}-report-empty-title`}>{copy.title}</p>
        <p className={`${sectionPrefix}-report-empty-text`}>{copy.text}</p>
        <Button type="button" variant="secondary" className={`trend-action-btn font-sans-cn ${sectionPrefix}-report-empty-btn`} onClick={onRecordThought}>
          {copy.action}
        </Button>
      </div>
    );
  }

  return null;
}

export function PeriodicReportQualityCard({
  reportData,
  sectionPrefix,
}: {
  reportData: PeriodicReportData;
  sectionPrefix: 'weekly' | 'monthly';
}) {
  const dataQuality = reportData.dataQuality;
  if (!dataQuality) return null;

  return (
    <div className={`domain-card ${sectionPrefix}-report-quality-card ${dataQuality.insufficientData ? 'is-warning' : ''}`}>
      <p className={`${sectionPrefix}-report-quality-title`}>
        数据可信度：{formatConfidenceLabel(dataQuality.confidence)}
      </p>
      <p className={`${sectionPrefix}-report-quality-text`}>
        {dataQuality.insufficientData
          ? PERIODIC_QUALITY_COPY[sectionPrefix]
          : `当前${sectionPrefix === 'weekly' ? '周报' : '月报'}基于 ${dataQuality.evidence.join('，')}。`}
      </p>
    </div>
  );
}
