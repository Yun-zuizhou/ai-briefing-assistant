export function MessageBody({ content, isUser }: { content: string; isUser: boolean }) {
  return (
    <div className={`chat-message-body ${isUser ? 'user' : 'assistant'}`}>
      <div className={`chat-message-text ${isUser ? 'user' : 'assistant'}`}>
        {content}
      </div>
    </div>
  );
}
