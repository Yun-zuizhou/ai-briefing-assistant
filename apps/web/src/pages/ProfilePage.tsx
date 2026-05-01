import {
  ProfileContent,
  ProfileErrorCard,
  ProfileGenerateCard,
  ProfileGenerateMessageCard,
} from '../components/business';
import { PageContent, PageLayout, PageStack, SecondaryHeader } from '../components/layout';
import { useProfilePageLogic } from './useProfilePageLogic';

export default function ProfilePage() {
  const {
    aiStatus,
    error,
    evidenceRefs,
    generateMessage,
    generating,
    handleGenerateProfile,
    loading,
    profileData,
    radarData,
  } = useProfilePageLogic();

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader
        title="我的画像"
        label="USER PROFILE"
        subtitle="基于阅读、收藏、待办和关注形成的个人理解"
      />

      <PageContent className="profile-page-content">
        <PageStack>
          <ProfileErrorCard error={error} />
          <ProfileGenerateMessageCard message={generateMessage} />
          <ProfileGenerateCard
            aiStatus={aiStatus}
            generating={generating}
            loading={loading}
            onGenerate={() => void handleGenerateProfile()}
          />
          <ProfileContent
            evidenceRefs={evidenceRefs}
            loading={loading}
            profileData={profileData}
            radarData={radarData}
          />
        </PageStack>
      </PageContent>
    </PageLayout>
  );
}
