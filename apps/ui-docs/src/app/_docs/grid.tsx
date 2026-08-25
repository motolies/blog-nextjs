import { FilterGridDemo } from '../../client/ui-test/docs/demos/layout/filter-grid';
import { TwelveColDemo } from '../../client/ui-test/docs/demos/layout/twelve-col';
import type { DocEntry } from './types';

const USAGE = `/* 별도 Grid/Row/Col 컴포넌트가 없다 — Tailwind 4 grid 가 곧 레이아웃 시스템이다 */

/* 페이지 골격: gutter 토큰(20px)이 카드 사이·본문 바깥 여백의 리듬이다 */
<main className="flex min-w-0 flex-col gap-dl-gutter p-dl-gutter">

/* 12-컬럼: 본문 8 + 요약 4 */
<section className="grid grid-cols-12 gap-dl-gutter">
  <div className="col-span-8">…</div>
  <div className="col-span-4">…</div>
</section>

/* 검색 필터: dl-filter-grid — 부모에 컨테이너 컨텍스트가 필요하다 */
<div className="[container-type:inline-size]">
  <div className="dl-filter-grid">{/* 라벨+필드 쌍들 */}</div>
</div>`;

/** 레이아웃 본문 — 어떤 도구를 언제 쓰는지의 결정표. */
function GridGuideBody() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-dl-xl font-bold text-dl-fg-strong">무엇을 언제 쓰나</h2>
      <div className="overflow-x-auto rounded-dl-container border border-dl-border bg-dl-surface">
        <table className="w-full text-dl-sm">
          <thead>
            <tr className="border-b border-dl-border bg-dl-grid-header text-left text-dl-grid-header-fg">
              <th className="px-4 py-2 font-semibold">자리</th>
              <th className="px-4 py-2 font-semibold">도구</th>
              <th className="px-4 py-2 font-semibold">근거</th>
            </tr>
          </thead>
          <tbody className="[&_td]:px-4 [&_td]:py-2 [&_tr]:border-b [&_tr]:border-dl-divider">
            <tr>
              <td>검색 조건 영역</td>
              <td>
                <code className="font-dl-mono">dl-filter-grid</code>
              </td>
              <td>
                라벨 130px + 필드, 행 54px 고정. 컨테이너 쿼리라 모달 안에서도 같은 규칙으로 접힌다
              </td>
            </tr>
            <tr>
              <td>상세 폼(라벨-값)</td>
              <td>
                <code className="font-dl-mono">FormGrid</code>
              </td>
              <td>
                라벨이 컨트롤 위. 열 최소 폭 220px 기준 auto-fit 이라 담긴 폭이 열 수를 정한다
              </td>
            </tr>
            <tr>
              <td>본문 구획(카드 배치)</td>
              <td>
                <code className="font-dl-mono">grid grid-cols-12 gap-dl-gutter</code>
              </td>
              <td>
                Tailwind 가 곧 그리드 시스템 — 래퍼 컴포넌트는 이름만 바꾼 계층이라 만들지 않는다.
                QA(card-col-*)에 존재하는 폭은 <b>4·5·6·7·8·12 여섯 개뿐</b>이니 col-span 도 그
                안에서 고른다
              </td>
            </tr>
            <tr>
              <td>단순 2컬럼</td>
              <td>
                <code className="font-dl-mono">grid gap-3 md:grid-cols-2</code>
              </td>
              <td>12 분할이 필요 없으면 필요한 만큼만 — 게시글 상세가 실제로 이렇게 쓴다</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-dl-sm text-dl-fg-muted">
        페이지 최소 폭은 <code className="font-dl-mono">--spacing-dl-app-min</code>(1430px — 기준
        뷰포트 맥북에어 13&quot; 1440×900), 여백 리듬은{' '}
        <code className="font-dl-mono">--spacing-dl-gutter</code>(20px)다 — 숫자를 직접 박지 말고{' '}
        <code className="font-dl-mono">p-dl-gutter</code>·
        <code className="font-dl-mono">gap-dl-gutter</code> 유틸리티를 쓴다.
      </p>
    </section>
  );
}

/** 레이아웃 가이드 — layout 카테고리의 첫 문서(예약 자리였다). */
export const gridDoc: DocEntry = {
  slug: 'grid',
  category: 'layout',
  title: 'Grid',
  description:
    '페이지 레이아웃 규칙 — 별도 Grid/Row/Col 컴포넌트 없이 Tailwind 4 grid 유틸리티 + 토큰(gutter·app-min)이 레이아웃 시스템이다. 검색 필터만 dl-filter-grid 커스텀 유틸리티(컨테이너 쿼리)를 쓴다.',
  usage: USAGE,
  examples: [
    {
      id: 'twelve-col',
      title: '12-컬럼',
      note: 'QA card-col 실측 — 존재하는 폭은 4·5·6·7·8·12 여섯 개뿐이고(7·5 조합만 min-width 보유), 간격 20px 는 gap-dl-gutter 토큰과 일치한다.',
      file: 'src/client/ui-test/docs/demos/layout/twelve-col.tsx',
      Component: TwelveColDemo,
    },
    {
      id: 'filter-grid',
      title: '검색 필터 그리드',
      note: '스위치로 컨테이너를 좁혀 보면 4쌍 → 2쌍으로 접힌다 — 화면 폭이 아니라 담긴 카드 폭에 반응한다(컨테이너 쿼리).',
      file: 'src/client/ui-test/docs/demos/layout/filter-grid.tsx',
      Component: FilterGridDemo,
    },
  ],
  Body: GridGuideBody,
};
