import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Palette IMAGINE - Cognitive Richness
      colors: {
        // Fond cognitif - noir profond habité
        'imagine-bg': '#0B0F14',
        'imagine-bg-light': '#0F1419',
        'imagine-bg-elevated': '#151B23',
        'imagine-bg-hover': '#1A2129',
        
        // Bleu nébuleuse - idées stables
        'imagine-nebula': {
          DEFAULT: '#1E3A5F',
          light: '#2A4D7A',
          dark: '#152942',
          glow: '#1E3A5F40',
        },
        
        // Violet intuition - liens abstraits
        'imagine-intuition': {
          DEFAULT: '#5B4B8A',
          light: '#7B6BAA',
          dark: '#3B2B6A',
          glow: '#5B4B8A40',
        },
        
        // Cyan projection - suggestions IA
        'imagine-projection': {
          DEFAULT: '#4FD1C5',
          light: '#6FE1D5',
          dark: '#2FB1A5',
          glow: '#4FD1C540',
        },
        
        // Blanc diffus - texte principal
        'imagine-text': {
          DEFAULT: '#E6EDF3',
          muted: '#8B949E',
          subtle: '#484F58',
          ghost: '#2D333B',
        },
        
        // Accents existants
        'imagine-spark': '#FFB347',
        'imagine-forge': '#FF6B6B',
        'imagine-drift': '#A78BFA',
        
        // ✨ Nouvelles couleurs sémantiques
        // Or diffus - idée mature
        'imagine-mature': {
          DEFAULT: '#C7A76C',
          light: '#D9C08F',
          dark: '#A68B4B',
          glow: '#C7A76C30',
        },
        
        // Rouge sombre - conflit conceptuel
        'imagine-conflict': {
          DEFAULT: '#6E2B2B',
          light: '#8E4B4B',
          dark: '#4E1B1B',
          glow: '#6E2B2B40',
        },
        
        // Vert profond - cohérence forte
        'imagine-coherence': {
          DEFAULT: '#2E5F4F',
          light: '#3E7F6F',
          dark: '#1E4F3F',
          glow: '#2E5F4F40',
        },
        
        // Surface pour les cartes
        'imagine-surface': {
          DEFAULT: '#171D24',
          light: '#1E252E',
          dark: '#10151A',
          matte: '#1A1F26',
        },
        
        // Bordures subtiles
        'imagine-border': {
          DEFAULT: '#2D333B',
          light: '#3D434B',
          subtle: '#21262D',
        },
      },
      
      fontFamily: {
        sans: ['Inter', 'Satoshi', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
      },
      
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      
      // Animations organiques enrichies
      transitionDuration: {
        'slow': '600ms',
        'gentle': '400ms',
        'breath': '300ms',
        'drift': '800ms',
        'emerge': '500ms',
      },
      
      transitionTimingFunction: {
        'organic': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'breath': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'float': 'cubic-bezier(0.45, 0, 0.55, 1)',
        'emerge': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'cognitive': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'breathe': 'breathe 4s ease-in-out infinite',
        // Nouvelles animations cognitives
        'drift': 'drift 20s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'emerge': 'emerge 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'field-flow': 'fieldFlow 15s linear infinite',
        'particle-float': 'particleFloat 8s ease-in-out infinite',
        'node-breathe': 'nodeBreathe 4s ease-in-out infinite',
        'link-trace': 'linkTrace 0.8s ease-out forwards',
        'halo-pulse': 'haloPulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'constellation': 'constellation 30s linear infinite',
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { opacity: '0.4' },
          '100%': { opacity: '0.8' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        // Nouvelles keyframes cognitives
        drift: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(10px, -10px) rotate(1deg)' },
          '50%': { transform: 'translate(-5px, 5px) rotate(-0.5deg)' },
          '75%': { transform: 'translate(-10px, -5px) rotate(0.5deg)' },
          '100%': { transform: 'translate(0, 0) rotate(0deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(79, 209, 197, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(79, 209, 197, 0.4)' },
        },
        emerge: {
          '0%': { opacity: '0', transform: 'scale(0.9) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        fieldFlow: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        particleFloat: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.3' },
          '25%': { transform: 'translateY(-20px) translateX(10px)', opacity: '0.6' },
          '50%': { transform: 'translateY(-10px) translateX(-5px)', opacity: '0.4' },
          '75%': { transform: 'translateY(-30px) translateX(-10px)', opacity: '0.5' },
        },
        nodeBreathe: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)' },
          '50%': { transform: 'scale(1.005)', boxShadow: '0 6px 25px rgba(0, 0, 0, 0.35)' },
        },
        linkTrace: {
          '0%': { strokeDashoffset: '100%', opacity: '0' },
          '100%': { strokeDashoffset: '0%', opacity: '1' },
        },
        haloPulse: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        constellation: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      
      boxShadow: {
        'glow-sm': '0 0 10px rgba(79, 209, 197, 0.2)',
        'glow-md': '0 0 20px rgba(79, 209, 197, 0.3)',
        'glow-lg': '0 0 40px rgba(79, 209, 197, 0.4)',
        'node': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'node-active': '0 8px 30px rgba(79, 209, 197, 0.3)',
        // Ombres profondes pour cartes vivantes
        'card-deep': '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)',
        'card-glow': '0 0 30px rgba(79, 209, 197, 0.15), 0 8px 32px rgba(0, 0, 0, 0.5)',
        // Halos sémantiques
        'halo-mature': '0 0 40px rgba(199, 167, 108, 0.3)',
        'halo-conflict': '0 0 40px rgba(110, 43, 43, 0.4)',
        'halo-coherence': '0 0 40px rgba(46, 95, 79, 0.3)',
        'halo-ia': '0 0 50px rgba(79, 209, 197, 0.25)',
        // Inner shadows
        'inner-glow': 'inset 0 0 20px rgba(79, 209, 197, 0.1)',
        'inner-depth': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      
      backdropBlur: {
        'xs': '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      
      backgroundImage: {
        // Gradients cognitifs
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-cognitive': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
