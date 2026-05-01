import { EditorialIcon } from './EditorialIcon';
import { PaperButton } from './PaperButton';
import { StatusBadge } from './StatusBadge';
import { ChatEditorialHeader, ChatEditorialSurface } from '../chat';

export function EditorialChatSample({ className = '' }: { className?: string }) {
  return (
    <section className={`editorial-chat-sample ${className}`.trim()} aria-label="复古报刊简报 Chat 样张">
      <ChatEditorialHeader
        view="conversation"
        mastheadState="compact"
        onViewChange={() => {}}
        onNewSession={() => {}}
        density="sample"
      />

      <ChatEditorialSurface>
        <div className="editorial-chat-thread">
          <div className="editorial-chat-row editorial-chat-row--user">
            <div className="editorial-chat-bubble editorial-chat-bubble--user">
              帮我整理今天 AI 岗位和远程工作相关的信息，给出可以行动的重点。
            </div>
          </div>

          <div className="editorial-chat-row editorial-chat-row--assistant">
            <div className="editorial-chat-bubble editorial-chat-bubble--assistant">
              <div className="editorial-chat-brief-head">
                <span><EditorialIcon name="briefing" size={18} />本轮简报</span>
                <StatusBadge label="已生成" tone="success" />
              </div>
              <p>
                AI 应用开发岗位继续增长，远程机会集中在内容运营、数据标注和跨境电商方向。本轮会话可在“记录”子页生成摘要，并保留完整会话。
              </p>
              <div className="editorial-chat-action-row">
                <PaperButton active>生成摘要</PaperButton>
                <PaperButton>查看记录</PaperButton>
                <PaperButton>继续追问</PaperButton>
              </div>
            </div>
          </div>

          <div className="editorial-chat-row editorial-chat-row--assistant">
            <div className="editorial-chat-bubble editorial-chat-bubble--assistant editorial-chat-bubble--pending">
              <div className="editorial-chat-brief-head">
                <span><EditorialIcon name="bell" size={18} />可转行动</span>
                <StatusBadge label="待处理" tone="pending" />
              </div>
              <p>是否把“AI 远程岗位”加入明日简报关注词？确认后进入待办页处理。</p>
            </div>
          </div>
        </div>
      </ChatEditorialSurface>

      <div className="editorial-chat-inputbar">
        <EditorialIcon name="search" size={18} tone="secondary" />
        <span>继续补充你的简报需求</span>
        <button type="button" aria-label="发送">
          <EditorialIcon name="send" size={18} />
        </button>
      </div>
    </section>
  );
}
