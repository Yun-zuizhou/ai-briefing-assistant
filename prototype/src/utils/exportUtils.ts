import { weeklyReportData } from '../data/reportSeeds';

export interface ExportOptions {
  format: 'markdown' | 'html' | 'text';
  range: 'today' | 'week' | 'month';
}

export interface ShareOptions {
  content: 'full' | 'tracking' | 'narrative';
  hideSensitive: boolean;
  method: 'link' | 'wechat' | 'weibo';
}

export function generateWeeklyReportMarkdown(): string {
  const { overview, topicTrends, growth } = weeklyReportData;
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  let markdown = `# 简报助手 · 周报\n\n`;
  markdown += `**时间范围**: ${weekStart.toLocaleDateString('zh-CN')} - ${today.toLocaleDateString('zh-CN')}\n\n`;
  
  markdown += `## 📈 本周概览\n\n`;
  markdown += `| 指标 | 数量 |\n`;
  markdown += `|------|------|\n`;
  markdown += `| 关注 | ${overview.viewed} |\n`;
  markdown += `| 记录 | ${overview.recorded} |\n`;
  markdown += `| 收藏 | ${overview.collected} |\n`;
  markdown += `| 完成 | ${overview.completed} |\n\n`;
  markdown += `🔥 **连续打卡 ${overview.streak} 天**\n\n`;
  
  topicTrends.forEach(trend => {
    markdown += `## ${trend.icon} ${trend.title} · 周趋势\n\n`;
    markdown += `**热度变化**: ${trend.heatData.change > 0 ? '↑' : '↓'}${Math.abs(trend.heatData.change)}%\n\n`;
    markdown += `### 🔥 本周热点\n\n`;
    markdown += `**${trend.hotSpot.title}**\n\n`;
    markdown += `讨论量：${trend.hotSpot.discussionCount}条 | 参与：${trend.hotSpot.userParticipation}条\n\n`;
    markdown += `${trend.hotSpot.summary}\n\n`;
    markdown += `### 💡 趋势洞察\n\n`;
    trend.insights.forEach(insight => {
      markdown += `- ${insight}\n`;
    });
    markdown += `\n`;
  });
  
  markdown += `## 📖 我的成长 · 周回顾\n\n`;
  markdown += `| 指标 | 数量 |\n`;
  markdown += `|------|------|\n`;
  markdown += `| 关注 | ${growth.stats.viewed} |\n`;
  markdown += `| 记录 | ${growth.stats.recorded} |\n`;
  markdown += `| 收藏 | ${growth.stats.collected} |\n`;
  markdown += `| 完成 | ${growth.stats.completed} |\n\n`;
  
  if (growth.selectedThoughts.length > 0) {
    markdown += `### 💭 本周想法记录\n\n`;
    growth.selectedThoughts.forEach(thought => {
      markdown += `- **${thought.date}**: "${thought.content}"\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `### 🎯 下周建议\n\n`;
  growth.suggestions.forEach(suggestion => {
    markdown += `- ${suggestion}\n`;
  });
  
  markdown += `\n---\n\n`;
  markdown += `*由简报助手自动生成*\n`;
  
  return markdown;
}

export function generateWeeklyReportHTML(): string {
  const { overview, topicTrends, growth } = weeklyReportData;
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>简报助手 · 周报</title>
  <style>
    body {
      font-family: 'Noto Serif SC', serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #F5F0E6;
      color: #2C2416;
    }
    h1 { text-align: center; border-bottom: 2px solid #A63D2F; padding-bottom: 10px; }
    h2 { color: #A63D2F; border-left: 4px solid #A63D2F; padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #2C2416; padding: 8px; text-align: center; }
    th { background: #2C2416; color: #F5F0E6; }
    .streak { text-align: center; font-size: 1.2em; margin: 15px 0; }
    .footer { text-align: center; color: #8B7D66; margin-top: 30px; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>简报助手 · 周报</h1>
  <p style="text-align: center; color: #8B7D66;">
    ${weekStart.toLocaleDateString('zh-CN')} - ${today.toLocaleDateString('zh-CN')}
  </p>
  
  <h2>📈 本周概览</h2>
  <table>
    <tr><th>关注</th><th>记录</th><th>收藏</th><th>完成</th></tr>
    <tr><td>${overview.viewed}</td><td>${overview.recorded}</td><td>${overview.collected}</td><td>${overview.completed}</td></tr>
  </table>
  <p class="streak">🔥 连续打卡 ${overview.streak} 天</p>
  
  ${topicTrends.map(trend => `
    <h2>${trend.icon} ${trend.title} · 周趋势</h2>
    <p>热度变化: ${trend.heatData.change > 0 ? '↑' : '↓'}${Math.abs(trend.heatData.change)}%</p>
    <h3>🔥 本周热点</h3>
    <p><strong>${trend.hotSpot.title}</strong></p>
    <p>讨论量：${trend.hotSpot.discussionCount}条 | 参与：${trend.hotSpot.userParticipation}条</p>
    <p>${trend.hotSpot.summary}</p>
    <h3>💡 趋势洞察</h3>
    <ul>
      ${trend.insights.map(insight => `<li>${insight}</li>`).join('')}
    </ul>
  `).join('')}
  
  <h2>📖 我的成长 · 周回顾</h2>
  <table>
    <tr><th>关注</th><th>记录</th><th>收藏</th><th>完成</th></tr>
    <tr><td>${growth.stats.viewed}</td><td>${growth.stats.recorded}</td><td>${growth.stats.collected}</td><td>${growth.stats.completed}</td></tr>
  </table>
  
  ${growth.selectedThoughts.length > 0 ? `
    <h3>💭 本周想法记录</h3>
    <ul>
      ${growth.selectedThoughts.map(thought => `<li><strong>${thought.date}</strong>: "${thought.content}"</li>`).join('')}
    </ul>
  ` : ''}
  
  <h3>🎯 下周建议</h3>
  <ul>
    ${growth.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
  </ul>
  
  <p class="footer">由简报助手自动生成</p>
</body>
</html>
  `.trim();
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportWeeklyReport(format: 'markdown' | 'html' | 'text'): void {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  switch (format) {
    case 'markdown':
      downloadFile(
        generateWeeklyReportMarkdown(),
        `周报_${dateStr}.md`,
        'text/markdown'
      );
      break;
    case 'html':
      downloadFile(
        generateWeeklyReportHTML(),
        `周报_${dateStr}.html`,
        'text/html'
      );
      break;
    case 'text':
      downloadFile(
        generateWeeklyReportMarkdown(),
        `周报_${dateStr}.txt`,
        'text/plain'
      );
      break;
  }
}

export function shareWeeklyReport(method: 'link' | 'wechat' | 'weibo'): void {
  const content = generateWeeklyReportMarkdown();
  const encodedContent = encodeURIComponent(content.substring(0, 500) + '...');
  
  switch (method) {
    case 'link':
      navigator.clipboard.writeText(content).then(() => {
        alert('周报内容已复制到剪贴板');
      });
      break;
    case 'wechat':
      alert('请截图后分享到微信');
      break;
    case 'weibo':
      window.open(
        `https://service.weibo.com/share/share.php?title=${encodedContent}`,
        '_blank'
      );
      break;
  }
}

export function generateBriefMarkdown(brief: {
  date: string;
  title: string;
  summary: string;
  stats: { viewed: number; collected: number; recorded: number };
}): string {
  let markdown = `# 简报助手 · ${brief.title}\n\n`;
  markdown += `**日期**: ${brief.date}\n\n`;
  markdown += `## 📊 数据概览\n\n`;
  markdown += `- 关注: ${brief.stats.viewed}\n`;
  markdown += `- 收藏: ${brief.stats.collected}\n`;
  markdown += `- 记录: ${brief.stats.recorded}\n\n`;
  markdown += `## 📋 内容摘要\n\n`;
  markdown += `${brief.summary}\n\n`;
  markdown += `---\n\n*由简报助手自动生成*\n`;
  return markdown;
}

export function exportBrief(brief: {
  date: string;
  title: string;
  summary: string;
  stats: { viewed: number; collected: number; recorded: number };
}, format: 'markdown' | 'html' | 'pdf'): void {
  const dateStr = brief.date.replace(/[年月日]/g, '-').replace(/-+/g, '-').slice(0, -1);
  
  switch (format) {
    case 'markdown':
      downloadFile(
        generateBriefMarkdown(brief),
        `简报_${dateStr}.md`,
        'text/markdown'
      );
      break;
    case 'html':
      downloadFile(
        generateBriefMarkdown(brief),
        `简报_${dateStr}.html`,
        'text/html'
      );
      break;
    case 'pdf':
      {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(generateBriefHTML(brief));
          printWindow.document.close();
          printWindow.print();
        }
      }
      break;
  }
}

function generateBriefHTML(brief: {
  date: string;
  title: string;
  summary: string;
  stats: { viewed: number; collected: number; recorded: number };
}): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${brief.title}</title>
  <style>
    body { font-family: serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>${brief.title}</h1>
  <p style="text-align: center; color: #666;">${brief.date}</p>
  <div class="stats">
    <div class="stat"><div class="stat-value">${brief.stats.viewed}</div><div>关注</div></div>
    <div class="stat"><div class="stat-value">${brief.stats.collected}</div><div>收藏</div></div>
    <div class="stat"><div class="stat-value">${brief.stats.recorded}</div><div>记录</div></div>
  </div>
  <h2>内容摘要</h2>
  <p>${brief.summary}</p>
</body>
</html>
  `.trim();
}

export function shareBrief(brief: {
  date: string;
  title: string;
  summary: string;
}, method: 'link' | 'wechat' | 'weibo'): void {
  const content = `${brief.title}\n${brief.date}\n\n${brief.summary}`;
  const encodedContent = encodeURIComponent(content);
  
  switch (method) {
    case 'link':
      navigator.clipboard.writeText(content).then(() => {
        alert('简报内容已复制到剪贴板');
      });
      break;
    case 'wechat':
      alert('请截图后分享到微信');
      break;
    case 'weibo':
      window.open(
        `https://service.weibo.com/share/share.php?title=${encodedContent}`,
        '_blank'
      );
      break;
  }
}
