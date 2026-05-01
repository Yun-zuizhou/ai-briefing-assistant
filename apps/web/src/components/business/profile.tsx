import { RefreshCw } from 'lucide-react';

import { PageSection, PageStack } from '../layout';
import { Button, Tag } from '../ui';
import type { UserProfilePayload } from '../../services/api';
import type { AiGenerationStatusView } from '../../utils/aiGenerationStatus';

interface EvidenceRefPreview {
  refType?: string;
  refId?: number | null;
  resultRef?: string | null;
  sourceUrl?: string | null;
  title?: string | null;
  snippet?: string | null;
  reason?: string | null;
}

interface ProfileRadarMetric {
  label: string;
  value: number;
}

function getEvidenceTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    note: '记录',
    favorite: '收藏',
    todo: '待办',
    history_entry: '历史',
    article: '文章',
    hot_topic: '热点',
    opportunity: '机会',
    summary_result: '摘要',
    briefing: '简报',
  };
  return type ? labels[type] || type : '证据';
}

export function ProfileErrorCard({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <div className="domain-card profile-error-card">
      <p className="profile-error-text">{error}</p>
    </div>
  );
}

export function ProfileGenerateMessageCard({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="domain-card profile-generate-card is-success">
      <p className="profile-generate-text">{message}</p>
    </div>
  );
}

export function ProfileGenerateCard({
  aiStatus,
  generating,
  loading,
  onGenerate,
}: {
  aiStatus: AiGenerationStatusView;
  generating: boolean;
  loading: boolean;
  onGenerate: () => void;
}) {
  return (
    <section className="domain-card profile-generate-card">
      <div className="profile-generate-copy">
        <p className="profile-generate-title">
          {aiStatus.title}
        </p>
        <p className="profile-generate-text">
          {aiStatus.detail}
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="profile-generate-btn"
        onClick={onGenerate}
        loading={generating}
        loadingLabel={aiStatus.loadingLabel}
        disabled={loading || !aiStatus.canRegenerate}
      >
        <RefreshCw size={15} aria-hidden="true" />
        <span>{aiStatus.actionLabel}</span>
      </Button>
    </section>
  );
}

export function ProfileRadarSection({
  loading,
  radarData,
}: {
  loading: boolean;
  radarData: ProfileRadarMetric[];
}) {
  const centerX = 150;
  const centerY = 150;
  const radius = 100;
  const angleStep = (2 * Math.PI) / radarData.length;

  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  };

  const polygonPoints = radarData
    .map((metric, index) => {
      const point = getPoint(index, metric.value);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <PageSection className="profile-section" title="近期行为分布">
      {loading ? (
        <p className="profile-loading-text">加载画像中...</p>
      ) : (
        <svg width="300" height="300" viewBox="0 0 300 300" className="profile-radar-svg">
          {gridLevels.map((level) => (
            <polygon
              key={level}
              points={radarData.map((_, index) => {
                const point = getPoint(index, level);
                return `${point.x},${point.y}`;
              }).join(' ')}
              fill="none"
              stroke="var(--border)"
              strokeWidth="1"
            />
          ))}

          {radarData.map((_, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const endX = centerX + radius * Math.cos(angle);
            const endY = centerY + radius * Math.sin(angle);
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="var(--border)"
                strokeWidth="1"
              />
            );
          })}

          <polygon
            points={polygonPoints}
            fill="rgba(166, 61, 47, 0.2)"
            stroke="var(--accent)"
            strokeWidth="2"
          />

          {radarData.map((metric, index) => {
            const point = getPoint(index, metric.value);
            return <circle key={metric.label} cx={point.x} cy={point.y} r="4" fill="var(--accent)" />;
          })}

          {radarData.map((metric, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const labelRadius = radius + 25;
            const labelX = centerX + labelRadius * Math.cos(angle);
            const labelY = centerY + labelRadius * Math.sin(angle);
            return (
              <text
                key={metric.label}
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="profile-radar-label"
              >
                {metric.label}
              </text>
            );
          })}
        </svg>
      )}
    </PageSection>
  );
}

export function ProfileStatsSection({ profileData }: { profileData: UserProfilePayload | null }) {
  return (
    <PageSection className="profile-section" title="数据概览">
      <div className="profile-stat-grid">
        <ProfileStatCard label="真实记录" tone="tone-accent" value={profileData?.notes_count ?? 0} />
        <ProfileStatCard label="真实收藏" tone="tone-gold" value={profileData?.favorites_count ?? 0} />
        <ProfileStatCard label="任务完成" tone="tone-ink" value={`${profileData?.completed_todos ?? 0}/${profileData?.total_todos ?? 0}`} />
        <ProfileStatCard label="关注领域" tone="tone-accent" value={profileData?.active_interests?.length ?? 0} />
      </div>
    </PageSection>
  );
}

function ProfileStatCard({ label, tone, value }: { label: string; tone: string; value: number | string }) {
  return (
    <div className="profile-stat-card">
      <div className={`profile-stat-value ${tone}`}>{value}</div>
      <div className="profile-stat-label">{label}</div>
    </div>
  );
}

export function ProfilePersonaSection({ profileData }: { profileData: UserProfilePayload | null }) {
  return (
    <PageSection className="profile-section" title="画像说明">
      <p className="profile-persona-text">{profileData?.persona_summary ?? '当前画像正在生成中。'}</p>
    </PageSection>
  );
}

export function ProfileInsightsSection({ profileData }: { profileData: UserProfilePayload | null }) {
  return (
    <PageSection className="profile-section" title="关键洞察">
      {profileData?.key_insights?.length ? (
        <div className="profile-insight-list">
          {profileData.key_insights.map((item) => (
            <p key={item} className="profile-insight-item">{item}</p>
          ))}
        </div>
      ) : (
        <p className="profile-muted-text">画像更新后，这里会显示可追溯的关键判断。</p>
      )}
    </PageSection>
  );
}

export function ProfileKeywordsSection({ profileData }: { profileData: UserProfilePayload | null }) {
  const keywords = profileData?.growth_keywords?.length ? profileData.growth_keywords : ['记录', '行动', '回顾'];

  return (
    <PageSection className="profile-section" title="成长关键词">
      <div className="profile-keyword-list">
        {keywords.map((keyword) => (
          <Tag key={keyword}>{keyword}</Tag>
        ))}
      </div>
    </PageSection>
  );
}

export function ProfileEvidenceSection({
  evidenceRefs,
}: {
  evidenceRefs: EvidenceRefPreview[];
}) {
  return (
    <PageSection className="profile-section" title="依据来源">
      {evidenceRefs.length ? (
        <div className="profile-evidence-list">
          {evidenceRefs.map((item, index) => (
            <div key={`${item.refType}-${item.refId ?? item.resultRef ?? item.sourceUrl ?? index}`} className="profile-evidence-item">
              <div className="profile-evidence-head">
                <span className="profile-evidence-type">{getEvidenceTypeLabel(item.refType)}</span>
                <span className="profile-evidence-id">
                  {item.refId ? `#${item.refId}` : item.resultRef || item.sourceUrl || '来源'}
                </span>
              </div>
              <p className="profile-evidence-title">{item.title || item.snippet || '未命名证据'}</p>
              {item.reason ? <p className="profile-evidence-reason">{item.reason}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="profile-muted-text">暂无可追溯依据。画像更新后会保留引用来源。</p>
      )}
    </PageSection>
  );
}

export function ProfileContent({
  evidenceRefs,
  loading,
  profileData,
  radarData,
}: {
  evidenceRefs: EvidenceRefPreview[];
  loading: boolean;
  profileData: UserProfilePayload | null;
  radarData: ProfileRadarMetric[];
}) {
  return (
    <PageStack>
      <ProfileRadarSection loading={loading} radarData={radarData} />
      <ProfileStatsSection profileData={profileData} />
      <ProfilePersonaSection profileData={profileData} />
      <ProfileInsightsSection profileData={profileData} />
      <ProfileKeywordsSection profileData={profileData} />
      <ProfileEvidenceSection evidenceRefs={evidenceRefs} />
    </PageStack>
  );
}
