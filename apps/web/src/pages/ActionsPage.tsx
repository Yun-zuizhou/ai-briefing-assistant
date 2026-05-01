import { PageContent, PageLayout, PageSection, PageStack, Masthead } from '../components/layout';
import {
  ActionsErrorCard,
  ActionsFilterBar,
  ActionsFollowingList,
  ActionsLoadingState,
  ActionsPrimaryCard,
  ActionsRhythmSummary,
  ActionsSavedList,
  ActionsTodoList,
} from '../components/business';
import { useActionsPageLogic } from './useActionsPageLogic';

export default function ActionsPage() {
  const {
    checkedInToday,
    dateStr,
    deleteTodo,
    error,
    fallbackPrimaryTodo,
    favorites,
    filter,
    filterCounts,
    filteredTodos,
    followingItems,
    handleCheckIn,
    handlePrimaryAction,
    loading,
    navigate,
    reminderSummary,
    reloadActions,
    secondarySuggestions,
    setFilter,
    streakDays,
    todoProgress,
    toggleTodo,
    topPriority,
    weekDay,
  } = useActionsPageLogic();

  if (loading) {
    return (
      <PageLayout variant="main">
        <Masthead title="待办" subtitle={`${dateStr} · ${weekDay}`} ornaments={['✦ TODO ✦', '✦ ACTION ✦']} meta="今日推进 · 后续跟进 · 稍后处理" />
        <PageContent className="actions-page-content">
          <ActionsLoadingState />
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="main">
      <Masthead title="待办" subtitle={`${dateStr} · ${weekDay}`} ornaments={['✦ TODO ✦', '✦ ACTION ✦']} meta="今日推进 · 后续跟进 · 稍后处理" />
      <PageContent className="actions-page-content">
        <PageStack>
          {error ? (
            <ActionsErrorCard error={error} onReload={() => void reloadActions()} />
          ) : null}

          <ActionsPrimaryCard
            fallbackPrimaryTodo={fallbackPrimaryTodo}
            onPrimaryAction={handlePrimaryAction}
            onSuggestionClick={(deepLink) => navigate(deepLink ?? '/todo')}
            secondarySuggestions={secondarySuggestions}
            topPriority={topPriority}
          />

          <ActionsFilterBar counts={filterCounts} filter={filter} onChange={setFilter} />

          <PageSection title="待办列表">
            <ActionsTodoList
              todos={filteredTodos}
              onDelete={(id) => void deleteTodo(id)}
              onToggle={(todo) => void toggleTodo(todo)}
            />
          </PageSection>

          <PageSection title="后续跟进">
            <ActionsFollowingList items={followingItems} />
          </PageSection>

          <PageSection title="稍后处理的收藏">
            <ActionsSavedList items={favorites} />
          </PageSection>

          <ActionsRhythmSummary
            checkedInToday={checkedInToday}
            completedTodoCount={todoProgress.done}
            onCheckIn={handleCheckIn}
            reminderSummary={reminderSummary}
            streakDays={streakDays}
            todayTodoCount={filterCounts.today}
          />
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
