/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      // Mobile-first breakpoints
      screens: {
        'xs': '475px',   // Small phones
        'sm': '640px',   // Large phones
        'md': '768px',   // Tablets
        'lg': '1024px',  // Small desktops
        'xl': '1280px',  // Large desktops
        '2xl': '1536px', // Extra large screens
      },
      
      // Game-focused color palette
      colors: {
        primary: {
          50: '#f0f9f0',
          100: '#ddf3dd',
          200: '#bee7be',
          300: '#8fd48f',
          400: '#59bc59',
          500: '#2d5016',  // Main game green
          600: '#265014',
          700: '#1f4011',
          800: '#1a340e',
          900: '#1a3009',
        },
        
        // Card suit colors
        hearts: '#dc2626',
        diamonds: '#dc2626',
        clubs: '#1f2937',
        spades: '#1f2937',
        
        // UI colors
        felt: '#2d5016',
        card: '#ffffff',
        cardBack: '#1e40af',
      },
      
      // Touch-friendly spacing
      spacing: {
        'touch': '44px',  // Minimum touch target size
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
      },
      
      // Game-specific animations
      animation: {
        'card-flip': 'cardFlip 0.6s ease-in-out',
        'card-deal': 'cardDeal 0.8s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        cardDeal: {
          '0%': { 
            transform: 'translateY(-100vh) rotate(180deg)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0) rotate(0deg)',
            opacity: '1'
          },
        },
      },
      
      // Responsive font sizes
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
      },
      
      // iOS safe areas
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}