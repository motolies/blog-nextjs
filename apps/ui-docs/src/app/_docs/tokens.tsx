import { TokensSection } from '../../client/ui-test/docs/demos/tokens/live';
import { ScaleDemo } from '../../client/ui-test/docs/demos/tokens/scale';
import type { DocEntry } from './types';

const USAGE = `/* packages/ui/src/theme/default.css 가 토큰 구조(2티어)와 default 팔레트의 원본이다 */
--dl-brand-500: <hex 원색>;                 /* Tier 1 원색 — 유틸리티를 만들지 않는다. hex 는 theme/ 에만 존재한다 */
--color-dl-primary: var(--dl-brand-500);    /* Tier 2 의미 토큰 — bg-dl-primary 유틸리티가 된다 */

/* 다른 테마는 theme/<name>.css 가 :root[data-theme='<name>'] 스코프로 팔레트만 재정의한다.
   앱은 그 파일을 @import 하고 <html data-theme> 로 선택한다 — 키 집합은 verify:tokens 가 강제 */

/* 컴포넌트에서는 토큰 유틸리티만 쓴다 — hex/기본 팔레트는 verify:tokens 가 막는다 */
<div className="bg-dl-surface text-dl-fg border-dl-border rounded-dl-container" />`;

/** 토큰 문서 — CSS 에 실제로 존재하는 값을 실측해 보여준다. */
export const tokensDoc: DocEntry = {
  slug: 'tokens',
  category: 'foundations',
  title: 'Tokens',
  description:
    '테마 토큰 실측 — 소스(theme/default.css)가 아니라 document.styleSheets 의 선언 이름과 getComputedStyle 의 계산 값을 나란히 놓는다. 선언과 실제가 갈라지는 경로(@theme static 이 풀림 · 런타임 덮어쓰기)가 에러 없이 일어나므로 브라우저에서만 드러나기 때문이다. 토큰을 추가하면 자동으로 나타난다.',
  usage: USAGE,
  examples: [
    {
      id: 'scale',
      title: '컨트롤 스케일 5단',
      note: '상단 테마 선택을 compact 로 바꾸면 전 단계가 일괄 축소된다 — 치수·폰트가 테마 스케일(--dl-scale-* 5키)에서 calc 로 유도된다는 실증이다. 공식·값 표는 theme/default.css 치수 섹션이 정본이다.',
      file: 'src/client/ui-test/docs/demos/tokens/scale.tsx',
      Component: ScaleDemo,
    },
    {
      id: 'live',
      title: '선언 vs 실측',
      note: '"CSS 에 없음"이 하나라도 뜨면 @theme static 이 풀렸거나 이름이 바뀐 것이다 — useTokenPx 가 조용히 fallback 으로 떨어진다.',
      file: 'src/client/ui-test/docs/demos/tokens/live.tsx',
      Component: TokensSection,
    },
  ],
};
