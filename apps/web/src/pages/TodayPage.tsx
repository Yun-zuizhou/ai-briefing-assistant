import { Masthead, PageContent, PageLayout, PageSection, PageStack } from '../components/layout';
import {
  TodayContentCard,
  TodayEmptyCard,
  TodayErrorState,
  TodayGrid,
  TodayInfoBox,
  TodayLeadCard,
  TodayLoadingState,
} from '../components/business';
import { Button, Tag } from '../components/ui';
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
    <PageLayout variant="main" className="today-mobile-shell">
      <Masthead
        title={pageData?.pageTitle ?? '简报'}
        subtitle={pageData?.pageSubtitle ?? '今天你关心的领域发生了什么'}
        ornaments={['✦ TODAY ✦', '✦ DIGEST ✦']}
        meta="TODAY'S BRIEFING"
      />

      <PageContent className="today-page-content">
        <PageStack>
          {error ? (
            <TodayErrorState message={error} />
          ) : null}

          <div className="today-briefing-layout">
            <main className="today-main-column" aria-label="简报主阅读区">
              <PageSection className="today-section today-section-overview" id="today-overview">
                <TodayInfoBox className="today-info-box-summary">
                  <p className="today-summary-label">今日内容摘要</p>
                  <p className="today-summary-text">{informationFlow.overview.text}</p>
                  {informationFlow.overview.statusLabel ? (
                    <div className="today-extension-row">
                      <Tag>{informationFlow.overview.statusLabel}</Tag>
                    </div>
                  ) : null}
                </TodayInfoBox>
                <TodayLeadCard
                  loading={loading}
                  kicker="头版重点"
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
              </PageSection>

              {loading && !pageData ? (
                <TodayLoadingState />
              ) : null}

              {informationFlow.shouldShowContent ? (
                <PageSection
                  className="today-section today-section-recommend"
                  id="today-recommend"
                  title="关注领域报道"
                >
                  <TodayInfoBox className="today-info-box-recommend">
                    {informationFlow.groupedReports.length > 0 ? (
                      <>
                        <div className="today-recommend-groups">
                          {informationFlow.groupedReports.map((group) => (
                            <section className="today-recommend-group" key={group.id}>
                              <div className="today-recommend-group-head">
                                <Tag>{group.title}</Tag>
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
                      </>
                    ) : informationFlow.auxiliary.hasKnowledgeItems ? (
                      <p className="content-summary">
                        今日关注领域暂无新报道，你可以先浏览右侧精选热点或去对话页调整关注设置。
                      </p>
                    ) : (
                      <p className="content-summary">
                        暂无关注领域报道。去对话页告诉我你最近想持续追踪什么，我会把今天的简报收束给你。
                      </p>
                    )}
                  </TodayInfoBox>
                </PageSection>
              ) : null}
            </main>

            {informationFlow.shouldShowContent ? (
              <aside className="today-side-column" aria-label="简报辅助入口">
                <PageSection
                  action={<Button type="button" variant="text" size="sm" onClick={handleOpenHotTopics}>查看更多热点 →</Button>}
                  className="today-section today-section-knowledge"
                  id="today-knowledge"
                  title="精选热点"
                >
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
                </PageSection>

                {informationFlow.extensionSlots.length > 0 ? (
                  informationFlow.extensionSlots.map((slot) => {
                    const sectionClass = slot.slotType === 'ask' ? 'conversation' : slot.slotType === 'save' ? 'note' : slot.slotType;
                    const chipClass = slot.slotType === 'ask' ? 'primary' : 'accent';
                    return (
                      <PageSection
                        key={slot.slotType}
                        className={`today-section today-section-${sectionClass}`}
                        id={`today-${sectionClass}`}
                        title={slot.title}
                      >
                        <TodayInfoBox className={`today-info-box-${sectionClass}`}>
                          <p className={`today-${sectionClass}-text`}>{slot.description}</p>
                          <Button
                            onClick={() => handleExtensionSlotClick(slot)}
                            variant="unstyled"
                            className={`action-chip ${chipClass}`}
                          >
                            {slot.actionLabel}
                          </Button>
                        </TodayInfoBox>
                      </PageSection>
                    );
                  })
                ) : (
                  <>
                    <PageSection
                      className="today-section today-section-note"
                      id="today-note"
                      title="简报速记"
                    >
                      <TodayInfoBox className="today-info-box-note">
                        <p className="today-note-text">
                          读完这份简报后，先记下一句最值得以后回看的想法。
                        </p>
                        <Button
                          onClick={handleQuickNote}
                          variant="unstyled"
                          className="action-chip accent"
                        >
                          写速记
                        </Button>
                      </TodayInfoBox>
                    </PageSection>

                    <PageSection
                      className="today-section today-section-conversation"
                      id="today-conversation"
                      title="问这份简报"
                    >
                      <TodayInfoBox className="today-info-box-conversation">
                        <p className="today-conversation-text">
                          围绕今天的摘要、头版重点和关注报道继续追问。
                        </p>
                        <Button
                          onClick={handleAskAboutBriefing}
                          variant="unstyled"
                          className="action-chip primary"
                        >
                          进入对话
                        </Button>
                      </TodayInfoBox>
                    </PageSection>
                  </>
                )}

                <PageSection
                  action={<Button type="button" variant="text" size="sm" onClick={handleOpenTodo}>查看待办 →</Button>}
                  className="today-section today-section-action"
                  id="today-action"
                  title="后续线索"
                >
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
                          <Button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCreateTodoFromAction(item);
                            }}
                            variant="unstyled"
                            className="action-chip primary"
                          >
                            {item.nextActionLabel}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!loading && !informationFlow.auxiliary.hasActionItems ? (
                      <TodayEmptyCard text="当前没有需要转入待办的线索。" />
                    ) : null}
                  </TodayGrid>
                </PageSection>
              </aside>
            ) : null}
          </div>
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
