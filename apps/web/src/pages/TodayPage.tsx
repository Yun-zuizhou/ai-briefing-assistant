import {
  TodayContentCard,
  TodayEmptyCard,
  TodayErrorState,
  TodayGrid,
  TodayInfoBox,
  TodayLeadCard,
  TodayLoadingState,
} from '../components/business';
import { PaperButton, StatusBadge } from '../components/decor';
import {
  TodayEditorialHeader,
  TodayEditorialSection,
  TodayEditorialShell,
  TodayEditorialSurface,
} from '../components/today';
import { formatDateLabel, getActionTypeLabel, useTodayPageLogic } from './useTodayPageLogic';

export default function TodayPage() {
  const {
    error,
    handleAskAboutBriefing,
    handleAskAboutLead,
    handleCreateTodoFromAction,
    handleExtensionSlotClick,
    handleOpenHotTopics,
    handleOpenLead,
    handleOpenTodo,
    handleQuickNote,
    handleRecommendedContentClick,
    handleWorthActingClick,
    handleWorthKnowingClick,
    informationFlow,
    loading,
    pageData,
  } = useTodayPageLogic();

  return (
    <TodayEditorialShell>
      <TodayEditorialHeader
        title={pageData?.pageTitle ?? '简报'}
        subtitle={pageData?.pageSubtitle ?? '今天你关心的领域发生了什么'}
        edition={formatDateLabel(pageData?.dateLabel) ?? undefined}
        meta={pageData?.aiBriefing?.status === 'success' ? ['AI BRIEFING'] : []}
      />

      <TodayEditorialSurface>
        {error ? (
          <TodayErrorState message={error} />
        ) : null}

        <TodayEditorialSection label="今日内容摘要" sublabel="OVERVIEW" weight="normal">
          <TodayInfoBox className="today-info-box-summary">
            <p className="today-summary-text">{informationFlow.overview.text}</p>
            {informationFlow.overview.statusLabel ? (
              <div className="today-extension-row">
                <StatusBadge
                  label={informationFlow.overview.statusLabel}
                  tone={informationFlow.overview.statusLabel === 'AI 简报已生成' ? 'success' : 'neutral'}
                />
              </div>
            ) : null}
          </TodayInfoBox>
        </TodayEditorialSection>

        <TodayEditorialSection label="头版重点" sublabel="LEAD STORY" weight="lead">
          <TodayLeadCard
            loading={loading}
            kicker={formatDateLabel(pageData?.dateLabel) ?? '今日简报'}
            title={informationFlow.headline.title}
            summary={informationFlow.headline.summary}
            sourceLabel={informationFlow.headline.sourceLabel}
            relevanceLabel={informationFlow.headline.relevanceLabel}
            primaryActionLabel={informationFlow.headline.primaryActionLabel}
            secondaryActionLabel={informationFlow.headline.secondaryActionLabel}
            onPrimaryAction={handleOpenLead}
            onAsk={handleAskAboutLead}
            onSecondaryAction={handleQuickNote}
          />
        </TodayEditorialSection>

        {loading && !pageData ? (
          <TodayLoadingState />
        ) : null}

        {informationFlow.shouldShowContent ? (
          <>
            <TodayEditorialSection label="关注领域报道" sublabel="YOUR INTERESTS" weight="normal">
              <TodayInfoBox className="today-info-box-recommend">
                {informationFlow.groupedReports.length > 0 ? (
                  <div className="today-recommend-groups">
                    {informationFlow.groupedReports.map((group) => (
                      <section className="today-recommend-group" key={group.id}>
                        <div className="today-recommend-group-head">
                          <StatusBadge label={group.title} tone="neutral" />
                        </div>
                        <div className="today-recommend-grid">
                          {group.items.map((topItem) => (
                            <TodayContentCard
                              key={`${group.id}-${topItem.contentRef}`}
                              eyebrow={topItem.display.sourceLabel}
                              title={topItem.title}
                              summary={topItem.summary}
                              meta={null}
                              onClick={() => handleRecommendedContentClick(topItem)}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : informationFlow.auxiliary.hasKnowledgeItems ? (
                  <p className="content-summary">
                    今日关注领域暂无新报道，你可以先浏览精选热点或去对话页调整关注设置。
                  </p>
                ) : (
                  <p className="content-summary">
                    暂无关注领域报道。去对话页告诉我你最近想持续追踪什么，我会把今天的简报收束给你。
                  </p>
                )}
              </TodayInfoBox>
            </TodayEditorialSection>

            <TodayEditorialSection
              label="精选热点"
              sublabel="WORTH KNOWING"
              weight="auxiliary"
            >
              <div className="today-section-action-row">
                <span />
                <PaperButton onClick={handleOpenHotTopics}>查看更多热点</PaperButton>
              </div>
              <TodayGrid>
                {informationFlow.auxiliary.knowledgeItems.map((item) => (
                  <TodayContentCard
                    key={item.id}
                    eyebrow={item.sourceName}
                    title={item.title}
                    summary={item.summary}
                    meta={item.hotScore ? <span className="micro-meta today-knowledge-hot">热度 {item.hotScore}</span> : null}
                    onClick={() => handleWorthKnowingClick(item)}
                    featured={item.featured}
                  />
                ))}
                {!loading && !informationFlow.auxiliary.hasKnowledgeItems ? (
                  <TodayEmptyCard text="当前没有可展示的精选热点。" />
                ) : null}
              </TodayGrid>
            </TodayEditorialSection>

            {informationFlow.extensionSlots.length > 0 ? (
              informationFlow.extensionSlots.map((slot) => {
                const sectionClass = slot.slotType === 'ask' ? 'conversation' : slot.slotType === 'save' ? 'note' : slot.slotType;
                return (
                  <TodayEditorialSection
                    key={slot.slotType}
                    label={slot.title}
                    sublabel={slot.slotType === 'ask' ? 'ASK BRIEFING' : slot.slotType === 'save' ? 'QUICK NOTE' : 'EXTENSION'}
                    weight="auxiliary"
                  >
                    <TodayInfoBox className={`today-info-box-${sectionClass}`}>
                      <p className={`today-${sectionClass}-text`}>{slot.description}</p>
                      <PaperButton onClick={() => handleExtensionSlotClick(slot)}>
                        {slot.actionLabel}
                      </PaperButton>
                    </TodayInfoBox>
                  </TodayEditorialSection>
                );
              })
            ) : (
              <>
                <TodayEditorialSection label="简报速记" sublabel="QUICK NOTE" weight="auxiliary">
                  <TodayInfoBox className="today-info-box-note">
                    <p className="today-note-text">
                      读完这份简报后，先记下一句最值得以后回看的想法。
                    </p>
                    <PaperButton onClick={handleQuickNote}>写速记</PaperButton>
                  </TodayInfoBox>
                </TodayEditorialSection>

                <TodayEditorialSection label="问这份简报" sublabel="ASK BRIEFING" weight="auxiliary">
                  <TodayInfoBox className="today-info-box-conversation">
                    <p className="today-conversation-text">
                      围绕今天的摘要、头版重点和关注报道继续追问。
                    </p>
                    <PaperButton onClick={handleAskAboutBriefing}>进入对话</PaperButton>
                  </TodayInfoBox>
                </TodayEditorialSection>
              </>
            )}

            <TodayEditorialSection label="后续线索" sublabel="HANDOFF" weight="auxiliary">
              <div className="today-section-action-row">
                <span />
                <PaperButton onClick={handleOpenTodo}>查看待办</PaperButton>
              </div>
              <TodayGrid>
                {informationFlow.auxiliary.actionItems.map((item) => (
                  <div
                    key={item.id}
                    className={`content-card today-action-card ${item.featured ? 'featured' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleWorthActingClick(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleWorthActingClick(item);
                      }
                    }}
                  >
                    <div className="today-action-head">
                      <span className="today-action-type">{getActionTypeLabel(item.actionType)}</span>
                      {item.deadline ? <span className="today-action-deadline">截止 {formatDateLabel(item.deadline)}</span> : null}
                    </div>
                    <div className="content-title today-action-title">
                      {item.title}
                    </div>
                    <p className="content-summary today-action-summary">
                      {item.summary ?? '暂无摘要'}
                    </p>
                    <p className="micro-meta today-action-reason">
                      {item.whyRelevant}
                    </p>
                    <div className="today-action-foot">
                      <span className="micro-meta today-action-reward">{item.reward ?? '回报待定'}</span>
                      <PaperButton onClick={(event: React.MouseEvent) => {
                        event.stopPropagation();
                        handleCreateTodoFromAction(item);
                      }}>
                        {item.nextActionLabel}
                      </PaperButton>
                    </div>
                  </div>
                ))}
                {!loading && !informationFlow.auxiliary.hasActionItems ? (
                  <TodayEmptyCard text="当前没有需要转入待办的线索。" />
                ) : null}
              </TodayGrid>
            </TodayEditorialSection>
          </>
        ) : null}
      </TodayEditorialSurface>
    </TodayEditorialShell>
  );
}
