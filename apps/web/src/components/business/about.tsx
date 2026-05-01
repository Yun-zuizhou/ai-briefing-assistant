import { ChevronRight, Eye, FileText, Globe, Heart, Mail, Shield } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '../ui';

interface AboutAppInfo {
  name: string;
  version: string;
  buildNumber: string;
  description: string;
}

type AboutLinkKind = 'terms' | 'privacy' | 'website' | 'contact' | 'preview';

interface AboutLinkItem {
  kind: AboutLinkKind;
  title: string;
  onClick: () => void;
}

const LINK_ICONS: Record<AboutLinkKind, ReactNode> = {
  terms: <FileText size={18} />,
  privacy: <Shield size={18} />,
  website: <Globe size={18} />,
  contact: <Mail size={18} />,
  preview: <Eye size={18} />,
};

export function AboutHeroCard({
  appInfo,
}: {
  appInfo: AboutAppInfo;
}) {
  return (
    <div className="about-hero-card">
      <span className="about-hero-frame" />

      <div className="about-logo-badge">
        简
      </div>

      <h1 className="type-page-title about-app-name">
        {appInfo.name}
      </h1>

      <p className="about-version-text">
        版本 {appInfo.version} ({appInfo.buildNumber})
      </p>

      <p className="about-description-text">
        {appInfo.description}
      </p>
    </div>
  );
}

export function AboutLinksCard({
  links,
}: {
  links: AboutLinkItem[];
}) {
  return (
    <div className="domain-card about-links-card">
      <div className="article-list">
        {links.map((link, index) => (
          <Button
            key={link.kind}
            type="button"
            variant="unstyled"
            className={`article-item about-link-item ${index < links.length - 1 ? 'with-border' : ''}`}
            onClick={link.onClick}
          >
            <div className="about-link-layout">
              <div className="about-link-main">
                <div className="about-link-icon">{LINK_ICONS[link.kind]}</div>
                <p className="about-link-title">
                  {link.title}
                </p>
              </div>
              <ChevronRight size={16} className="about-link-chevron" />
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

export function AboutCreditCard() {
  return (
    <div className="about-credit-card">
      <p className="about-credit-text">
        Made with <Heart size={12} className="about-heart-icon" /> by 简报助手团队
      </p>
      <p className="about-copyright-text">
        © 2024 简报助手. All rights reserved.
      </p>
    </div>
  );
}

export function AboutFeaturesCard({
  items,
}: {
  items: string[];
}) {
  return (
    <div className="about-features-card">
      <h3 className="about-features-title">
        🎉 主要功能
      </h3>
      <ul className="about-features-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
