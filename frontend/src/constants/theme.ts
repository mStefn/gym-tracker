export const theme = {
  colors: {
    // Brand
    accent: '#ccff00',
    accentHover: '#b3e600',

    // Backgrounds
    background: '#09090b',
    surface: '#18181b',
    surfaceMuted: '#27272a',
    surfaceDark: '#09090b',

    // Borders
    border: '#27272a',
    borderLight: '#3f3f46',

    // Text
    text: '#f4f4f5',
    textMuted: '#a1a1aa',
    textSubtle: '#71717a',
    textDisabled: '#52525b',

    // Semantic
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',

    // Additional accents used by stats / UI
    blue: '#3b82f6',
    rose: '#f43f5e',
    emerald: '#10b981',
  },

  // Common visual values
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },

  shadow: {
    card: '0 20px 25px -5px rgb(0 0 0 / 0.2)',
    glow: '0 0 20px rgba(204, 255, 0, 0.15)',
    glowStrong: '0 0 25px rgba(204, 255, 0, 0.3)',
  },
} as const;