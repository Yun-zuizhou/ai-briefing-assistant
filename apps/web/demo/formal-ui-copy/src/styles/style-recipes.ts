import type { CSSProperties } from 'react';

export interface StyleRecipe {
  id:
    | 'masthead_editorial'
    | 'section_heading'
    | 'paper_panel'
    | 'paper_panel_inset'
    | 'content_card'
    | 'action_card'
    | 'empty_state_card'
    | 'eyebrow_meta'
    | 'body_copy'
    | 'supporting_copy'
    | 'primary_action_button'
    | 'secondary_action_button'
    | 'tag_pill'
    | 'stats_tile'
    | 'message_bubble_assistant'
    | 'message_bubble_user';
  name: string;
  summary: string;
  characteristics: string[];
  currentUsage: string[];
  style?: CSSProperties;
}

export const styleRecipes: StyleRecipe[] = [
  {
    id: 'masthead_editorial',
    name: '报头编辑样式',
    summary: '复古报纸式报头，强调页面身份而不是功能操作。',
    characteristics: [
      '暖纸底色 paper-warm',
      '衬线大标题',
      'ornament + divider + meta 三段式',
      '底部 2px 深色分隔线',
    ],
    currentUsage: [
      'components/layout/PageLayout.tsx -> Masthead',
      'TodayPage / GrowthPage / MyPage / ChatPage',
      'SecondaryHeader 变体用于详情页',
    ],
  },
  {
    id: 'section_heading',
    name: '区块标题样式',
    summary: '左侧竖条 + 大写感标题，用来切分页面内容层。',
    characteristics: [
      'section-header 水平两端布局',
      'section-title 前置 accent 竖条',
      '标题字重高于正文',
      'section-more 作为弱操作入口',
    ],
    currentUsage: [
      'TodayPage',
      'GrowthPage',
      'MyPage',
      'SettingsPage / NotificationSettingsPage',
    ],
  },
  {
    id: 'paper_panel',
    name: '暖纸面板',
    summary: '最常见的页面承载盒，承担说明、概览、表单分组等内容。',
    characteristics: [
      'background: paper-warm',
      '1px border',
      '14px 内边距为主',
      '通常和正文 13px/14px 搭配',
    ],
    currentUsage: [
      'TodayPage 推荐区 / 今日速记',
      'ChatPage FeedbackCard',
      'GrowthPage / MyPage 多个信息盒',
      'AiProviderSettingsPage / AboutPage / PreviewPage',
    ],
    style: {
      padding: '14px',
      background: 'var(--paper-warm)',
      border: '1px solid var(--border)',
    },
  },
  {
    id: 'paper_panel_inset',
    name: '带内框摘要面板',
    summary: '在暖纸面板上再加一层虚线内框，用于“总述/摘要”类块。',
    characteristics: [
      '外层暖纸盒',
      '内层 inset 虚线边框',
      '标题、摘要、动作按钮三段式',
    ],
    currentUsage: [
      'TodayPage 今日总述',
    ],
  },
  {
    id: 'content_card',
    name: '内容列表卡',
    summary: '承载文章、推荐、收藏、历史项等条目型内容。',
    characteristics: [
      'paper 或 paper-warm 底色',
      '1px border',
      '12px~14px padding',
      '上部眉标 + 主标题 + 辅助摘要',
    ],
    currentUsage: [
      'TodayPage 推荐条目 / 值得知道 / 值得行动',
      'ActionsPage 收藏待处理 / 后续跟进',
      'AiDigestLabPage 列表项',
      'ArticlePage 相关推荐',
    ],
    style: {
      padding: '14px',
      background: 'var(--paper)',
      border: '1px solid var(--border)',
      cursor: 'pointer',
    },
  },
  {
    id: 'action_card',
    name: '行动型内容卡',
    summary: '在内容卡基础上增加回报/截止/按钮，偏任务转化。',
    characteristics: [
      '暖纸底而非纯纸底',
      '右下角附带次级动作按钮',
      '上部展示 actionType / deadline',
    ],
    currentUsage: [
      'TodayPage 值得行动的',
      'ActionsPage 待办事项',
    ],
  },
  {
    id: 'empty_state_card',
    name: '空状态卡',
    summary: '当前大量页面沿用了重卡片式空状态。',
    characteristics: [
      'domain-card 容器',
      'textAlign center',
      '24px padding',
      '主文案 13px~14px，辅文案 12px',
    ],
    currentUsage: [
      'TodayPage 空内容提示',
      'ActionsPage 空待办 / 空收藏 / 空跟进',
      'Report pages 空报告提示',
    ],
  },
  {
    id: 'eyebrow_meta',
    name: '眉标元信息',
    summary: '用于来源、标签、状态、时间等次级信息。',
    characteristics: [
      '常用 11px / 12px',
      'accent 用于标签型来源',
      'ink-muted 用于时间/辅助说明',
      '大多位于卡片顶部或标题旁',
    ],
    currentUsage: [
      'TodayPage 所有卡片头部',
      'GrowthPage 历史回顾',
      'ArticlePage 元信息条',
      'Settings / Notification 页面分组说明',
    ],
  },
  {
    id: 'body_copy',
    name: '正文拷贝样式',
    summary: '主内容说明文字，承担解释和总结。',
    characteristics: [
      '常用 13px / 14px / 15px',
      'lineHeight 1.6 ~ 1.8',
      'ink / ink-light 为主',
    ],
    currentUsage: [
      'TodayPage summaryText',
      'GrowthPage weeklySummary / personaSummary',
      'ArticlePage 内容与 AI 摘要',
      'Report pages 长文段落',
    ],
  },
  {
    id: 'supporting_copy',
    name: '辅助说明文字',
    summary: '空状态说明、帮助文案、风险说明等轻量文案。',
    characteristics: [
      '常用 12px',
      'ink-muted',
      'lineHeight 1.6 ~ 1.8',
    ],
    currentUsage: [
      'TodayPage 空状态文案',
      'MyPage / GrowthPage 辅助说明',
      'AiProviderSettingsPage / HelpFeedbackPage',
    ],
  },
  {
    id: 'primary_action_button',
    name: '主操作按钮',
    summary: '深色或 accent 色块按钮，承担强操作。',
    characteristics: [
      '背景为 ink 或 accent',
      '白色文字',
      '12px 左右字号',
      '主要出现在转化动作处',
    ],
    currentUsage: [
      'TodayPage 记录一个想法 / 去记录 / 转成待办',
      'MyPage 进入成长页',
      'ArticlePage 打开原文 / 行动入口',
      'Report pages 导出 / 分享',
    ],
  },
  {
    id: 'secondary_action_button',
    name: '次操作按钮',
    summary: '浅底描边按钮，承担弱操作或返回类动作。',
    characteristics: [
      'paper 背景',
      '1px 或 2px 描边',
      'ink 文字',
    ],
    currentUsage: [
      'TodayPage 查看全部内容',
      'MyPage 退出登录',
      'ArticlePage 收藏 / 分享',
      '弹窗中的取消按钮',
    ],
  },
  {
    id: 'tag_pill',
    name: '标签胶囊',
    summary: '深色高对比标签，目前承担兴趣词、关键词、风险点等。',
    characteristics: [
      'tag 类名',
      '深底浅字',
      '有 2px 阴影偏移',
      '偏装饰，存在感强',
    ],
    currentUsage: [
      'TodayPage 推荐兴趣标签',
      'GrowthPage / MyPage 关键词',
      'ProfilePage / AiDigestLabPage 标签群',
    ],
  },
  {
    id: 'stats_tile',
    name: '统计数字砖块',
    summary: '小型数字摘要块，承载数量型信息。',
    characteristics: [
      'paper-warm 底色',
      '1px 边框',
      '数字 20px 粗体',
      '标签 11px muted',
    ],
    currentUsage: [
      'MyPage 真实记录 / 近期回看',
      'GrowthPage 顶部摘要区',
      'Report pages overview 数值块',
    ],
  },
  {
    id: 'message_bubble_assistant',
    name: '助手消息气泡',
    summary: 'Chat 中的系统消息承载块。',
    characteristics: [
      'paper-warm 背景',
      '1px border',
      '左上装饰菱形',
      '内部还有状态标签 / 二级块',
    ],
    currentUsage: [
      'ChatPage MessageItem assistant',
      'ChatPage typing bubble',
    ],
  },
  {
    id: 'message_bubble_user',
    name: '用户消息气泡',
    summary: 'Chat 中的用户消息承载块。',
    characteristics: [
      'accent 背景',
      '白色正文',
      '2px 偏移阴影',
    ],
    currentUsage: [
      'ChatPage MessageItem user',
    ],
  },
];

export const styleRecipeUsageMap = Object.fromEntries(
  styleRecipes.map((recipe) => [recipe.id, recipe.currentUsage]),
) as Record<StyleRecipe['id'], string[]>;

