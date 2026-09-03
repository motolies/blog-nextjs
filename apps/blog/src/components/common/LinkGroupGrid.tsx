import type { ReactNode } from 'react';

/**
 * 홈의 링크 그룹 카드 그리드 — 공개 즐겨찾기(FAVORITE)와 관리자 전용 플랫폼(PLATFORM)이 공유한다.
 *
 * LinkRow 와 같은 이유로 뽑아냈다. 두 섹션이 같은 페이지에 세로로 붙어 있어 열 리듬이 어긋나면
 * 버그처럼 읽히는데, 클래스 문자열을 각자 들고 있으면 한쪽만 고쳐지는 사고가 난다.
 * 플랫폼 섹션은 관리자에게만 보이므로 갈라져도 비로그인 QA 로는 잡히지 않는다.
 *
 * 칼럼 수 근거(2026-09 실측):
 * - .public-container 가 --public-max-width(90rem=1440px)에서 캡되므로 1440 이상은 전부 같은
 *   레이아웃이다. 2xl: 단계를 더해도 아무것도 바뀌지 않는다.
 * - 본문이 JetBrains Mono/D2Coding 고정폭이라 라틴 한 글자가 8.4px(14px 기준)로 비례 폰트보다
 *   20~30% 넓다. 4칼럼(카드 326px)은 링크 이름 가용 폭이 218px(라틴 25자·한글 15자)인데,
 *   5칼럼(256px)은 148px(17자·10자)로 떨어져 "Spring Boot Reference" 길이가 전부 잘린다.
 * - lg(1024~1279)를 3칼럼으로 둔 것은 사이트의 다른 카드 그리드(PostComponent 관련 글,
 *   util 페이지)와 같은 규약이다. 2칼럼이면 카드 폭의 40% 가 빈 띠로 남는다.
 *
 * 행 우선 배치 + 기본 align-items: stretch — 짧은 카드도 옆 카드 높이만큼 늘어나 빈 공간이
 * 카드 안에 담긴다. 카드 내부 ul 의 grid-cols-[minmax(0,1fr)] 처방과 함께 써야 넘치지 않는다.
 *
 * 'use client' 를 넣지 않는다 — 순수 렌더라 서버 컴포넌트(홈)와 클라이언트 컴포넌트(플랫폼 섹션)
 * 양쪽에서 그대로 쓰인다. id 는 플랫폼 섹션의 접기 버튼이 aria-controls 로 가리키기 위한 것.
 */
export default function LinkGroupGrid({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id} className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}
