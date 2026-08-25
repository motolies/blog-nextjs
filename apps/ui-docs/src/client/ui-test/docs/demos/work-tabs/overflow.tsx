'use client';

import { closeTab, type WorkTab, WorkTabsBar, type WorkTabsLabels } from '@hvy/ui';
import { useState } from 'react';

/**
 * 오버플로 — 칩이 넘칠 때의 스크롤 컨트롤과 전체 목록.
 *
 * 좁은 컨테이너에 탭 12개를 미리 채워 둔다. 검증 포인트:
 * · 넘칠 때만 좌우 화살표가 나타난다 — 우하단 핸들로 상자를 넓혀 넘치지 않게 만들면 사라진다
 * · 스크롤바는 숨겨져 있고 화살표·휠로만 움직인다
 * · 전체 목록(≡)에서 **화면 밖 탭**을 고르면 그 탭이 보이는 곳까지 자동으로 스크롤된다 —
 *   이게 없으면 드롭다운으로 고른 탭이 화면 밖에 남아 아무 일도 안 한 것처럼 보인다
 * · 탭을 전부 닫으면 ≡ 가, 전부 핀이면 ×(핀 제외 전체 닫기)가 비활성이다
 * · 활성 칩은 굵은 글자 + 하단 3px primary 라인이다 — 캔버스 배경 위에서 비활성 칩과
 *   구별되는지 본다(문서가 흰 배경을 쓰면 이 대조가 거짓말이 되므로 bg-dl-canvas 위에 놓았다)
 */

const LABELS: WorkTabsLabels = {
  tabBar: '게시글 작업 탭',
  close: '닫기',
  closeOthers: '다른 탭 모두 닫기',
  closeRight: '오른쪽 탭 닫기',
  closeUnpinned: '핀 제외 전체 닫기',
  closeUnpinnedConfirm: '핀 고정하지 않은 탭을 모두 닫을까요? 닫은 탭은 되돌릴 수 없습니다.',
  pin: '핀 고정',
  unpin: '핀 해제',
  listMenu: '전체 탭 목록',
  scrollPrev: '탭 왼쪽으로 스크롤',
  scrollNext: '탭 오른쪽으로 스크롤',
};

const TITLES = [
  'App Router 이행 메모',
  '접근성 체크리스트',
  '디자인 토큰 설계',
  'Tailwind 4 마이그레이션',
  '가상 스크롤 함정',
  'RSC 데이터 흐름',
  '폼 상태 계약',
  'CI 파이프라인 정리',
  '테스트 전략 회고',
  '쿼리 튜닝 노트',
  '번들 크기 줄이기',
  '주간 회고 2026-07',
];

/** 12개인 이유: 아래 상자 폭(560px)에서 확실히 넘쳐 스크롤 컨트롤이 뜨는 최소치보다 넉넉하다. */
const INITIAL: readonly WorkTab[] = TITLES.map((title, index) => ({
  id: `/admin/posts/POST-1000${String(index + 10)}`,
  href: `/admin/posts/POST-1000${String(index + 10)}`,
  title,
  pinned: index === 0,
  lastActivatedAt: 0,
}));

export function WorkTabsOverflowDemo() {
  const [tabs, setTabs] = useState<readonly WorkTab[]>(INITIAL);
  const [activeId, setActiveId] = useState<string | null>(INITIAL[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-2">
      {/*
        resize 는 overflow 가 visible 이 아니어야 동작한다 — overflow-hidden 이
        리사이즈 조건이자 "좁으면 넘친다"를 눈으로 보는 장치다.
      */}
      <div className="w-[560px] max-w-full resize-x overflow-hidden rounded-dl-container border border-dl-border border-dashed">
        <WorkTabsBar
          tabs={tabs}
          activeId={activeId}
          labels={LABELS}
          onSelect={(tab) => setActiveId(tab.id)}
          onClose={(id) => setTabs(closeTab(tabs, id))}
          onCloseOthers={(id) => setTabs(tabs.filter((tab) => tab.pinned || tab.id === id))}
          onCloseRight={(id) => {
            const anchor = tabs.findIndex((tab) => tab.id === id);
            setTabs(tabs.filter((tab, index) => tab.pinned || index <= anchor));
          }}
          onCloseUnpinned={() => setTabs(tabs.filter((tab) => tab.pinned))}
          onTogglePin={(id) =>
            setTabs(tabs.map((tab) => (tab.id === id ? { ...tab, pinned: !tab.pinned } : tab)))
          }
          onReorder={setTabs}
          className="bg-dl-canvas px-dl-gutter pt-dl-gutter"
        />
      </div>
      <p className="text-dl-xs text-dl-fg-muted">
        열린 탭 {tabs.length}개 · 상자 우하단 핸들을 끌어 폭을 바꿔 보면 화살표가 나타났다 사라진다.
        ≡ 에서 오른쪽 끝 탭을 고르면 그 자리까지 스크롤된다.
      </p>
    </div>
  );
}
