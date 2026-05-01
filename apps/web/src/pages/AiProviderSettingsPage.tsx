import {
  AiProviderActionBar,
  AiProviderCurrentCard,
  AiProviderFormCard,
  AiProviderInfoCard,
  AiProviderNoteCard,
  AiProviderStatusCard,
} from '../components/business';
import { PageContent, PageLayout, PageStack, SecondaryHeader } from '../components/layout';
import { AI_PROVIDER_OPTIONS, useAiProviderSettingsPageLogic } from './useAiProviderSettingsPageLogic';

export default function AiProviderSettingsPage() {
  const {
    apiKey,
    error,
    handleClear,
    handleSave,
    loading,
    provider,
    saving,
    selectedPlatformLabel,
    setApiKey,
    setProvider,
    snapshot,
    statusMessage,
  } = useAiProviderSettingsPageLogic();

  const disabled = loading || saving;

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="AI API" label="AI PROVIDER" />

      <PageContent className="ai-provider-page-content">
        <PageStack>
          <AiProviderStatusCard message={statusMessage} error={error} />
          <AiProviderInfoCard />
          <AiProviderFormCard
            apiKey={apiKey}
            disabled={disabled}
            onApiKeyChange={setApiKey}
            onProviderChange={setProvider}
            options={AI_PROVIDER_OPTIONS}
            provider={provider}
            snapshot={snapshot}
          />
          <AiProviderCurrentCard snapshot={snapshot} />
          <AiProviderActionBar
            apiKey={apiKey}
            disabled={disabled}
            onClear={() => void handleClear()}
            onSave={() => void handleSave()}
            saving={saving}
            selectedPlatformLabel={selectedPlatformLabel}
            snapshot={snapshot}
          />
          <AiProviderNoteCard />
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
