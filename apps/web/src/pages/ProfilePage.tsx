import { useEffect, useMemo, useState } from 'react';
import { PageLayout, SecondaryHeader, PageContent } from '../components/layout';
import { Tag } from '../components/ui';
import { apiService } from '../services/api';
import type { UserProfilePayload } from '../services/api';

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<UserProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getUserProfile();
        if (response.error) {
          throw new Error(response.error);
        }
        setProfileData(response.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载用户画像失败');
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  const radarData = useMemo(() => {
    const metrics = profileData?.radar_metrics ?? {};
    return [
      { label: '活跃度', value: metrics['活跃度'] ?? 0 },
      { label: '收藏量', value: metrics['收藏量'] ?? 0 },
      { label: '任务完成', value: metrics['任务完成'] ?? 0 },
      { label: '关注广度', value: metrics['关注广度'] ?? 0 },
      { label: '连续打卡', value: metrics['连续打卡'] ?? 0 },
      { label: '互动深度', value: metrics['互动深度'] ?? 0 },
    ];
  }, [profileData?.radar_metrics]);

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
    .map((d, i) => {
      const point = getPoint(i, d.value);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <PageLayout variant="secondary">
      <SecondaryHeader
        title="用户画像"
        label="USER PROFILE"
        subtitle="基于真实记录、收藏、任务与关注的过渡画像"
      />

      <PageContent className="profile-page-content">
        {error ? (
          <div className="domain-card profile-error-card">
            <p className="profile-error-text">{error}</p>
          </div>
        ) : null}

        <section className="report-section profile-section">
          <div className="section-header profile-section-header tone-ink">
            <h3 className="type-content-title profile-section-title">行为雷达图</h3>
          </div>
          <div className="section-content profile-section-content">
            {loading ? (
              <p className="profile-loading-text">加载画像中...</p>
            ) : (
              <svg width="300" height="300" viewBox="0 0 300 300" className="profile-radar-svg">
                {gridLevels.map((level) => (
                  <polygon
                    key={level}
                    points={radarData.map((_, i) => {
                      const point = getPoint(i, level);
                      return `${point.x},${point.y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                ))}

                {radarData.map((_, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const endX = centerX + radius * Math.cos(angle);
                  const endY = centerY + radius * Math.sin(angle);
                  return (
                    <line
                      key={i}
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

                {radarData.map((d, i) => {
                  const point = getPoint(i, d.value);
                  return <circle key={i} cx={point.x} cy={point.y} r="4" fill="var(--accent)" />;
                })}

                {radarData.map((d, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const labelRadius = radius + 25;
                  const labelX = centerX + labelRadius * Math.cos(angle);
                  const labelY = centerY + labelRadius * Math.sin(angle);
                  return (
                    <text
                      key={i}
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="profile-radar-label"
                    >
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            )}
          </div>
        </section>

        <section className="report-section profile-section">
          <div className="section-header profile-section-header tone-gold">
            <h3 className="type-content-title profile-section-title">📊 数据概览</h3>
          </div>
          <div className="section-content profile-section-content">
            <div className="profile-stat-grid">
              <div className="profile-stat-card">
                <div className="profile-stat-value tone-accent">{profileData?.notes_count ?? 0}</div>
                <div className="profile-stat-label">真实记录</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-value tone-gold">{profileData?.favorites_count ?? 0}</div>
                <div className="profile-stat-label">真实收藏</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-value tone-ink">
                  {(profileData?.completed_todos ?? 0)}/{(profileData?.total_todos ?? 0)}
                </div>
                <div className="profile-stat-label">任务完成</div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-value tone-accent">{profileData?.active_interests?.length ?? 0}</div>
                <div className="profile-stat-label">关注领域</div>
              </div>
            </div>
          </div>
        </section>

        <section className="report-section profile-section">
          <div className="section-header profile-section-header tone-ink">
            <h3 className="type-content-title profile-section-title">✨ AI 用户画像描述</h3>
          </div>
          <div className="section-content profile-section-content">
            <p className="profile-persona-text">{profileData?.persona_summary ?? '当前画像正在生成中。'}</p>
          </div>
        </section>

        <section className="report-section profile-section">
          <div className="section-header profile-section-header tone-accent">
            <h3 className="type-content-title profile-section-title">💡 成长关键词</h3>
          </div>
          <div className="section-content profile-section-content">
            <div className="profile-keyword-list">
              {(profileData?.growth_keywords?.length ? profileData.growth_keywords : ['记录', '行动', '回顾']).map((keyword) => (
                <Tag key={keyword}>{keyword}</Tag>
              ))}
            </div>
          </div>
        </section>
      </PageContent>
    </PageLayout>
  );
}
