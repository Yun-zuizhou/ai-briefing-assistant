import { EditorialIcon } from './EditorialIcon';
import { EditorialMasthead } from './EditorialMasthead';
import { PaperButton } from './PaperButton';
import { StatusBadge } from './StatusBadge';

const todayNav = [
  { label: '重点', meta: '1 条' },
  { label: '知道', meta: '3 条' },
  { label: '线索', meta: '2 条' },
  { label: '关注', meta: '2 组' },
  { label: '速记', meta: '入口' },
];

const knowingItems = [
  {
    source: 'AI DESK',
    title: 'AI 应用开发岗位继续增长',
    summary: '招聘信息集中在工具链集成、内容自动化和行业应用落地，适合继续追踪。'
  },
  {
    source: 'REMOTE WORK',
    title: '远程机会向运营和数据岗位扩散',
    summary: '远程职位不只集中在技术岗，内容运营、数据标注和跨境支持也在增加。'
  },
];

const clueItems = [
  { label: '可转待办', title: '筛选 3 个 AI 工具链岗位', source: '来自岗位简报', reason: '信息已足够明确，适合进入待办页' },
  { label: '可继续追踪', title: '把“远程 + AI”加入明日关注词', source: '来自对话摘要', reason: '保持在简报关注池，不在 Today 内执行' },
];

export function EditorialTodaySample({ className = '' }: { className?: string }) {
  return (
    <section className={`editorial-today-sample ${className}`.trim()} aria-label="Today 简报样张">
      <EditorialMasthead
        variant="front"
        title="今日简报"
        eyebrow="TODAY BRIEFING"
        edition="VOL. 04"
        meta={['AI DESK', 'APRIL 2026']}
        dek="Today 只负责呈现今日值得看的信息，并把行动线索交给待办页处理。"
      />

      <nav className="editorial-today-nav" aria-label="Today 样张栏目">
        {todayNav.map((item) => (
          <button type="button" key={item.label}>
            <span>{item.label}</span>
            <em>{item.meta}</em>
          </button>
        ))}
      </nav>

      <article className="editorial-today-lead">
        <div className="editorial-today-lead-kicker">
          <span><EditorialIcon name="briefing" size={18} />今天先看</span>
          <StatusBadge label="今日重点" tone="neutral" />
        </div>
        <h3>AI 远程岗位正在从技术岗扩散到内容和运营岗位</h3>
        <p>
          今天的简报建议先追踪 AI 工具链岗位，再把远程内容运营和数据标注机会纳入关注范围。
        </p>
        <div className="editorial-today-lead-actions">
          <PaperButton active>打开内容</PaperButton>
          <PaperButton>继续追问</PaperButton>
          <PaperButton>加入关注</PaperButton>
        </div>
      </article>

      <div className="editorial-today-focus" aria-label="今日摘要统计">
        <div><strong>3</strong><span>可看</span></div>
        <div><strong>2</strong><span>线索</span></div>
        <div><strong>2</strong><span>相关</span></div>
      </div>

      <section className="editorial-today-section">
        <div className="editorial-today-section-head">
          <span>值得知道的</span>
          <em>KNOWING</em>
        </div>
        <div className="editorial-today-list">
          {knowingItems.map((item) => (
            <article className="editorial-today-news" key={item.title}>
              <span>{item.source}</span>
              <h4>{item.title}</h4>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="editorial-today-section">
        <div className="editorial-today-section-head">
          <span>可转待办的线索</span>
          <em>HANDOFF</em>
        </div>
        <div className="editorial-today-action-list">
          {clueItems.map((item) => (
            <article className="editorial-today-action" key={item.title}>
              <div>
                <span>{item.label}</span>
                <em>{item.source}</em>
              </div>
              <h4>{item.title}</h4>
              <p>{item.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="editorial-today-note">
        <EditorialIcon name="send" size={20} tone="secondary" />
        <span>记下今天最值得以后回看的那句话</span>
        <PaperButton>速记</PaperButton>
      </div>
    </section>
  );
}
