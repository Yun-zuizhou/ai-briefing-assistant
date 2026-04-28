import { useState } from 'react';

const decorStyles = [
  {
    id: 'floral',
    name: '花卉边框',
    description: '优雅的花卉装饰，温馨浪漫',
    headerDecor: `
      ╭──────────────────────────────────────╮
      │  ❀ ❀ ❀   每 日 简 报   ❀ ❀ ❀  │
      ╰──────────────────────────────────────╯
    `,
    borderColor: '#B87333',
    bgColor: '#FFFBF5',
    accentColor: '#D4A574',
    cornerDecor: '✿',
    dividerDecor: '❀ ───────────────────────────────── ❀',
  },
  {
    id: 'artdeco',
    name: '装饰艺术',
    description: '复古Art Deco风格，几何线条',
    headerDecor: `
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
      ▓    ╔═══════════════════════════╗    ▓
      ▓    ║       每 日 简 报        ║    ▓
      ▓    ╚═══════════════════════════╝    ▓
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    `,
    borderColor: '#1A1A1A',
    bgColor: '#F5F5F0',
    accentColor: '#C41E3A',
    cornerDecor: '◆',
    dividerDecor: '═══════════════════════════════════════',
  },
  {
    id: 'vintage',
    name: '复古报纸',
    description: '经典报纸排版，怀旧质感',
    headerDecor: `
      ┌─────────────────────────────────────┐
      │  ★ THE DAILY BRIEFING ★            │
      │  ─────────────────────────────────  │
      │           每 日 简 报              │
      └─────────────────────────────────────┘
    `,
    borderColor: '#3A3A3A',
    bgColor: '#F8F4E8',
    accentColor: '#8B4513',
    cornerDecor: '★',
    dividerDecor: '─────────────────────────────────────────',
  },
  {
    id: 'minimal',
    name: '极简线条',
    description: '简洁现代，留白充足',
    headerDecor: `
      ─────────────────────────────────────
                 每 日 简 报
      ─────────────────────────────────────
    `,
    borderColor: '#E0E0E0',
    bgColor: '#FFFFFF',
    accentColor: '#5D4E37',
    cornerDecor: '',
    dividerDecor: '─────────────────────────────────────────',
  },
  {
    id: 'warm',
    name: '温馨手账',
    description: '手账风格，温暖亲切',
    headerDecor: `
      ╭♡─────────────────────────────────♡╮
      │  🌸 每 日 简 报 🌸                 │
      │  ───────────────────────────────  │
      ╰♡─────────────────────────────────♡╯
    `,
    borderColor: '#E8B4B8',
    bgColor: '#FFF9F5',
    accentColor: '#D4A574',
    cornerDecor: '♡',
    dividerDecor: '♡ ───────────────────────────────── ♡',
  },
];

export default function DecorPreviewPage() {
  const [selectedStyle, setSelectedStyle] = useState('floral');
  const style = decorStyles.find(s => s.id === selectedStyle) || decorStyles[0];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'auto',
      background: '#1A1A1A',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '8px',
        }}>
          🎨 装饰风格预览
        </h1>
        <p style={{
          color: '#888',
          marginBottom: '20px',
          fontSize: '13px',
        }}>
          选择一种整体装饰风格，直观看到完整效果
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '20px',
        }}>
          {decorStyles.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStyle(s.id)}
              style={{
                padding: '10px 16px',
                background: selectedStyle === s.id ? '#333' : '#252525',
                border: selectedStyle === s.id ? '2px solid white' : '2px solid transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div style={{
          background: style.bgColor,
          border: `3px solid ${style.borderColor}`,
          padding: '20px',
          marginBottom: '20px',
        }}>
          <pre style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            color: style.borderColor,
            textAlign: 'center',
            marginBottom: '16px',
            whiteSpace: 'pre',
            lineHeight: 1.3,
          }}>
            {style.headerDecor}
          </pre>

          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#666',
            marginBottom: '16px',
          }}>
            {style.description}
          </div>

          <div style={{
            fontSize: '11px',
            color: '#888',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            2026年3月14日 · 星期六 · 第365期
          </div>

          <div style={{
            borderTop: `1px dashed ${style.borderColor}`,
            margin: '16px 0',
          }} />

          <div style={{
            background: 'white',
            border: `2px solid ${style.borderColor}`,
            padding: '16px',
            marginBottom: '16px',
            position: 'relative',
          }}>
            {style.cornerDecor && (
              <>
                <span style={{ position: 'absolute', top: -8, left: 10, background: style.bgColor, padding: '0 4px', color: style.accentColor }}>{style.cornerDecor}</span>
                <span style={{ position: 'absolute', top: -8, right: 10, background: style.bgColor, padding: '0 4px', color: style.accentColor }}>{style.cornerDecor}</span>
              </>
            )}
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: style.accentColor,
              marginBottom: '8px',
            }}>
              📰 人工智能
            </div>
            <p style={{
              fontSize: '13px',
              color: '#444',
              lineHeight: 1.7,
              margin: 0,
            }}>
              GPT-5发布，推理能力首次超越人类基准。多模态理解能力提升200%，长文本处理支持100K tokens。这标志着AI发展进入新阶段...
            </p>
            <div style={{
              marginTop: '12px',
              display: 'flex',
              gap: '8px',
            }}>
              <span style={{
                fontSize: '11px',
                padding: '4px 8px',
                background: style.bgColor,
                border: `1px solid ${style.borderColor}`,
                color: '#666',
              }}>
                #AI
              </span>
              <span style={{
                fontSize: '11px',
                padding: '4px 8px',
                background: style.bgColor,
                border: `1px solid ${style.borderColor}`,
                color: '#666',
              }}>
                #科技
              </span>
            </div>
          </div>

          <div style={{
            background: 'white',
            border: `2px solid ${style.borderColor}`,
            padding: '16px',
            marginBottom: '16px',
            position: 'relative',
          }}>
            {style.cornerDecor && (
              <>
                <span style={{ position: 'absolute', top: -8, left: 10, background: style.bgColor, padding: '0 4px', color: style.accentColor }}>{style.cornerDecor}</span>
                <span style={{ position: 'absolute', top: -8, right: 10, background: style.bgColor, padding: '0 4px', color: style.accentColor }}>{style.cornerDecor}</span>
              </>
            )}
            <div style={{
              fontSize: '16px',
              fontWeight: 700,
              color: style.accentColor,
              marginBottom: '8px',
            }}>
              💼 远程工作
            </div>
            <p style={{
              fontSize: '13px',
              color: '#444',
              lineHeight: 1.7,
              margin: 0,
            }}>
              多家互联网公司开放远程运营岗位，薪资区间200-300元/天。适合寻求灵活工作方式的求职者...
            </p>
          </div>

          <pre style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            color: style.borderColor,
            textAlign: 'center',
            whiteSpace: 'pre',
            opacity: 0.6,
          }}>
            {style.dividerDecor}
          </pre>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginTop: '16px',
          }}>
            {[
              { label: '今日关注', value: '5', icon: '📖' },
              { label: '完成待办', value: '3', icon: '✅' },
              { label: '连续打卡', value: '7', icon: '🔥' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'white',
                border: `2px solid ${style.borderColor}`,
                padding: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: style.accentColor,
                }}>{stat.value}</div>
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: `linear-gradient(135deg, ${style.bgColor} 0%, white 100%)`,
            border: `2px solid ${style.borderColor}`,
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '13px',
              color: '#666',
              fontStyle: 'italic',
              margin: 0,
            }}>
              "今天你关注了<strong style={{ color: style.accentColor }}>2</strong>个主题，
              获取了<strong style={{ color: style.accentColor }}>8</strong>条洞察。
              继续保持好奇心！"
            </p>
          </div>
        </div>

        <div style={{
          background: '#252525',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <h3 style={{ color: 'white', fontSize: '14px', marginBottom: '12px' }}>
            风格参数
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
          }}>
            <div style={{ color: '#888', fontSize: '12px' }}>
              边框色: <span style={{ color: style.borderColor }}>{style.borderColor}</span>
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              背景色: <span style={{ color: style.bgColor }}>{style.bgColor}</span>
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              强调色: <span style={{ color: style.accentColor }}>{style.accentColor}</span>
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              角落装饰: <span style={{ color: style.accentColor }}>{style.cornerDecor || '无'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
