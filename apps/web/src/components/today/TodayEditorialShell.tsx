import type { ReactNode } from 'react';

import '../../styles/bookish-decor.css';
import { DecorFrame, EditorialMasthead, OrnamentDivider, SectionHeader } from '../decor';
import { PageContent, PageLayout } from '../layout';

export type TodaySectionWeight = 'lead' | 'normal' | 'auxiliary';

export function TodayEditorialShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <PageLayout variant="main" className={`today-editorial-page ${className}`.trim()}>
      {children}
    </PageLayout>
  );
}

export function TodayEditorialHeader({
  title,
  subtitle,
  edition,
  meta = [],
}: {
  title: string;
  subtitle: string;
  edition?: string;
  meta?: string[];
}) {
  return (
    <header className="today-editorial-head">
      <EditorialMasthead
        variant="front"
        title={title}
        eyebrow="TODAY BRIEFING"
        edition={edition}
        meta={meta}
        dek={subtitle}
        icon="briefing"
      />
      <OrnamentDivider ornament="diamond" dashed className="today-editorial-head-divider" />
    </header>
  );
}

export function TodayEditorialSurface({ children }: { children: ReactNode }) {
  return (
    <PageContent className="today-editorial-content">
      <DecorFrame className="today-editorial-surface decor-frame-flex">
        <OrnamentDivider ornament="none" dashed className="today-surface-divider" />
        <div className="today-editorial-body">
          {children}
        </div>
      </DecorFrame>
    </PageContent>
  );
}

export function TodayEditorialSection({
  label,
  sublabel,
  weight = 'normal',
  children,
}: {
  label: string;
  sublabel?: string;
  weight?: TodaySectionWeight;
  children: ReactNode;
}) {
  return (
    <section className={`today-editorial-section today-editorial-section--${weight}`}>
      <SectionHeader
        title={label}
        subtitle={sublabel}
        ornament={weight === 'lead' ? 'star' : 'diamond'}
      />
      <div className="today-editorial-section-body">
        {children}
      </div>
      {weight !== 'auxiliary' ? (
        <OrnamentDivider ornament="none" dashed className="today-section-divider" />
      ) : null}
    </section>
  );
}
