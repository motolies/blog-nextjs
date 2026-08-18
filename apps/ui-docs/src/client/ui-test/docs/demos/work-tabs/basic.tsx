'use client';

import {
  canOpenTab,
  closeOthers,
  closeRightOf,
  closeTab,
  closeUnpinned,
  nextActiveAfterClose,
  showToast,
  togglePin,
  upsertTab,
  type WorkTab,
  WorkTabsBar,
  type WorkTabsLabels,
} from '@hvy/ui';
import { useState } from 'react';

/**
 * WorkTabsBar — **메뉴 내 로컬 상세 탭** 용도가 정본이다(전역 크롬 아님).
 * 「목록」은 바 자체의 앵커라 `pinned + closable:false` 로 고정한다 — 닫기·핀 UI 가
 * 숨고 자물쇠도 그리지 않는다. 상세를 열면 그 옆에 탭이 생긴다.
 *
 * 실제 앱에서는 내비게이션(pathname 변화)이 탭을 여닫지만 문서 앱에는 라우팅이
 * 없으므로 아래 상세 버튼이 그 역할을 시뮬레이션한다. 탭 목록은 세션 휘발이다 —
 * 영속하지 않는다(진실은 URL 이고, 새로고침 시 목록 + 현재 라우트만 남는 계약).
 */

const LABELS: WorkTabsLabels = {
  tabBar: '주문 작업 탭',
  close: '닫기',
  closeOthers: '다른 탭 모두 닫기',
  closeRight: '오른쪽 탭 닫기',
  closeUnpinned: '핀 제외 전체 닫기',
  // 확인 모달은 문서 셸의 ConfirmProvider 가 띄운다 — 실제 앱도 같은 전제다.
  closeUnpinnedConfirm: '핀 고정하지 않은 탭을 모두 닫을까요? 닫은 탭은 되돌릴 수 없습니다.',
  pin: '핀 고정',
  unpin: '핀 해제',
  listMenu: '전체 탭 목록',
  scrollPrev: '탭 왼쪽으로 스크롤',
  scrollNext: '탭 오른쪽으로 스크롤',
  reorderDone: (title, position, total) => `${title}, ${position}번째로 이동. 전체 ${total}개.`,
};

const LIST_ID = '/client/orders';

/** 메뉴 스코프 상한 — 전역 20 과 달리 로컬 탭은 좁게 잡는다. 초과 시연용으로 상세를 더 만든다. */
const LOCAL_TABS_MAX = 10;

const ANCHOR_TAB: WorkTab = {
  id: LIST_ID,
  href: LIST_ID,
  title: '목록',
  pinned: true,
  closable: false,
  lastActivatedAt: 0,
};

const DETAILS = Array.from({ length: LOCAL_TABS_MAX + 1 }, (_, index) => ({
  id: `${LIST_ID}/ORD-2408${String(index + 1).padStart(4, '0')}`,
  title: `ORD-2408${String(index + 1).padStart(4, '0')}`,
}));

export function WorkTabsBasicDemo() {
  const [tabs, setTabs] = useState<readonly WorkTab[]>([ANCHOR_TAB]);
  const [activeId, setActiveId] = useState<string | null>(LIST_ID);

  /**
   * 실제 앱의 `router.push` 자리 — 여기서는 활성 표시만 바꾼다.
   * 상한 도달 시 열지 않고 토스트만 띄운다(자동으로 닫는 대신 거부하는 것이 계약).
   */
  const navigate = (detail: { id: string; title: string }) => {
    if (!canOpenTab(tabs, detail.id, LOCAL_TABS_MAX)) {
      showToast(
        `탭은 최대 ${LOCAL_TABS_MAX}개까지 열 수 있습니다. 다른 탭을 닫고 다시 시도해 주세요.`,
        'error',
      );
      return;
    }
    setActiveId(detail.id);
    setTabs((current) =>
      upsertTab(
        current,
        { id: detail.id, href: detail.id, title: detail.title },
        Date.now(),
        LOCAL_TABS_MAX,
      ),
    );
  };

  /** 활성 탭이 사라졌으면 앵커(목록)로 돌아간다 — 앵커는 항상 남아 있다. */
  const ensureActive = (next: readonly WorkTab[]) => {
    if (activeId && next.some((tab) => tab.id === activeId)) return;
    setActiveId(next[0]?.id ?? LIST_ID);
  };

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <WorkTabsBar
        tabs={tabs}
        activeId={activeId}
        labels={LABELS}
        onSelect={(tab) => setActiveId(tab.id)}
        onClose={(id) => {
          if (id === activeId) setActiveId(nextActiveAfterClose(tabs, id)?.id ?? LIST_ID);
          setTabs(closeTab(tabs, id));
        }}
        onCloseOthers={(id) => {
          const next = closeOthers(tabs, id);
          ensureActive(next);
          setTabs(next);
        }}
        onCloseRight={(id) => {
          const next = closeRightOf(tabs, id);
          ensureActive(next);
          setTabs(next);
        }}
        onCloseUnpinned={() => {
          const next = closeUnpinned(tabs);
          ensureActive(next);
          setTabs(next);
        }}
        onTogglePin={(id) => setTabs(togglePin(tabs, id))}
        onReorder={setTabs}
        // 실제 앱의 탭 바는 캔버스(회색) 위에 놓인다(app-chrome.tsx 의 <main>) —
        // 문서가 흰 배경을 쓰면 "칩이 배경과 구별되는가"를 대조할 수 없어 거짓말이 된다.
        className="bg-dl-canvas px-dl-gutter pt-dl-gutter"
      />

      {/* 탭 페이지 — 실제 앱에서는 이 자리에 라우팅된 화면이 온다. */}
      <div className="rounded-dl-container border border-dl-border bg-dl-surface p-4">
        {activeTab ? (
          <>
            <h3 className="text-dl-sm font-semibold text-dl-fg">
              {activeTab.id === LIST_ID ? '주문 목록' : `주문 상세 — ${activeTab.title}`}
            </h3>
            <p className="mt-1 text-dl-xs text-dl-fg-muted">
              현재 URL: {activeTab.href} — 실제 앱에서는 내비게이션이 이 탭을 열고, 이 자리에
              라우팅된 화면이 렌더된다.
            </p>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {DETAILS.map((detail) => (
          <button
            key={detail.id}
            type="button"
            onClick={() => navigate(detail)}
            className="rounded-dl-badge border border-dl-border px-2.5 py-1 text-dl-xs text-dl-fg-muted hover:bg-dl-option-hover"
          >
            {detail.title} 열기
          </button>
        ))}
      </div>

      <p className="text-dl-xs text-dl-fg-muted">
        활성 화면: {activeId ?? '(없음)'} · 열린 탭 {tabs.length}개 (상한 {LOCAL_TABS_MAX} —
        도달하면 새 탭이 열리지 않고 토스트로 안내한다). 「목록」은 closable:false 앵커라 닫기·핀 UI
        가 없다.
      </p>
    </div>
  );
}
