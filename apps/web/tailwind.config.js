/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // WokGen palette — mirrors spec.json exactly
        wok: {
          void:       '#000000',
          ink:        '#1A1C2C',
          plum:       '#5D275D',
          crimson:    '#B13E53',
          ember:      '#EF7D57',
          gold:       '#FFCD75',
          lime:       '#A7F070',
          green:      '#38B764',
          teal:       '#257179',
          navy:       '#29366F',
          blue:       '#3B5DC9',
          sky:        '#41A6F6',
          ice:        '#73EFF7',
          snow:       '#F4F4F4',
          mist:       '#94B0C2',
          slate:      '#566C86',
          dusk:       '#333C57',
          shadow:     '#2E222F',
          indigo:     '#3F3F74',
          wine:       '#45283C',
          rust:       '#663931',
          tan:        '#8F563B',
          orange:     '#DF7126',
          sand:       '#D9A066',
          cream:      '#EEC39A',
          yellow:     '#FBF236',
          chartreuse: '#99E550',
          grass:      '#6ABE30',
          sage:       '#37946E',
          olive:      '#4B692F',
          khaki:      '#524B24',
          dark:       '#323C39',
        },
        // Semantic surface tokens
        surface: {
          base:    '#0d0d14',
          raised:  '#13131f',
          overlay: '#1a1a2e',
          border:  '#252538',
          hover:   '#1e1e30',
          muted:   '#0a0a10',
        },
        accent: {
          DEFAULT: '#41A6F6',
          hover:   '#73EFF7',
          muted:   '#29366F',
          dim:     '#1e2d52',
        },
        success: {
          DEFAULT: '#38B764',
          hover:   '#A7F070',
          muted:   '#1a3a29',
        },
        warning: {
          DEFAULT: '#FFCD75',
          hover:   '#FBF236',
          muted:   '#3a2f0e',
        },
        danger: {
          DEFAULT: '#B13E53',
          hover:   '#EF7D57',
          muted:   '#2e1219',
        },
        rarity: {
          common:    '#94B0C2',
          uncommon:  '#38B764',
          rare:      '#41A6F6',
          epic:      '#5D275D',
          legendary: '#FFCD75',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        112: '28rem',
        128: '32rem',
      },
      borderRadius: {
        none:  '0px',
        px:    '1px',
        '2px': '2px',
        sm:    '2px',
        DEFAULT: '3px',
        md:    '3px',
        lg:    '4px',
        xl:    '4px',
        '2xl': '4px',
        '3xl': '4px',
        full:  '9999px',
      },
      boxShadow: {
        glow:      '0 0 12px 2px rgba(65,166,246,0.25)',
        'glow-sm': '0 0 6px 1px rgba(65,166,246,0.2)',
        'glow-lg': '0 0 24px 4px rgba(65,166,246,0.3)',
        'glow-green': '0 0 12px 2px rgba(56,183,100,0.3)',
        'glow-gold':  '0 0 12px 2px rgba(255,205,117,0.3)',
        pixel:     '4px 4px 0 0 #000000',
        'pixel-sm': '2px 2px 0 0 #000000',
        inner:     'inset 0 2px 6px rgba(0,0,0,0.6)',
        panel:     '0 4px 24px rgba(0,0,0,0.5)',
        card:      '0 2px 12px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'grid-dark': `
          linear-gradient(rgba(65,166,246,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(65,166,246,0.04) 1px, transparent 1px)
        `,
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-panel':  'linear-gradient(180deg, #13131f 0%, #0d0d14 100%)',
        'gradient-hero':   'linear-gradient(135deg, #0d0d14 0%, #13131f 50%, #1a1a2e 100%)',
        'scanlines': `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0,0,0,0.08) 2px,
          rgba(0,0,0,0.08) 4px
        )`,
      },
      backgroundSize: {
        grid: '24px 24px',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px 1px rgba(65,166,246,0.2)' },
          '50%':       { boxShadow: '0 0 18px 3px rgba(65,166,246,0.4)' },
        },
        'pulse-glow-gold': {
          '0%, 100%': { boxShadow: '0 0 8px 1px rgba(255,205,117,0.2)' },
          '50%':       { boxShadow: '0 0 18px 3px rgba(255,205,117,0.45)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-6px)' },
        },
        'pixel-pop': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        spin: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        progress: {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'fade-in':         'fade-in 0.2s ease-out both',
        'fade-in-fast':    'fade-in-fast 0.12s ease-out both',
        'slide-in-left':   'slide-in-left 0.2s ease-out both',
        'slide-in-right':  'slide-in-right 0.2s ease-out both',
        'scale-in':        'scale-in 0.18s ease-out both',
        'pulse-glow':      'pulse-glow 2s ease-in-out infinite',
        'pulse-glow-gold': 'pulse-glow-gold 2s ease-in-out infinite',
        shimmer:           'shimmer 2s linear infinite',
        blink:             'blink 1.2s step-end infinite',
        float:             'float 3s ease-in-out infinite',
        'pixel-pop':       'pixel-pop 0.25s ease-out',
        spin:              'spin 0.8s linear infinite',
        progress:          'progress 30s linear forwards',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        snappy:     'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      ringColor: {
        DEFAULT: '#41A6F6',
      },
      // Pixel-grid sizes for asset preview
      maxWidth: {
        canvas: '640px',
      },
      gridTemplateColumns: {
        studio:  '380px 1fr',
        gallery: 'repeat(auto-fill, minmax(148px, 1fr))',
      },
    },
  },
  plugins: [
    // Pixel-art image rendering helper
    function ({ addUtilities }) {
      addUtilities({
        '.render-pixel': {
          'image-rendering': 'pixelated',
          '-ms-interpolation-mode': 'nearest-neighbor',
        },
        '.render-crisp': {
          'image-rendering': '-webkit-optimize-contrast',
          'image-rendering': 'crisp-edges',
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#333C57 transparent',
        },
        '.scrollbar-none': {
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.text-shadow-glow': {
          'text-shadow': '0 0 12px rgba(65,166,246,0.6)',
        },
        '.text-shadow-gold': {
          'text-shadow': '0 0 12px rgba(255,205,117,0.6)',
        },
        '.border-pixel': {
          'border-style': 'solid',
          'border-width': '2px',
          'image-rendering': 'pixelated',
        },
        '.bg-grid': {
          'background-image': `
            linear-gradient(rgba(65,166,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(65,166,246,0.04) 1px, transparent 1px)
          `,
          'background-size': '24px 24px',
        },
        '.selection-wok': {
          '::selection': {
            'background-color': 'rgba(65,166,246,0.3)',
            color: '#F4F4F4',
          },
        },
      });
    },
  ],
};
