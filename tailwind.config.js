export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#1f1410', 2: '#2c1d16', 3: '#3f2a1f' },
        cream: { DEFAULT: '#fdf1d8', dim: '#cdb48e' },
        amber: { DEFAULT: '#ffb547', deep: '#e08a1e' },
        sage: { DEFAULT: '#8fe0a0', deep: '#3fb070' },
        berry: '#ff5a5a',
        mist: '#7fd8ff',
        rose: '#ff8ab0',
        wood: { DEFAULT: '#9a5f34', hi: '#d6965a', lo: '#5a3520', ink: '#140b07' },
        parch: { DEFAULT: '#f3dcab', lo: '#c9a46a', ink: '#3a2012' }
      },
      fontFamily: {
        display: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        pixel: ['"Pixelify Sans"', '"Noto Sans SC"', 'monospace']
      }
    }
  }
};
