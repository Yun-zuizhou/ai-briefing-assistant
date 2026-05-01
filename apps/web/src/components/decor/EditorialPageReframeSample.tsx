import { EditorialIcon } from './EditorialIcon';
import { EditorialMasthead } from './EditorialMasthead';
import { PaperButton } from './PaperButton';
import { StatusBadge } from './StatusBadge';

const sessionRows = [
  { title: 'AI 岗位与远程工作整理', meta: '04-29 14:20 · 18 条消息', status: '已摘要' },
  { title: '小红书选题复盘', meta: '04-28 21:10 · 9 条消息', status: '待摘要' },
  { title: '毕业设计资料梳理', meta: '04-27 16:45 · 12 条消息', status: '已摘要' },
];

const actionInfos = [
  { source: '来自收藏', title: 'AI 工具链岗位清单', action: '筛出 3 个可投递岗位' },
  { source: '来自对话', title: '远程工作关键词', action: '加入明日简报关注词' },
];

const todoRows = [
  { level: '高', title: '整理 AI 远程岗位候选清单', meta: '今日 · 来自对话' },
  { level: '中', title: '回看小红书评论线索', meta: '明日 · 来自收藏' },
  { level: '低', title: '补充毕业设计材料引用', meta: '未来 · 手动' },
];

const growthSignals = ['AI 工具链', '远程机会', '内容运营', '毕业设计'];

function WireTabs({ items }: { items: Array<{ label: string; active?: boolean }> }) {
  return (
    <div className="editorial-reframe-tabs" role="tablist" aria-label="样张切换">
      {items.map((item) => (
        <button
          type="button"
          role="tab"
          key={item.label}
          className={item.active ? 'is-active' : ''}
          aria-selected={item.active ? 'true' : 'false'}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function WireSection({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section className="editorial-reframe-section">
      <div className="editorial-reframe-section-head">
        <span>{title}</span>
        {aside ? <em>{aside}</em> : null}
      </div>
      {children}
    </section>
  );
}

function ChatRecordsFrame() {
  return (
    <article className="editorial-reframe-phone" aria-label="对话记录子页 v2 样张">
      <EditorialMasthead
        variant="compact"
        title="对话记录"
        eyebrow="CHAT RECORDS"
        icon="send"
      />

      <WireTabs items={[{ label: '对话' }, { label: '记录', active: true }]} />
      <WireTabs items={[{ label: '摘要', active: true }, { label: '会话' }]} />

      <div className="editorial-reframe-migration">
        <StatusBadge label="可迁移：记录子页结构" tone="success" />
        <StatusBadge label="待确认：摘要生成入口" tone="pending" />
      </div>

      <WireSection title="对话摘要卡" aside="C0">
        <div className="editorial-reframe-card editorial-reframe-summary-card">
          <div className="editorial-reframe-card-top">
            <span>AI 岗位与远程工作整理</span>
            <StatusBadge label="已生成" tone="success" />
          </div>
          <p>本次对话确认了 3 个岗位方向、2 个后续动作，以及明日需要继续追踪的关键词。</p>
          <ul className="editorial-reframe-bullets">
            <li>要点：AI 工具链岗位继续增长</li>
            <li>决策：先筛选高匹配远程岗位</li>
            <li>待跟进：明日自动简报继续追踪</li>
          </ul>
          <button type="button" className="editorial-reframe-fold">
            依据片段 · 折叠展示
          </button>
          <div className="editorial-reframe-link-row">
            <span>2 条行动建议可转待办</span>
            <PaperButton>查看来源</PaperButton>
          </div>
        </div>
      </WireSection>

      <WireSection title="最近已摘要会话">
        <div className="editorial-reframe-list">
          {sessionRows.slice(0, 2).map((item) => (
            <div className="editorial-reframe-list-row" key={item.title}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </div>
              <em>{item.status}</em>
            </div>
          ))}
        </div>
      </WireSection>

      <WireSection title="会话 Tab 结构" aside="不作为第三功能">
        <div className="editorial-reframe-search">搜索关键词 / 日期</div>
        <div className="editorial-reframe-chipline">
          <span>全部</span>
          <span>本周</span>
          <span>有摘要</span>
        </div>
      </WireSection>
    </article>
  );
}

function ActionsFrame() {
  return (
    <article className="editorial-reframe-phone" aria-label="待办页 v2 样张">
      <EditorialMasthead
        variant="compact"
        title="待办"
        eyebrow="ACTION DESK"
        icon="bell"
      />

      <div className="editorial-reframe-migration">
        <StatusBadge label="可迁移：行动卡" tone="success" />
        <StatusBadge label="待确认：信息转待办规则" tone="pending" />
      </div>

      <WireSection title="今天先推进这 1 件" aside="主行动">
        <div className="editorial-reframe-card editorial-reframe-action-card">
          <div className="editorial-reframe-source">
            <span>来源：对话</span>
            <span>截止 今日</span>
          </div>
          <h3>整理 AI 远程岗位候选清单</h3>
          <p>现在做的原因：已经有收藏来源和对话判断，适合转成实际投递准备。</p>
          <div className="editorial-reframe-actions">
            <PaperButton active>完成</PaperButton>
            <PaperButton>延后</PaperButton>
            <PaperButton>来源</PaperButton>
          </div>
        </div>
      </WireSection>

      <WireSection title="可转行动的信息" aside="最多 2 条">
        <div className="editorial-reframe-info-list">
          {actionInfos.map((item) => (
            <div className="editorial-reframe-info-card" key={item.title}>
              <span>{item.source}</span>
              <strong>{item.title}</strong>
              <p>{item.action}</p>
              <div className="editorial-reframe-mini-actions">
                <button type="button">转成待办</button>
                <button type="button">忽略</button>
                <button type="button">来源</button>
              </div>
            </div>
          ))}
        </div>
      </WireSection>

      <WireSection title="待办事项">
        <WireTabs items={[{ label: '今日', active: true }, { label: '未来' }, { label: '已完成' }]} />
        <div className="editorial-reframe-list">
          {todoRows.map((item) => (
            <div className="editorial-reframe-list-row" key={item.title}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </div>
              <em>{item.level}</em>
            </div>
          ))}
        </div>
      </WireSection>

      <WireSection title="后续跟进">
        <div className="editorial-reframe-muted-row">明日 10:00 · 继续检查岗位更新</div>
      </WireSection>
    </article>
  );
}

function GrowthFrame() {
  return (
    <article className="editorial-reframe-phone" aria-label="成长页 v2 样张">
      <EditorialMasthead
        variant="compact"
        title="成长"
        eyebrow="GROWTH REVIEW"
        icon="briefing"
      />

      <div className="editorial-reframe-migration">
        <StatusBadge label="可迁移：画像概览" tone="success" />
        <StatusBadge label="待确认：时空胶囊" tone="pending" />
      </div>

      <WireSection title="用户画像概览">
        <div className="editorial-reframe-profile">
          <div className="editorial-reframe-avatar">我</div>
          <div>
            <strong>持续探索者</strong>
            <span>已有 126 条记录 · 8 条近期回看 · 4 个稳定兴趣</span>
          </div>
        </div>
      </WireSection>

      <WireSection title="一句话画像">
        <div className="editorial-reframe-card">
          <p>你正在从“收集信息”转向“把信息转成持续行动和可回看的判断”。</p>
          <PaperButton>查看画像详情</PaperButton>
        </div>
      </WireSection>

      <WireSection title="AI 分析摘要">
        <div className="editorial-reframe-analysis">
          <div><strong>本周变化</strong><span>行动类记录明显增加</span></div>
          <div><strong>当前判断</strong><span>更关注 AI 工具链与远程机会</span></div>
          <div><strong>建议观察</strong><span>未来一周继续验证岗位质量</span></div>
        </div>
      </WireSection>

      <WireSection title="画像证据">
        <div className="editorial-reframe-chipline">
          {growthSignals.map((item) => <span key={item}>{item}</span>)}
        </div>
      </WireSection>

      <WireSection title="时空胶囊">
        <div className="editorial-reframe-capsule">
          <EditorialIcon name="archive" size={18} />
          <span>预留槽：给未来自己的阶段留言</span>
        </div>
      </WireSection>
    </article>
  );
}

function MyFrame() {
  return (
    <article className="editorial-reframe-phone" aria-label="我的页 v2 样张">
      <EditorialMasthead
        variant="compact"
        title="我的"
        eyebrow="SETTINGS"
        icon="settings"
      />

      <div className="editorial-reframe-migration">
        <StatusBadge label="可迁移：设置分组" tone="success" />
        <StatusBadge label="待确认：账号状态卡" tone="pending" />
      </div>

      <WireSection title="账号状态卡">
        <div className="editorial-reframe-profile">
          <div className="editorial-reframe-avatar">M</div>
          <div>
            <strong>用户</strong>
            <span>user@example.com</span>
          </div>
          <PaperButton>设置</PaperButton>
        </div>
      </WireSection>

      <WireSection title="系统设置">
        <div className="editorial-reframe-settings">
          <button type="button">设置<span>通知、推送时间和基础偏好</span></button>
          <button type="button">AI 服务设置<span>摘要生成与模型服务偏好</span></button>
          <button type="button">通知偏好<span>提醒频率与接收方式</span></button>
        </div>
      </WireSection>

      <WireSection title="支持">
        <div className="editorial-reframe-settings">
          <button type="button">帮助反馈<span>常见问题与意见提交</span></button>
          <button type="button">关于<span>版本与产品说明</span></button>
        </div>
      </WireSection>

      <WireSection title="账号与安全">
        <div className="editorial-reframe-danger-row">
          <span>当前账号已登录</span>
          <button type="button">退出登录</button>
        </div>
      </WireSection>
    </article>
  );
}

export function EditorialPageReframeSample({ className = '' }: { className?: string }) {
  return (
    <section className={`editorial-reframe-sample ${className}`.trim()} aria-label="核心页面重排 v2 低保真样张">
      <div className="editorial-reframe-brief">
        <EditorialMasthead
          variant="section"
          title="核心页面重排 v2"
          eyebrow="IA REFRAME"
          meta={['LOW-FI', 'P4 BLOCKER', 'MOBILE FIRST']}
          icon="archive"
          dek="本样张只验证现有模块迁移后的结构：对话记录、待办、成长、我的。正式页面迁移仍等待低保真确认。"
        />
        <div className="editorial-reframe-rules">
          <span>对话页无历史一级 Tab</span>
          <span>记录只含摘要 / 会话</span>
          <span>待办首屏最多 2 条可转行动信息</span>
        </div>
      </div>

      <div className="editorial-reframe-grid">
        <ChatRecordsFrame />
        <ActionsFrame />
        <GrowthFrame />
        <MyFrame />
      </div>
    </section>
  );
}
