import {
  AiDigestLabErrorCard,
  AiDigestLabIntroCard,
  AiDigestLabWorkspace,
} from '../components/business';
import { Masthead, PageContent, PageLayout } from '../components/layout';
import { useAiDigestLabPageLogic } from './useAiDigestLabPageLogic';

export default function AiDigestLabPage() {
  const {
    activeItem,
    activeResultRef,
    consultError,
    consultResult,
    consulting,
    error,
    handleConsult,
    handleRefresh,
    handleSelectItem,
    items,
    loading,
    question,
    setQuestion,
  } = useAiDigestLabPageLogic();

  return (
    <PageLayout variant="secondary">
      <Masthead
        title="AI Digest Lab"
        subtitle="阶段十六调试页"
        ornaments={['✦ AI DIGEST ✦', '✦ LAB ✦']}
        meta="DAILY DIGEST / CONSULT"
      />

      <PageContent className="ai-digest-page-content">
        <AiDigestLabIntroCard onRefresh={() => void handleRefresh()} />
        <AiDigestLabErrorCard error={error} />
        <AiDigestLabWorkspace
          activeItem={activeItem}
          activeResultRef={activeResultRef}
          consultError={consultError}
          consultResult={consultResult}
          consulting={consulting}
          items={items}
          loading={loading}
          onConsult={() => void handleConsult()}
          onQuestionChange={setQuestion}
          onSelectItem={handleSelectItem}
          question={question}
        />
      </PageContent>
    </PageLayout>
  );
}
