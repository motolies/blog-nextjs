'use client';

import { togglePin, type WorkTab, WorkTabsBar, type WorkTabsLabels } from '@hvy/ui';
import { useState } from 'react';

/**
 * 핀 고정과 드래그 재정렬 — **핀 그룹은 앞쪽 연속 구간**이라는 불변식이 주제다.
 *
 * 검증 포인트:
 * · 우클릭 → 핀 고정하면 탭이 핀 그룹의 **끝**으로, 해제하면 비핀 그룹의 **앞**으로 간다 —
 *   둘 다 경계에 붙으므로 탭이 화면에서 멀리 점프하지 않는다
 * · 핀 탭에는 자물쇠가 붙고 닫기 버튼이 사라진다
 * · 비핀 탭을 핀 구간 왼쪽으로 끌어도 **경계에서 멈춘다** — 아무 일도 안 일어나는 게 아니라
 *   경계까지 따라오다 멈춘다(드래그는 여러 칸을 건너뛰므로 "다르면 무시"면 고장처럼 보인다)
 * · 드래그 중에는 배열이 바뀌지 않는다: 잡은 칩만 손을 따라오고 나머지는 칩 폭만큼 비켜나며,
 *   배열은 **놓을 때 한 번** 바뀐다
 * · 4px 을 움직이기 전에는 드래그가 시작되지 않는다 — 여기가 깨지면 포인터 캡처가 click 을
 *   `<li>` 로 재타게팅해 **탭 클릭이 통째로 죽는다**(실측 버그). 살짝 눌렀다 떼면 활성 전환이,
 *   끌면 재정렬이 되는지 둘 다 확인할 것
 * · Cmd/Ctrl+클릭·가운데 클릭은 브라우저 기본대로 새 탭으로 열린다(칩이 `<a href>` 인 이유)
 * · 순서가 바뀌면 sr-only aria-live 로 안내가 나간다 — reorderDone 을 주지 않으면 생략된다
 */

const LABELS: WorkTabsLabels = {
  tabBar: '게시글 작업 탭',
  close: '닫기',
  closeOthers: '다른 탭 모두 닫기',
  closeRight: '오른쪽 탭 닫기',
  closeUnpinned: '핀 제외 전체 닫기',
  closeUnpinnedConfirm: '핀 고정하지 않은 탭을 모두 닫을까요?',
  pin: '핀 고정',
  unpin: '핀 해제',
  listMenu: '전체 탭 목록',
  scrollPrev: '탭 왼쪽으로 스크롤',
  scrollNext: '탭 오른쪽으로 스크롤',
  reorderDone: (title, position, total) => `${title}, ${position}번째로 이동. 전체 ${total}개.`,
};

const INITIAL: readonly WorkTab[] = [
  { id: '/admin/posts', href: '/admin/posts', title: '목록', pinned: true, lastActivatedAt: 0 },
  { id: '/admin/tags', href: '/admin/tags', title: '태그 관리', pinned: true, lastActivatedAt: 0 },
  {
    id: '/p/100014',
    href: '/p/100014',
    title: '접근성 체크리스트',
    pinned: false,
    lastActivatedAt: 0,
  },
  {
    id: '/p/100027',
    href: '/p/100027',
    title: '디자인 토큰 설계',
    pinned: false,
    lastActivatedAt: 0,
  },
  { id: '/p/100031', href: '/p/100031', title: '주간 회고', pinned: false, lastActivatedAt: 0 },
];

export function WorkTabsPinReorderDemo() {
  const [tabs, setTabs] = useState<readonly WorkTab[]>(INITIAL);
  const [activeId, setActiveId] = useState<string | null>(INITIAL[2]?.id ?? null);

  const pinnedCount = tabs.filter((tab) => tab.pinned).length;

  return (
    <div className="flex flex-col gap-2">
      <WorkTabsBar
        tabs={tabs}
        activeId={activeId}
        labels={LABELS}
        onSelect={(tab) => setActiveId(tab.id)}
        onClose={(id) => setTabs(tabs.filter((tab) => tab.id !== id))}
        onCloseOthers={(id) => setTabs(tabs.filter((tab) => tab.pinned || tab.id === id))}
        onCloseRight={(id) => {
          const anchor = tabs.findIndex((tab) => tab.id === id);
          setTabs(tabs.filter((tab, index) => tab.pinned || index <= anchor));
        }}
        onCloseUnpinned={() => setTabs(tabs.filter((tab) => tab.pinned))}
        onTogglePin={(id) => setTabs(togglePin(tabs, id))}
        onReorder={setTabs}
        className="bg-dl-canvas px-dl-gutter pt-dl-gutter"
      />
      {/* 불변식을 화면에 드러낸다 — 깨지면 여기서 먼저 보인다. */}
      <p className="text-dl-xs text-dl-fg-muted">
        핀 {pinnedCount}개 ·{' '}
        <span className="font-dl-mono">
          {tabs.map((tab) => (tab.pinned ? '📌' : '·')).join('')}
        </span>{' '}
        — 핀 표식이 앞쪽 연속 구간이어야 한다. 중간에 끊기면 불변식이 깨진 것이다.
      </p>
    </div>
  );
}
