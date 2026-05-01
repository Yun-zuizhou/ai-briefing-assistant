import { X } from 'lucide-react';

import { Button } from '../../ui';
import type { ReportExportFormat } from './contracts';
import { REPORT_EXPORT_FORMATS } from './exportFormats';

export function ReportExportSheet({
  exportFormat,
  reportKind,
  onClose,
  onExport,
  onFormatChange,
}: {
  exportFormat: ReportExportFormat;
  reportKind: string;
  onClose: () => void;
  onExport: () => void;
  onFormatChange: (format: ReportExportFormat) => void;
}) {
  return (
    <div className="report-sheet-overlay">
      <div className="report-sheet">
        <div className="report-sheet-head">
          <h3 className="report-sheet-title">导出{reportKind}</h3>
          <Button type="button" variant="unstyled" onClick={onClose} className="report-sheet-close" aria-label="关闭导出弹窗">
            <X size={18} />
          </Button>
        </div>
        <div className="report-sheet-body">
          <p className="report-sheet-label">导出格式</p>
          {REPORT_EXPORT_FORMATS.map((format) => (
            <Button
              type="button"
              key={format.id}
              variant="unstyled"
              className={`report-sheet-option${exportFormat === format.id ? ' is-active' : ''}`}
              onClick={() => onFormatChange(format.id)}
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
          <Button type="button" variant="secondary" onClick={onClose} className="report-action-btn">取消</Button>
          <Button type="button" variant="primary" onClick={onExport} className="report-action-btn is-primary">导出</Button>
        </div>
      </div>
    </div>
  );
}

export function ReportShareSheet({
  reportKind,
  onClose,
  onShare,
}: {
  reportKind: string;
  onClose: () => void;
  onShare: (method: 'link' | 'wechat' | 'weibo') => void;
}) {
  return (
    <div className="report-sheet-overlay">
      <div className="report-sheet">
        <div className="report-sheet-head">
          <h3 className="report-sheet-title">分享{reportKind}</h3>
          <Button type="button" variant="unstyled" onClick={onClose} className="report-sheet-close" aria-label="关闭分享弹窗">
            <X size={18} />
          </Button>
        </div>
        <div className="report-sheet-body">
          <p className="report-sheet-label">分享方式</p>
          <div className="report-sheet-share-grid">
            <Button type="button" variant="secondary" onClick={() => onShare('link')} className="report-action-btn">复制内容</Button>
            <Button type="button" variant="secondary" onClick={() => onShare('wechat')} className="report-action-btn">微信</Button>
            <Button type="button" variant="secondary" onClick={() => onShare('weibo')} className="report-action-btn">微博</Button>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={onClose} className="report-action-btn report-sheet-cancel">取消</Button>
      </div>
    </div>
  );
}
