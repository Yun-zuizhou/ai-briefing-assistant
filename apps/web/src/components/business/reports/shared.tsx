import { Download, Share2 } from 'lucide-react';

import { Button } from '../../ui';

export function ReportActionBar({
  buttonClassName = 'report-action-btn font-sans-cn',
  className,
  exportLabel,
  iconClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  shareLabel,
  onOpenExport,
  onOpenShare,
}: {
  buttonClassName?: string;
  className: string;
  exportLabel: string;
  iconClassName?: string;
  primaryButtonClassName?: string;
  secondaryButtonClassName?: string;
  shareLabel: string;
  onOpenExport: () => void;
  onOpenShare: () => void;
}) {
  return (
    <div className={`report-actions ${className}`}>
      <Button type="button" variant="primary" className={primaryButtonClassName ?? buttonClassName} onClick={onOpenExport}>
        <Download size={16} className={iconClassName} />
        {exportLabel}
      </Button>
      <Button type="button" variant="secondary" className={secondaryButtonClassName ?? buttonClassName} onClick={onOpenShare}>
        <Share2 size={16} className={iconClassName} />
        {shareLabel}
      </Button>
    </div>
  );
}
