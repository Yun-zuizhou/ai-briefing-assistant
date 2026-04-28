import { useState } from 'react';

interface StyleConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    text: string;
    textMuted: string;
    border: string;
  };
  borderRadius: number;
  shadowIntensity: 'none' | 'light' | 'medium' | 'strong';
  animationSpeed: 'none' | 'slow' | 'normal' | 'fast';
}

const stylePresets: Record<string, StyleConfig> = {
  newspaper: {
    name: '报纸风',
    colors: {
      primary: '#1A1A1A',
      secondary: '#1E3A5F',
      accent: '#C41E3A',
      background: '#F5F5F0',
      card: '#FFFFFF',
      text: '#1A1A1A',
      textMuted: '#6B6358',
      border: '#1A1A1A',
    },
    borderRadius: 0,
    shadowIntensity: 'light',
    animationSpeed: 'normal',
  },
  warm: {
    name: '温馨风',
    colors: {
      primary: '#5D4E37',
      secondary: '#8B7355',
      accent: '#D4A574',
      background: '#FDF8F3',
      card: '#FFFCF7',
      text: '#3D3427',
      textMuted: '#8B7D6B',
      border: '#E8DFD4',
    },
    borderRadius: 12,
    shadowIntensity: 'medium',
    animationSpeed: 'slow',
  },
  warmNewspaper: {
    name: '温馨简报',
    colors: {
      primary: '#4A3C2D',
      secondary: '#6B5D4D',
      accent: '#B87333',
      background: '#FAF6F0',
      card: '#FFFEF9',
      text: '#3A2E22',
      textMuted: '#7A6B5A',
      border: '#4A3C2D',
    },
    borderRadius: 0,
    shadowIntensity: 'light',
    animationSpeed: 'normal',
  },
  modern: {
    name: '现代风',
    colors: {
      primary: '#2C3E50',
      secondary: '#3498DB',
      accent: '#E74C3C',
      background: '#F8F9FA',
      card: '#FFFFFF',
      text: '#2C3E50',
      textMuted: '#7F8C8D',
      border: '#E1E8ED',
    },
    borderRadius: 8,
    shadowIntensity: 'medium',
    animationSpeed: 'fast',
  },
  minimal: {
    name: '极简风',
    colors: {
      primary: '#1A1A1A',
      secondary: '#666666',
      accent: '#1A1A1A',
      background: '#FFFFFF',
      card: '#FFFFFF',
      text: '#1A1A1A',
      textMuted: '#999999',
      border: '#EEEEEE',
    },
    borderRadius: 4,
    shadowIntensity: 'none',
    animationSpeed: 'none',
  },
};

const shadowMap = {
  none: 'none',
  light: '0 2px 8px rgba(0,0,0,0.04)',
  medium: '0 4px 12px rgba(0,0,0,0.08)',
  strong: '0 8px 24px rgba(0,0,0,0.12)',
};

const animationMap = {
  none: '0s',
  slow: '0.4s',
  normal: '0.2s',
  fast: '0.1s',
};

export default function StylePreviewPage() {
  const [currentStyle, setCurrentStyle] = useState<string>('warmNewspaper');
  const [customColors, setCustomColors] = useState<StyleConfig['colors']>(stylePresets.warmNewspaper.colors);
  
  const style = stylePresets[currentStyle];
  const colors = currentStyle === 'custom' ? customColors : style.colors;

  const generateCSS = () => {
    return `:root {
  --primary: ${colors.primary};
  --secondary: ${colors.secondary};
  --accent: ${colors.accent};
  --background: ${colors.background};
  --card: ${colors.card};
  --text: ${colors.text};
  --text-muted: ${colors.textMuted};
  --border: ${colors.border};
  --radius: ${style.borderRadius}px;
  --shadow: ${shadowMap[style.shadowIntensity]};
  --transition: ${animationMap[style.animationSpeed]};
}`;
  };

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
          🎨 风格配置器
        </h1>
        <p style={{
          color: '#888',
          marginBottom: '20px',
          fontSize: '13px',
        }}>
          选择预设风格或自定义配色
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '14px', marginBottom: '12px' }}>
              预设风格
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(stylePresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentStyle(key);
                    setCustomColors(preset.colors);
                  }}
                  style={{
                    padding: '12px 16px',
                    background: currentStyle === key ? '#2C2C2C' : '#252525',
                    border: currentStyle === key ? '2px solid white' : '2px solid transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: `${preset.borderRadius}px`,
                      background: preset.colors.accent,
                      border: `2px solid ${preset.colors.border}`,
                    }} />
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>
                      {preset.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ color: 'white', fontSize: '14px', marginBottom: '12px' }}>
              颜色调整
            </h2>
            <div style={{
              background: '#252525',
              borderRadius: '8px',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
            }}>
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => {
                      setCurrentStyle('custom');
                      setCustomColors(prev => ({
                        ...prev,
                        [key]: e.target.value,
                      }));
                    }}
                    style={{
                      width: '32px',
                      height: '24px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{
                    color: '#AAA',
                    fontSize: '12px',
                  }}>
                    {key}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ color: 'white', fontSize: '14px', marginBottom: '12px' }}>
              实时预览
            </h2>
            <div style={{
              background: colors.background,
              borderRadius: `${style.borderRadius}px`,
              padding: '16px',
              boxShadow: shadowMap[style.shadowIntensity],
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: `1px solid ${colors.border}`,
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: colors.accent,
                  borderRadius: `${style.borderRadius}px`,
                }} />
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: colors.text,
                  }}>
                    每日简报
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: colors.textMuted,
                  }}>
                    3月14日 星期六
                  </div>
                </div>
              </div>
              
              <div style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: `${style.borderRadius}px`,
                padding: '12px',
                marginBottom: '10px',
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.text,
                  marginBottom: '6px',
                }}>
                  人工智能
                </div>
                <div style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  lineHeight: 1.5,
                }}>
                  GPT-5发布，推理能力首次超越人类基准...
                </div>
                <button style={{
                  marginTop: '10px',
                  padding: '6px 14px',
                  background: colors.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: `${style.borderRadius}px`,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  记录想法
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}>
                {['今日关注', '完成待办', '连续打卡'].map((label, i) => (
                  <div key={label} style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: `${style.borderRadius}px`,
                    padding: '10px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: i === 2 ? colors.accent : colors.secondary,
                    }}>
                      {5 + i * 2}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: colors.textMuted,
                    }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            background: '#1E1E1E',
            borderRadius: '8px',
            padding: '16px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <span style={{ color: '#888', fontSize: '12px' }}>
                生成的 CSS 变量
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateCSS());
                  alert('已复制到剪贴板！');
                }}
                style={{
                  padding: '6px 12px',
                  background: '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                复制
              </button>
            </div>
            <pre style={{
              background: '#252525',
              borderRadius: '6px',
              padding: '12px',
              overflow: 'auto',
              fontSize: '11px',
              color: '#9CDCFE',
              lineHeight: 1.5,
              margin: 0,
            }}>
              {generateCSS()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
