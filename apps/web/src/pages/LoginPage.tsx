import { LoginAuthCard, LoginBackButton, LoginModeSwitch } from '../components/business';
import { PageContent, PageFooterDecorative, PageLayout, Masthead } from '../components/layout';
import { useLoginPageLogic } from './useLoginPageLogic';

export default function LoginPage() {
  const {
    authLoading,
    errors,
    formData,
    handleApplyPreset,
    handleBack,
    handleSubmit,
    mode,
    setMode,
    setShowPassword,
    showPassword,
    submitting,
    testAccountPresets,
    updateFormField,
  } = useLoginPageLogic();

  return (
    <PageLayout variant="auth">
      <Masthead
        title="简 报"
        subtitle={mode === 'login' ? '登录你的账户' : '创建新账户'}
        ornaments={['✦ AI ✦', '✦ BRIEFING ✦']}
        leftButton={<LoginBackButton onBack={handleBack} />}
      />

      <PageContent className="login-page-content">
        <LoginModeSwitch mode={mode} onModeChange={setMode} />
        <LoginAuthCard
          authLoading={authLoading}
          errors={errors}
          formData={formData}
          mode={mode}
          onApplyPreset={handleApplyPreset}
          onFieldChange={updateFormField}
          onSubmit={() => void handleSubmit()}
          presets={testAccountPresets}
          setShowPassword={setShowPassword}
          showPassword={showPassword}
          submitting={submitting}
        />
      </PageContent>

      <PageFooterDecorative />
    </PageLayout>
  );
}
