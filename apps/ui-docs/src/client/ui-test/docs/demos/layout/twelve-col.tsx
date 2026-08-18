'use client';

/**
 * 12-컬럼 데모 — 별도 Grid/Row/Col 컴포넌트가 **없는 것이 설계**다.
 * Tailwind 4 의 grid 유틸리티가 곧 레이아웃 시스템이고, 래퍼 컴포넌트를 만들면
 * 같은 것을 이름만 바꿔 감싸는 계층이 하나 늘 뿐이다.
 *
 * QA `_layout.css` 의 `.card-col-*` 실측: 존재하는 폭은 **4·5·6·7·8·12 여섯 개뿐**이고
 * (1·2·3·9·10·11 은 명세에 없다), 간격은 20px — `gap-dl-gutter` 토큰과 일치한다.
 * QA 는 flex+calc 로 구현했지만 결과 폭은 grid-cols-12 + col-span-* 과 동일하다.
 */
export function TwelveColDemo() {
  const cell =
    'flex h-10 items-center justify-center rounded-dl-control bg-dl-tonal text-dl-xs font-semibold text-dl-tonal-fg';

  return (
    <div className="flex flex-col gap-dl-gutter">
      <div className="grid grid-cols-12 gap-dl-gutter">
        <div className={`${cell} col-span-12`}>12</div>
      </div>
      <div className="grid grid-cols-12 gap-dl-gutter">
        <div className={`${cell} col-span-6`}>6</div>
        <div className={`${cell} col-span-6`}>6</div>
      </div>
      <div className="grid grid-cols-12 gap-dl-gutter">
        <div className={`${cell} col-span-4`}>4</div>
        <div className={`${cell} col-span-4`}>4</div>
        <div className={`${cell} col-span-4`}>4</div>
      </div>
      <div className="grid grid-cols-12 gap-dl-gutter">
        <div className={`${cell} col-span-8`}>8 — 본문</div>
        <div className={`${cell} col-span-4`}>4 — 요약 패널</div>
      </div>
      {/* QA 는 7·5 조합에만 min-width(548/442px)를 둔다 — 대시보드 좌우 분할 실측치 */}
      <div className="grid grid-cols-12 gap-dl-gutter">
        <div className={`${cell} col-span-7 min-w-[548px]`}>7 (min 548)</div>
        <div className={`${cell} col-span-5 min-w-[442px]`}>5 (min 442)</div>
      </div>
    </div>
  );
}
