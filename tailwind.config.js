export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0f1420', 2: '#171e2e', 3: '#222b3f' },
        cream: { DEFAULT: '#fbf3e4', dim: '#b9b4ab' },
        amber: { DEFAULT: '#ffb547', deep: '#e08a1e' },
        sage: { DEFAULT: '#7fe0a0', deep: '#3fb070' },
        berry: '#ff5a5a',
        mist: '#6fd6ff',
        rose: '#ff8ab0',
      },
      fontFamily: {
        display: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
};
