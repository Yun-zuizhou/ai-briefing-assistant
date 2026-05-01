export function formatIntentLabel(intent: string) {
  switch (intent) {
    case 'create_todo':
      return '记成待办';
    case 'record_thought':
      return '记成记录';
    case 'fragmented_thought':
      return '记成碎片';
    case 'chat_only':
      return '仅聊天';
    case 'add_interest':
      return '更新关注';
    case 'remove_interest':
      return '移除关注';
    case 'set_push_time':
      return '调整推送时间';
    default:
      return intent;
  }
}

export function formatComposeModeLabel(mode: string) {
  switch (mode) {
    case 'smart':
      return '智能判断';
    case 'create_todo':
      return '待办模式';
    case 'record_thought':
      return '记录模式';
    case 'fragmented_thought':
      return '碎片模式';
    case 'chat_only':
      return '仅聊天';
    default:
      return formatIntentLabel(mode);
  }
}
