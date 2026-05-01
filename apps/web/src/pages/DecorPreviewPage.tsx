import { useEffect, useState } from 'react';
import { Newspaper, MessageCircle } from 'lucide-react';
import '../styles/bookish-decor.css';
import {
  BookishSymbol,
  BookishIcon,
  BookishIconWrapper,
  EditorialIcon,
  EditorialMasthead,
  EditorialStateMatrix,
  EditorialChatSample,
  EditorialTodaySample,
  EditorialPageReframeSample,
  BookishLabel,
  MetaText,
  QuoteBlock,
  SectionHeader,
  BookishCard,
  PaperSheet,
  StitchDivider,
  OrnamentDivider,
  BindingDots,
  PaperButton,
  BookishChip,
  ChipGroup,
  StatusBadge,
  BookishCheckbox,
  BookishRadio,
  BookishToggle,
  SystemBriefCard,
} from '../components/decor/preview';

/* ───── 预览区块 ───── */

function Block({ id, label, note, children }: { id?: string; label: string; note?: string; children: React.ReactNode }) {
  const headingId = id ? `${id}-title` : undefined;

  return (
    <section id={id} className="preview-decor-block" aria-labelledby={headingId}>
      <div className="preview-decor-label">
        <h2 id={headingId}>{label}</h2>
        {note ? <span className="preview-decor-note">{note}</span> : null}
      </div>
      <div className="preview-decor-body">{children}</div>
    </section>
  );
}

const referenceIcons = [
  { name: 'chevron-diamond', label: '进入', role: '展开简报条目' },
  { name: 'lantern', label: '提醒', role: '今日节点提示' },
  { name: 'scroll', label: '简报', role: '文档 / 记录' },
  { name: 'inbox', label: '收件', role: '归档 / 收纳' },
] as const;

const designSteps = [
  '先锁定产品主轴：核心功能是 AI 简报，视觉主语是复古报刊与编辑部排版。',
  '国风元素只保留为菱形、星点、灯笼等小型辅助符号，不承担页面主视觉。',
  '图标遵循零容错规则：24x24、2px、单线描边、圆角、固定色值、禁止自由发挥。',
  '组件从报头、分隔线、摘要卡、工具图标开始沉淀，再逐步迁移到 Chat 与 Today。',
];

const designPrinciples = [
  { label: '主视觉', value: '复古报刊 / AI 简报 / 编辑部排版' },
  { label: '辅助元素', value: '菱形、星点、灯笼、书卷等小型符号' },
  { label: '内容原则', value: '信息秩序优先，装饰只服务结构' },
  { label: '移动定位', value: '360-430px 竖屏优先，桌面仅作预览' },
];

const iconRules = [
  '24x24 标准画布，图形居中，四周保留安全边距。',
  '功能图标只用 2px 单线描边，round cap / round join。',
  '主线色固定 #8B5A2B，背景固定 #F7F3EB，禁止新增色值。',
  '禁止填充、渐变、阴影、高光、纹理、3D、透视和复杂装饰。',
];

const mastheadSpecs = [
  { variant: 'front', label: '完全体', size: '32px', use: '页面首屏 / Today 主入口', state: '可转 compact' },
  { variant: 'section', label: '标准体', size: '29px', use: '页面内模块 / 对话摘要', state: '静态' },
  { variant: 'compact', label: '缩略体', size: '20px', use: '二级页 / 卡片 / sticky 压缩后', state: '转化终点' },
] as const;

const previewNavSections = [
  { href: '#preview-status', label: '状态' },
  { href: '#preview-principles', label: '规范' },
  { href: '#preview-candidates', label: '候选' },
  { href: '#preview-samples', label: '样张' },
  { href: '#preview-gate', label: '门禁' },
  { href: '#preview-assets', label: '过渡' },
] as const;

const namingRisks = [
  { name: 'Bookish*', risk: '容易把系统继续带向国风书卷主轴', decision: 'P1 已新增 Editorial* 正式入口，Bookish* 暂作过渡实现层' },
  { name: 'BookishIconSet', risk: '图标数量大且含传统意象，和简报高频图标混杂', decision: 'P1 暂停扩展，后续评估拆分或归档' },
  { name: 'lucide-react', risk: '正式页面大量直连，和自绘图标风格不一致', decision: '短期保留，后续通过 IconWrapper 或自绘替换高频图标' },
];

const editorialIcons = [
  { name: 'briefing', label: '简报' },
  { name: 'inbox', label: '归档' },
  { name: 'chevron-diamond', label: '进入' },
  { name: 'search', label: '搜索' },
  { name: 'refresh', label: '刷新' },
  { name: 'bookmark', label: '收藏' },
  { name: 'send', label: '发送' },
  { name: 'archive', label: '收纳' },
  { name: 'bell', label: '提醒' },
  { name: 'settings', label: '设置' },
  { name: 'close', label: '关闭' },
  { name: 'arrow-left', label: '返回' },
] as const;

const stageStatus = [
  { step: 'S0', label: '结构盘点', status: '完成' },
  { step: 'S1', label: '命名分层', status: '完成' },
  { step: 'S2', label: '组件微调', status: '完成' },
  { step: 'S3', label: '样张一致', status: '完成' },
  { step: 'S4', label: '文档体验', status: '完成' },
  { step: 'S4.5', label: '视觉精修', status: '完成' },
  { step: 'S4.6', label: '字体收口', status: '完成' },
  { step: 'S4.7', label: '图标精修', status: '完成' },
  { step: 'S4.8', label: '报头规格', status: '当前' },
];

const migrationBuckets = [
  { label: '可迁移候选', value: 'EditorialIcon / EditorialMasthead / PaperButton / StatusBadge' },
  { label: '场景候选', value: 'EditorialPageReframeSample / EditorialChatSample / EditorialTodaySample' },
  { label: '暂缓迁移', value: 'BookishChip / Bookish 表单控件 / SystemBriefCard' },
];

const migrationGate = [
  '确认记录页归属于对话页子页，只保留摘要与会话。',
  '确认待办页的信息转行动规则，不让 Today 承接执行。',
  '确认成长页画像与 AI 分析结构，保留时空胶囊扩展位。',
  '确认我的页收束为设置中心，避免和成长页重复。',
  '完成 S5 QA 后再回到 P4 正式页面迁移。',
];

/* ───── 页面 ───── */

export default function DecorPreviewPage() {
  const [chipVal, setChipVal] = useState('关注');
  const [checkA, setCheckA] = useState(true);
  const [checkB, setCheckB] = useState(false);
  const [radioVal, setRadioVal] = useState('a');
  const [toggleOn, setToggleOn] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('decor-preview-scroll');
    return () => {
      document.documentElement.classList.remove('decor-preview-scroll');
    };
  }, []);

  return (
    <div className="preview-decor-page">

      <div className="preview-cover">
        <div className="preview-cover-kicker">
          <span>DAILY BRIEFING SYSTEM</span>
        </div>
        <h1>复古报刊简报组件库</h1>
        <div className="preview-cover-rule">
          <span>Retro Newspaper · Editorial UI · #8B5A2B</span>
        </div>
      </div>

      <section className="preview-artboard" aria-label="书卷风格样张">
        <div className="preview-masthead-sample">
          <div className="preview-newspaper-meta">
            <span>VOL. 04</span>
            <span>AI BRIEFING</span>
            <span>APRIL 2026</span>
          </div>
          <div className="preview-masthead-top">
            <span>✦ EDITORIAL ✦</span>
            <span>BRIEFING DESK</span>
          </div>
          <h2>今日简报</h2>
          <div className="preview-masthead-line">
            <span>信息收集 · 行动转化 · 记录沉淀</span>
          </div>
          <p>
            样张以旧报刊的刊头、细线和栏目标记为主体；国风符号只作为辅助点缀，帮助建立温暖、克制的简报气质。
          </p>
        </div>

        <div className="preview-icon-specimen-row">
          {referenceIcons.map((item) => (
            <div className="preview-icon-specimen" key={item.name}>
              <BookishIcon name={item.name} size={46} tone="primary" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <nav className="preview-section-nav" aria-label="预览页目录">
        {previewNavSections.map((item) => (
          <a href={item.href} key={item.href}>{item.label}</a>
        ))}
      </nav>

      <Block id="preview-status" label="0. 当前状态与迁移看板" note="先看结论，再看组件细节">
        <div className="preview-status-board">
          <div className="preview-stage-strip" aria-label="S0 到 S4.8 阶段状态">
            {stageStatus.map((item) => (
              <div className={item.status === '当前' ? 'is-current' : ''} key={item.step}>
                <strong>{item.step}</strong>
                <span>{item.label}</span>
                <em>{item.status}</em>
              </div>
            ))}
          </div>

          <div className="preview-migration-buckets">
            {migrationBuckets.map((item) => (
              <div className="preview-migration-bucket" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </Block>

      <Block id="preview-principles" label="1. 主轴规范" note="P0 锁定方向">
        <div className="preview-principle-grid">
          {designPrinciples.map((item) => (
            <div className="preview-principle-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </Block>

      <Block label="2. 图标零容错规范" note="功能图标必须遵守">
        <div className="preview-rule-list">
          {iconRules.map((rule, index) => (
            <div className="preview-rule-item" key={rule}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{rule}</p>
            </div>
          ))}
        </div>
      </Block>

      <Block label="3. 命名治理与组件分层" note="Editorial* 为正式候选，Bookish* 为过渡资产">
        <div className="preview-risk-table">
          {namingRisks.map((item) => (
            <div className="preview-risk-row" key={item.name}>
              <strong>{item.name}</strong>
              <span>{item.risk}</span>
              <em>{item.decision}</em>
            </div>
          ))}
        </div>
      </Block>

      {/* ═══════ 1. 基础几何符号 — 12 种 ═══════ */}
      <Block id="preview-candidates" label="4. 正式候选组件：图标与报头" note="EditorialIcon / EditorialMasthead">
        <div className="preview-editorial-sample">
          <EditorialMasthead
            variant="front"
            title="今日简报"
            eyebrow="DAILY BRIEFING"
            edition="VOL. 04"
            meta={['AI DESK', 'APRIL 2026']}
            dek="复古报刊是信息结构，国风符号只做轻量点缀；正式页面后续优先调用 Editorial* 入口。"
          />
        </div>

        <div className="preview-masthead-variants">
          <EditorialMasthead
            variant="section"
            title="对话摘要"
            eyebrow="CHAT DIGEST"
            meta={['SYSTEM', 'LIVE', 'P1']}
            icon="send"
            dek="用于 Chat 页面中承接会话摘要、执行结果和行动建议。"
          />
          <EditorialMasthead
            variant="compact"
            title="资料归档"
            eyebrow="ARCHIVE"
            icon="archive"
          />
        </div>

        <div className="preview-masthead-spec-grid" aria-label="报头体量规格">
          {mastheadSpecs.map((item) => (
            <div className="preview-masthead-spec" key={item.variant}>
              <span>{item.variant}</span>
              <strong>{item.label}</strong>
              <em>{item.size}</em>
              <p>{item.use}</p>
              <small>{item.state}</small>
            </div>
          ))}
        </div>

        <div className="preview-editorial-icon-grid">
          {editorialIcons.map((item) => (
            <div className="preview-editorial-icon-item" key={item.name}>
              <EditorialIcon name={item.name} size={24} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block label="5. 正式候选组件：操作与状态" note="PaperButton / StatusBadge">
        <div className="preview-decor-row">
          <PaperButton active onClick={() => {}}>主按钮</PaperButton>
          <PaperButton onClick={() => {}}>次按钮</PaperButton>
          <PaperButton muted>禁用</PaperButton>
          <StatusBadge label="待处理" tone="pending" />
          <StatusBadge label="已完成" tone="success" />
          <StatusBadge label="进行中" tone="neutral" />
        </div>
      </Block>

      <Block label="6. 正式候选组件：状态矩阵" note="正式候选与探索控件分层展示">
        <EditorialStateMatrix />
      </Block>

      <Block id="preview-samples" label="7. 场景样张：R1-R4 页面重排 v2" note="正式页迁移前置样张 · 不直接改正式页面">
        <EditorialPageReframeSample />
      </Block>

      <Block label="8. 场景样张：Chat" note="先验证组合，不直接迁移 ChatPage">
        <EditorialChatSample />
      </Block>

      <Block label="9. 场景样张：Today 简报" note="只展示信息价值，不承接待办执行">
        <EditorialTodaySample />
      </Block>

      <Block id="preview-gate" label="10. P4 前迁移检查项" note="完成 S5 后再进入正式页面迁移">
        <div className="preview-gate-list">
          {migrationGate.map((item, index) => (
            <div className="preview-gate-item" key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </Block>

      <Block id="preview-assets" label="11. 过渡资产：辅助几何符号" note="只作为报刊排版点缀">
        <div className="preview-decor-row">
          {(['diamond','star','square','triangle-up','triangle-down','circle','hexagon','cross','plus','check','chevron-left','chevron-right'] as const).map((shape) => (
            <div className="preview-decor-item" key={shape}>
              <BookishSymbol shape={shape} size={20} />
              <span>{shape}</span>
            </div>
          ))}
        </div>
        <div className="preview-outline-swatch">
          outline 变体：
          {(['diamond','star','square','circle','hexagon'] as const).map((s) => (
            <span key={s}><BookishSymbol shape={s} size={14} variant="outline" /></span>
          ))}
        </div>
      </Block>

      <BindingDots count={3} gap={40} />

      {/* ═══════ 2. 语义图标 — 20+ ═══════ */}
      <Block label="12. 过渡资产：Bookish 图标包" note="底层 / 模块标识 / 色调验证合并展示">
        <div className="preview-decor-row">
          {(['chevron-diamond','lantern','scroll','inbox','bell','search','refresh','arrow-left','arrow-right','close','more','settings','edit','bookmark'] as const).map((name) => (
            <div className="preview-decor-item" key={name}>
              <BookishIcon name={name} size={22} tone="primary" />
              <span>{name}</span>
            </div>
          ))}
        </div>

        <div className="preview-asset-subgroup">
          <span>模块标识</span>
          <div className="preview-decor-row">
            {(['brief','editorial','complete','dot','corner-mark','section-break'] as const).map((name) => (
              <div className="preview-decor-item" key={name}>
                <BookishIcon name={name} size={22} tone="gold" />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="preview-asset-subgroup">
          <span>色调变体</span>
          <div className="preview-decor-row">
            {(['gold','primary','secondary','faint'] as const).map((tone) => (
              <div className="preview-decor-item" key={tone}>
                <BookishIcon name="bell" size={20} tone={tone} variant="fill" />
                <span>{tone}</span>
              </div>
            ))}
          </div>
        </div>
      </Block>

      <BindingDots count={3} gap={40} />

      {/* ═══════ 3. lucide 适配器 ═══════ */}
      <Block label="13. 过渡资产：Lucide 风格适配器" note="临时补位，不作为主入口">
        <div className="preview-decor-row">
          <div className="preview-decor-item">
            <BookishIconWrapper icon={Newspaper} size={20} tone="primary" />
            <span>primary</span>
          </div>
          <div className="preview-decor-item">
            <BookishIconWrapper icon={Newspaper} size={20} tone="gold" />
            <span>gold</span>
          </div>
          <div className="preview-decor-item">
            <BookishIconWrapper icon={MessageCircle} size={20} tone="secondary" />
            <span>secondary</span>
          </div>
          <div className="preview-decor-item">
            <BookishIconWrapper icon={Newspaper} size={20} tone="faint" />
            <span>faint</span>
          </div>
        </div>
      </Block>

      <OrnamentDivider ornament="star" />

      {/* ═══════ 4. 排版元素 ═══════ */}
      <Block label="14. 过渡资产：排版元素" note="Label / MetaText / QuoteBlock / SectionHeader">
        <div className="preview-decor-stack">
          <BookishLabel text="EDITORIAL" ornament="star" />
          <MetaText items={['14:30', '系统自动生成', 'AI Digest']} />
          <QuoteBlock cite="今日简报">
            AI 相关岗位增长 30%，远程工作机会覆盖 15+ 城市。
          </QuoteBlock>
          <SectionHeader title="对话" subtitle="EDITORIAL" ornament="star" />
        </div>
      </Block>

      <OrnamentDivider ornament="diamond" />

      {/* ═══════ 5. 容器与分隔 ═══════ */}
      <Block label="15. 探索附录：容器与分隔" note="BookishCard / PaperSheet / Divider">
        <BookishCard title="系统简报" ornament="diamond" variant="raised">
          <div style={{ display: 'flex', gap: 12 }}>
            <StitchDivider height={56} />
            <div style={{ flex: 1, fontSize: 14, color: 'var(--bookish-ink-primary)', lineHeight: 1.6 }}>
              AI 岗位增长 30%，远程工作覆盖 15+ 城市。
            </div>
          </div>
          <OrnamentDivider ornament="star" dashed />
          <MetaText items={['14:30', '系统']} />
        </BookishCard>

        <div className="preview-sheet-gap">
        <PaperSheet bordered>
          <BookishLabel text="PAPER TEXTURE" ornament="diamond" />
          <p style={{ fontSize: 13, color: 'var(--bookish-ink-secondary)', lineHeight: 1.7, marginTop: 6 }}>
            宣纸纹理容器，带纤维噪点与可选虚线边框
          </p>
        </PaperSheet>
        </div>
      </Block>

      <OrnamentDivider ornament="star" />

      {/* ═══════ 6. 交互组件 ═══════ */}
      <Block label="16. 探索附录：ChipGroup / BookishChip" note="待评估是否演进为正式 SegmentedTabs">
        <ChipGroup options={['关注', '待办', '想法', '调整']} active={chipVal} onChange={setChipVal} />
        <div className="preview-decor-row" style={{ marginTop: 12 }}>
          <BookishChip label="独立标签" active onClick={() => {}} />
        </div>
      </Block>

      <OrnamentDivider ornament="diamond" dashed />

      {/* ═══════ 7. 表单控件 ═══════ */}
      <Block label="17. 探索附录：表单控件" note="BookishCheckbox / BookishRadio / BookishToggle">
        <div className="preview-decor-stack">
          <div className="preview-decor-row">
            <BookishCheckbox checked={checkA} onChange={setCheckA} label="关注 AI" />
            <BookishCheckbox checked={checkB} onChange={setCheckB} label="远程工作" />
          </div>
          <div className="preview-decor-row">
            <BookishRadio checked={radioVal === 'a'} onChange={() => setRadioVal('a')} label="选项 A" />
            <BookishRadio checked={radioVal === 'b'} onChange={() => setRadioVal('b')} label="选项 B" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookishToggle active={toggleOn} onChange={setToggleOn} />
            <span style={{ fontSize: 13, color: 'var(--bookish-ink-secondary)' }}>
              {toggleOn ? '已开启' : '已关闭'}
            </span>
          </div>
        </div>
      </Block>

      <BindingDots count={3} gap={40} />

      {/* ═══════ 9. 场景组件 ═══════ */}
      <Block label="18. 探索附录：场景组件" note="SystemBriefCard — 实验组合模块">
        <SystemBriefCard
          time="14:30"
          source="系统自动生成"
          content="AI 相关岗位增长 30%，远程工作机会覆盖 15+ 城市。建议关注大模型应用开发与跨境电商运营方向。"
          citation="AI Digest · 今日洞察"
          status="success"
          actions={[
            { label: '查看详情', primary: true, onClick: () => {} },
            { label: '收藏', onClick: () => {} },
            { label: '忽略', onClick: () => {} },
          ]}
        />
        <div style={{ marginTop: 12 }}>
          <SystemBriefCard
            time="15:02"
            content="你今天记录了 3 条想法，完成 2 项待办。继续保持！"
            status="pending"
            actions={[
              { label: '去处理', primary: true, onClick: () => {} },
            ]}
          />
        </div>
      </Block>

      <OrnamentDivider ornament="star" dashed />

      <Block label="19. 探索附录：设计过程" note="从简报主轴到辅助图标">
        <div className="preview-process-list">
          {designSteps.map((step, index) => (
            <div className="preview-process-item" key={step}>
              <span className="preview-process-index">{String(index + 1).padStart(2, '0')}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </Block>

      <div style={{ height: 56 }} />
    </div>
  );
}
