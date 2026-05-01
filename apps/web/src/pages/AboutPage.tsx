import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import {
  AboutCreditCard,
  AboutFeaturesCard,
  AboutHeroCard,
  AboutLinksCard,
} from '../components/business';
import { useAboutPageLogic } from './useAboutPageLogic';

export default function AboutPage() {
  const { appInfo, featureItems, links } = useAboutPageLogic();

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader title="关于" label="ABOUT" />

      <PageContent className="about-page-content">
        <AboutHeroCard appInfo={appInfo} />
        <AboutLinksCard links={links} />
        <AboutCreditCard />
        <AboutFeaturesCard items={featureItems} />
      </PageContent>
    </PageLayout>
  );
}
