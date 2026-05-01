import type { ReportExportFormat } from './contracts';

export const REPORT_EXPORT_FORMATS: Array<{
  id: ReportExportFormat;
  label: string;
  desc: string;
}> = [
  { id: 'markdown', label: 'Markdown', desc: '适合笔记软件' },
  { id: 'html', label: 'HTML', desc: '适合网页展示' },
  { id: 'text', label: '纯文本', desc: '适合复制粘贴' },
];

