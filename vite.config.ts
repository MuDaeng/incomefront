import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // REACT_APP_API_URL(.env.production, .env.local, Vercel)을 그대로 쓴다
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    // Google 로그인은 백엔드 FRONTEND_URL(http://localhost:3000)로만 돌아온다
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'build',
    // 코드 분할 없이 한 번들로 내보낸다(CRA 때와 같음). 경고 기준만 올린다
    chunkSizeWarningLimit: 1600,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.{spec,test}.{ts,tsx}'],
    setupFiles: ['src/setupTests.ts'],
    // 페이지 테스트는 MUI 다이얼로그·Autocomplete를 실제로 그려서 느린 환경(CI, 전체 실행)에서 오래 걸릴 수 있다
    testTimeout: 20000,
    alias: [
      // 차트는 jsdom에서 크기를 잴 수 없어서 페이지 테스트는 차트 대신 stub을 그린다
      {
        find: /^@mui\/x-charts\/.*$/,
        replacement: fileURLToPath(new URL('./test/mocks/xCharts.tsx', import.meta.url)),
      },
    ],
  },
});
