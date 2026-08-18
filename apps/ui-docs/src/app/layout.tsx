import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { UiTestShell } from '../client/ui-test/shell';
import { navGroups } from './_docs/registry';
import './theme.css';

export const metadata = {
  title: '@hvy/ui 컴포넌트 문서',
  description: '@hvy/ui 컴포넌트 문서 사이트 (로컬 전용)',
};

/**
 * 첫 페인트 전에 `?theme=` 를 `<html data-theme>` 로 반영한다.
 *
 * layout 은 searchParams 를 받지 못하므로(Next 계약) 인라인 스크립트가 SSR 시점의
 * 유일한 수단이다 — body 첫 자식의 클래식 인라인 스크립트는 파서 블로킹이라
 * 첫 페인트 전에 실행된다(next-themes 와 같은 패턴). React 19 는
 * dangerouslySetInnerHTML 스크립트를 head 로 호이스팅하지 않아 위치가 보존된다.
 *
 * 값 화이트리스트를 여기 복제하지 않는다(THEMES 와의 이중 관리 방지) — 형식만
 * 검사하고, 미지 테마는 매치되는 CSS 가 없어 default 로 보인다. 뒤로가기·주소창
 * 편집 등 스크립트가 재실행되지 않는 경로의 동기화는 ThemeSelect 의 effect 가 맡는다.
 */
const THEME_INIT = `(function(){var t=new URLSearchParams(location.search).get('theme');if(t&&t!=='default'&&/^[a-z][a-z0-9-]*$/.test(t))document.documentElement.dataset.theme=t})()`;

/**
 * 문서 앱 루트 — 사이드바 목차는 문서 레지스트리(`_docs/registry.ts`)에서 파생해
 * 셸에 내린다. 새 문서를 등록하면 여기와 셸은 손대지 않아도 목차에 나타난다.
 *
 * 셸이 useSearchParams 를 쓰므로 Suspense 경계가 필요하다 — 없으면 정적
 * 프리렌더(/_not-found)가 빌드에서 실패한다. lang 은 ko 고정(개발자용 화면).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: 인라인 스크립트가 hydration 전에 data-theme 을 붙이므로
    // 서버 HTML 과 속성이 어긋난다 — 의도된 어긋남이다(next-themes 와 동일 패턴).
    <html lang="ko" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <Suspense>
          <UiTestShell nav={navGroups()}>{children}</UiTestShell>
        </Suspense>
      </body>
    </html>
  );
}
