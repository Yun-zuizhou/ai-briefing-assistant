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
      muted: '#8B7D66',
    },
    accent: {
      DEFAULT: '#A63D2F',
      light: '#F5E6E3',
    },
    gold: {
      DEFAULT: '#8B6914',
      light: '#F5EBD3',
    },
    border: '#D4CDB8',
    semantic: {
      success: '#2D5A27',
      warning: '#8B6914',
      error: '#8B2500',
    },
  },
  
  typography: {
    fontFamily: {
      serifCn: "'Noto Serif SC', serif",
    },
    fontSize: {
      xs: '0.5625rem',
      sm: '0.625rem',
      base: '0.75rem',
      md: '0.8125rem',
      lg: '0.875rem',
      xl: '0.9375rem',
      '2xl': '1.75rem',
      '3xl': '1.75rem',
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
      normal: 1.35,
      relaxed: 1.5,
      loose: 1.6,
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
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
