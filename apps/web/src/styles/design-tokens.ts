export const designTokens = {
  colors: {
    paper: {
      DEFAULT: '#F5F2E8',
      warm: '#EDE9DC',
      dark: '#E5E0D0',
    },
    ink: {
      DEFAULT: '#2C2416',
      light: '#5A4D3A',
      muted: '#6C5E49',
    },
    accent: {
      DEFAULT: '#A63D2F',
      dark: '#7F2F24',
      light: '#F5E6E3',
    },
    gold: {
      DEFAULT: '#8B6914',
      light: '#F5EBD3',
    },
    border: '#B8AE96',
    borderStrong: '#8F8269',
    inkReading: '#5F5240',
    surface: {
      raised: '#FBF8F2',
      soft: '#F1EBDF',
    },
    semantic: {
      success: '#2D5A27',
      warning: '#8B6914',
      error: '#8B2500',
    },
  },
  
  typography: {
    fontFamily: {
      serifCn: "'Noto Serif SC', serif",
      sansCn: "'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
      latinElegant: "'EB Garamond', 'Times New Roman', 'Georgia', serif",
      articleTitleCn: "'Noto Serif SC', serif",
      labelCn: "'Noto Serif SC', serif",
    },
    fontSize: {
      xs: '0.625rem',
      sm: '0.75rem',
      base: '0.875rem',
      md: '0.9375rem',
      lg: '1rem',
      xl: '1.125rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.05em',
      wider: '0.1em',
      widest: '0.15em',
      widest2: '0.2em',
      widest3: '0.3em',
    },
    lineHeight: {
      tight: 1,
      normal: 1.45,
      relaxed: 1.5,
      loose: 1.6,
    },
    semanticSize: {
      pageTitle: '1.75rem',
      sectionTitle: '0.875rem',
      cardTitle: '1rem',
      body: '0.9375rem',
      bodyLg: '1rem',
      meta: '0.8125rem',
      micro: '0.75rem',
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
  },
  
  borderRadius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
  },
  
  shadows: {
    offset: '2px 2px 0 var(--paper-dark)',
    offsetLg: '3px 3px 0 var(--paper-dark)',
    paper: '0 4px 20px rgba(26, 22, 18, 0.08)',
    soft: '0 8px 20px rgba(44, 36, 22, 0.08)',
  },
  
  transitions: {
    fast: '0.1s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
  
  animation: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideUp: {
      from: { opacity: 0, transform: 'translateY(20px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
  },
};

export type DesignTokens = typeof designTokens;
