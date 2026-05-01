import { ChatFeedbackCard as FeedbackCard, ChatQuickActionButton as QuickActionButton } from '../business';

export function ConversationEmptyState({
  onQuickAction,
}: {
  onQuickAction: (text: string, autoSend?: boolean) => void;
}) {
  const cards = [
    {
      title: '表达关注',
      description: '告诉系统你想持续追踪什么，不用先进入配置页。',
      action: '我想关注 AI 和远程工作',
    },
    {
      title: '配置系统',
      description: '直接用一句话调整简报时间或关注领域，确认后写入系统配置。',
      action: '以后每天早上 8 点发简报',
    },
    {
      title: '表达行动',
      description: '直接把一句话变成待办，后续去行动页继续推进。',
      action: '明天提醒我投简历',
    },
    {
      title: '表达想法',
      description: '把零散感受及时记下，之后会进入日志与成长回看。',
      action: '今天突然想到，AI 发展太快了，有点焦虑',
    },
  ];

  return (
    <div className="chat-empty-state-grid">
      {cards.map((item) => (
        <FeedbackCard key={item.title} label={item.title} tone="plain" className="chat-block chat-block-empty">
          <div className="chat-empty-card-grid">
            <div className="chat-summary-text">
              {item.description}
            </div>
            <div className="chat-confirm-origin">
              示例：{item.action}
            </div>
            <div>
              <QuickActionButton text="直接用这句" onClick={() => onQuickAction(item.action, true)} />
            </div>
          </div>
        </FeedbackCard>
      ))}
    </div>
  );
}
