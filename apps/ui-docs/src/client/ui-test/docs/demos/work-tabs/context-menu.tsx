'use client';

import {
  closeOthers,
  closeRightOf,
  closeTab,
  closeUnpinned,
  nextActiveAfterClose,
  togglePin,
  type WorkTab,
  WorkTabsBar,
  type WorkTabsLabels,
} from '@hvy/ui';
import { useState } from 'react';

/**
 * 컨텍스트 메뉴와 일괄 닫기 — 되돌릴 수 없는 동작이 확인 모달을 거치는 자리.
 *
 * 검증 포인트:
 * · 탭을 우클릭하면 4항목(닫기 · 다른 탭 모두 닫기 · 오른쪽 탭 닫기 · 핀 고정/해제)
 * · **앵커 탭(「목록」)에서는** 자기 닫기·핀이 빠지고 **다른 탭을 닫는 항목은 그대로 남는다** —
 *   자물쇠는 "사용자가 고정했다"는 뜻이라 시스템 앵커에는 거짓말이 되기 때문이다
 * · closeOthers·closeRightOf 는 **핀 탭을 남긴다** — 지목한 탭이 사라지지 않는 것과
 *   핀이 보호되는 것을 각각 확인
 * · 우측 ×(핀 제외 전체 닫기)는 되돌릴 수 없어 확인 모달을 거치고 확인 버튼이 danger 다.
 *   **상위에 ConfirmProvider 가 없으면** 경고만 뜨고 취소로 처리되어 버튼이 고장난 것처럼
 *   보인다(문서 셸이 감싸고 있다)
 * · 일괄 닫기로 활성 탭이 사라지면 앵커로 되돌아간다 — 이 이동은 컴포넌트가 아니라 앱 몫이다
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

const LIST_ID = '/admin/posts';

const INITIAL: readonly WorkTab[] = [
  // 앵커 — pinned + closable:false. 일괄 닫기로부터의 보호는 pinned 가 맡는다.
  { id: LIST_ID, href: LIST_ID, title: '목록', pinned: true, closable: false, lastActivatedAt: 0 },
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
  {
    id: '/p/100044',
    href: '/p/100044',
    title: '번들 크기 줄이기',
    pinned: false,
    lastActivatedAt: 0,
  },
];

export function WorkTabsContextMenuDemo() {
  const [tabs, setTabs] = useState<readonly WorkTab[]>(INITIAL);
  const [activeId, setActiveId] = useState<string | null>('/p/100027');

  /** 활성 탭이 사라졌으면 앵커로 — 앵커는 항상 남아 있다. */
  const apply = (next: readonly WorkTab[]) => {
    if (!activeId || !next.some((tab) => tab.id === activeId)) setActiveId(next[0]?.id ?? LIST_ID);
    setTabs(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <WorkTabsBar
        tabs={tabs}
        activeId={activeId}
        labels={LABELS}
        onSelect={(tab) => setActiveId(tab.id)}
        onClose={(id) => {
          if (id === activeId) setActiveId(nextActiveAfterClose(tabs, id)?.id ?? LIST_ID);
          setTabs(closeTab(tabs, id));
        }}
        onCloseOthers={(id) => apply(closeOthers(tabs, id))}
        onCloseRight={(id) => apply(closeRightOf(tabs, id))}
        onCloseUnpinned={() => apply(closeUnpinned(tabs))}
        onTogglePin={(id) => setTabs(togglePin(tabs, id))}
        onReorder={setTabs}
        className="bg-dl-canvas px-dl-gutter pt-dl-gutter"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setTabs(INITIAL);
            setActiveId('/p/100027');
          }}
          className="rounded-dl-badge border border-dl-border px-2.5 py-1 text-dl-xs text-dl-fg-muted hover:bg-dl-option-hover"
        >
          되돌리기
        </button>
        <p className="text-dl-xs text-dl-fg-muted">
          열린 탭 {tabs.length}개 · 활성 {activeId ?? '(없음)'} — 「목록」과 「태그 관리」는 핀이라
          일괄 닫기에서 살아남는다.
        </p>
      </div>
    </div>
  );
}
