import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // tsconfig 가 Next 컨벤션대로 `jsx: preserve` 라 vite(oxc 변환)가 .tsx 를 그대로 두고
  // 파싱에 실패한다. 테스트가 .tsx(문서 데모)를 import 그래프로 끌고 오는 경우를 위해
  // 변환을 명시한다 — vite 8 은 esbuild 가 아니라 oxc 가 변환기다.
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: {
    alias: {
      // 서버 모듈을 단위 테스트하려면 필요하다. 빌드에는 영향이 없다 — 이유는 스텁 파일 주석 참조.
      'server-only': fileURLToPath(new URL('./test/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/**/*.test.ts', 'packages/**/*.test.tsx', 'apps/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.next/**'],
    environment: 'node',
  },
});
