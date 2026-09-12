// ========================================
// IMAGINE - Design System Constants
// Charte graphique & identité visuelle
// ========================================

export const colors = {
  // Fond cognitif - noir profond
  bg: {
    default: '#0B0F14',
    light: '#0F1419',
    elevated: '#151B23',
  },

  // Bleu nébuleuse - idées stables
  nebula: {
    default: '#1E3A5F',
    light: '#2A4D7A',
    dark: '#152942',
  },

  // Violet intuition - liens abstraits
  intuition: {
    default: '#5B4B8A',
    light: '#7B6BAA',
    dark: '#3B2B6A',
  },

  // Cyan projection - suggestions IA
  projection: {
    default: '#4FD1C5',
    light: '#6FE1D5',
    dark: '#2FB1A5',
  },

  // Blanc diffus - texte principal
  text: {
    default: '#E6EDF3',
    muted: '#8B949E',
    subtle: '#484F58',
  },

  // Accents
  spark: '#FFB347',
  forge: '#FF6B6B',
  drift: '#A78BFA',

  // Semantic
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', 'Satoshi', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
} as const;

export const animation = {
  // Durées
  duration: {
    instant: 100,
    fast: 200,
    breath: 300,
    gentle: 400,
    slow: 600,
    lazy: 1000,
  },

  // Easing - cubic-bezier
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    organic: 'cubic-bezier(0.4, 0, 0.2, 1)',
    breath: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    float: 'cubic-bezier(0.45, 0, 0.55, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },

  // Spring configs for Framer Motion
  spring: {
    gentle: { type: 'spring', stiffness: 100, damping: 15 },
    soft: { type: 'spring', stiffness: 150, damping: 20 },
    snappy: { type: 'spring', stiffness: 300, damping: 25 },
    bouncy: { type: 'spring', stiffness: 400, damping: 10 },
  },
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
  
  // Glow effects
  glowSm: '0 0 10px rgba(79, 209, 197, 0.2)',
  glowMd: '0 0 20px rgba(79, 209, 197, 0.3)',
  glowLg: '0 0 40px rgba(79, 209, 197, 0.4)',
  
  // Node shadows
  node: '0 4px 20px rgba(0, 0, 0, 0.4)',
  nodeHover: '0 8px 30px rgba(0, 0, 0, 0.5)',
  nodeActive: '0 8px 30px rgba(79, 209, 197, 0.3)',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

export const zIndex = {
  base: 0,
  canvas: 10,
  nodes: 20,
  edges: 15,
  selectedNode: 30,
  dragging: 40,
  overlay: 50,
  modal: 60,
  tooltip: 70,
  notification: 80,
} as const;

export const canvas = {
  minZoom: 0.1,
  maxZoom: 3,
  defaultZoom: 1,
  zoomStep: 0.1,
  gridSize: 40,
  snapThreshold: 10,
} as const;

export const node = {
  minWidth: 150,
  minHeight: 60,
  defaultWidth: 250,
  defaultHeight: 120,
  maxWidth: 600,
  maxHeight: 800,
  padding: 16,
  borderRadius: 12,
} as const;

// Framer Motion variants
export const motionVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  
  float: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  
  breathe: {
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  
  glow: {
    animate: {
      opacity: [0.4, 0.8, 0.4],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
} as const;

// Export all as theme
export const theme = {
  colors,
  typography,
  spacing,
  animation,
  shadows,
  borderRadius,
  zIndex,
  canvas,
  node,
  motionVariants,
} as const;

export default theme;
