'use client';

import { ChevronLeft, ChevronRight, Lock, Menu, X } from 'lucide-react';
import { ContextMenu, DropdownMenu } from 'radix-ui';
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useConfirm } from '../components/confirm';
import { shiftFor } from '../dnd/listReorder';
import { useListReorder } from '../dnd/useListReorder';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { useElementWidth } from '../lib/useElementWidth';
import type { WorkTab } from './workTabsState';

/**
 * 작업 탭 바 — **밀집 카드 탭**(IDE 탭 관례): 라운드·간격 없이 붙이고 1px 구분선으로 나눈다.
 *
 * QA `헤더 탭 메뉴`(_layout.css `.tab-menu-*`)의 상단만 둥근 칩형에서 바꾼 것이고, 근거는 실측이다 —
 * ① 비활성 칩 배경이 캔버스와 **같은 #f0f0f0** 이라 칩이 형태 없이 글자만 떠 보였다(대비 1:1).
 * ② 활성 칩의 primary 글자 on primary-light2 배경이 **2.26:1** 로 WCAG AA(4.5:1) 미달이었다.
 * ③ 상단만 둥근 폴더형인데 하단은 직각 + 3px 라인이라 형태가 어정쩡했고, 칩 배경이 베이스라인을
 *    가려 하단 선이 구간마다 끊겼다. 지금은 **모든 칩이 하단 보더를 갖고 활성만 transparent** 라
 *    선이 끊기지 않고 이어지며 활성 구간만 3px primary 로 굵어진다.
 *
 * 그리드 탭(`components/tabs.tsx`, QA `filter-tab-menu` 밑줄형)과 **의도적으로 다른 시각 언어**다 —
 * 한 화면에 둘 다 나올 수 있어 구별이 필요하다. 공유하는 것은 활성 3px primary 라인뿐이다.
 * Radix Tabs 를 쓰지 않는 이유: Trigger 가 `<button>` 이라 닫기 버튼 중첩이 HTML 불법이고,
 * "활성 = 상태"가 아니라 **"활성 = 현재 URL"** 인 내비게이션 모델이라 근본이 다르다.
 *
 * **URL 을 모른다** — controlled(tabs/activeId/콜백)로만 동작하고 라우터·사전 배선은 앱이 한다
 * (`ui` 는 next/* 를 import 할 수 없다). 탭은 URL 라우트의 별칭일 뿐이다(iframe 아님).
 * 칩이 `<a href>` 인 이유: 가운데 클릭·Cmd+클릭으로 새 브라우저 탭이 공짜로 성립한다 —
 * "여러 화면 동시 비교는 브라우저 탭" 원칙과 이어진다.
 */

export type WorkTabsLabels = {
  /** nav aria-label — 스크린리더가 "무슨 영역인지" 먼저 읽는다. */
  readonly tabBar: string;
  readonly close: string;
  readonly closeOthers: string;
  readonly closeRight: string;
  readonly closeUnpinned: string;
  /**
   * 핀 제외 전체 닫기의 확인 모달 메시지 — 되돌릴 수 없는 일괄 동작이라 한 번 묻는다.
   * 모달은 `useConfirm()` 으로 띄우므로 **상위에 `ConfirmProvider` 가 있어야 한다**
   * (없으면 경고 후 취소로 처리되어 버튼이 동작하지 않는 것처럼 보인다).
   */
  readonly closeUnpinnedConfirm: string;
  readonly pin: string;
  readonly unpin: string;
  /** 전체 탭 목록 드롭다운 트리거. */
  readonly listMenu: string;
  readonly scrollPrev: string;
  readonly scrollNext: string;
  /** 드래그 결과 스크린리더 안내 — 없으면 안내를 생략한다. */
  readonly reorderDone?: (title: string, position: number, total: number) => string;
};

/**
 * 칩 사이 간격(px). **밀집 카드 탭이라 0 이다** — 구분선 1px 은 `border-box` 라 이미 칩 폭에 들어 있다.
 *
 * 순수 CSS 상수가 아니라 **드래그 이동량 계산에 들어간다**(`shiftFor` 의 마지막 인자 =
 * 잡은 칩 폭 + 이 값). 값을 안 맞추면 화면은 멀쩡한 채 드래그할 때만 칩이 어긋난다 —
 * 간격을 되살리면 여기도 같이 고친다.
 */
const CHIP_GAP_PX = 0;

/**
 * 이 거리(px)를 움직여야 드래그가 시작된다.
 *
 * ⚠️ pointerdown 에서 드래그를 **즉시** 시작하면 포인터 캡처가 걸리고, 캡처가 걸리면
 * 브라우저가 click 을 down/up 대상의 공통 조상(칩 `<li>`)으로 재타게팅한다 —
 * 그러면 `<a>` 의 onClick 이 죽어 **탭 클릭 활성화가 통째로 안 된다**(실측 버그).
 * 임계 거리 전에는 캡처를 잡지 않으므로 클릭은 클릭으로 남는다.
 */
const DRAG_THRESHOLD_PX = 4;

/** 팝업 패널 공통 — select.tsx 패널 규격을 따른다. */
const MENU_PANEL_CLASS =
  'z-[var(--dl-z-menu)] min-w-40 rounded-dl-container border border-dl-field-border bg-dl-surface p-1 shadow-dl-menu';
const MENU_ITEM_CLASS =
  'flex cursor-pointer select-none items-center gap-2 rounded-dl-badge px-4 py-2 text-dl-sm text-dl-fg outline-none data-[disabled]:cursor-not-allowed data-[disabled]:text-dl-locked-fg data-[highlighted]:bg-dl-option-hover';

/** QA `.tab-controls .ctrl-btn` — 24px 정사각 보더 버튼. */
const CTRL_BTN_CLASS =
  'flex size-6 shrink-0 items-center justify-center rounded-dl-badge border border-dl-border bg-dl-surface text-dl-icon hover:bg-dl-icon-hover disabled:cursor-not-allowed disabled:text-dl-label-disabled disabled:hover:bg-dl-surface';

export function WorkTabsBar({
  tabs,
  activeId,
  labels,
  onSelect,
  onClose,
  onCloseOthers,
  onCloseRight,
  onCloseUnpinned,
  onTogglePin,
  onReorder,
  className,
}: {
  readonly tabs: readonly WorkTab[];
  /** 활성 탭 id — 진실은 현재 pathname 이고 앱이 판정해 내려준다. 없으면 null. */
  readonly activeId: string | null;
  readonly labels: WorkTabsLabels;
  /** 탭 선택 — 앱이 `router.push(tab.href)` 로 배선한다. */
  readonly onSelect: (tab: WorkTab) => void;
  /** 탭 닫기 — 활성 탭이 닫힌 뒤의 이동은 앱 책임이다(`nextActiveAfterClose` 참조). */
  readonly onClose: (id: string) => void;
  readonly onCloseOthers: (id: string) => void;
  readonly onCloseRight: (id: string) => void;
  readonly onCloseUnpinned: () => void;
  readonly onTogglePin: (id: string) => void;
  readonly onReorder: (next: readonly WorkTab[]) => void;
  readonly className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const chipRefs = useRef(new Map<string, HTMLLIElement>());
  const [announcement, setAnnouncement] = useState('');
  const askConfirm = useConfirm();

  /**
   * 드래그로 순서가 실제로 바뀌면 곧이어 도착하는 click 을 한 번 삼킨다 —
   * 포인터 캡처 때문에 놓는 순간 칩의 `<a>` 가 click 을 받아 의도치 않은 이동이 된다.
   */
  const suppressClick = useRef(false);

  const reorder = useListReorder<WorkTab>({
    items: tabs,
    onReorder: (next) => {
      suppressClick.current = true;
      onReorder(next);
    },
    // 핀 탭은 핀 구간 안에서만 움직인다 — 그리드 고정열과 같은 규칙(clampToGroup).
    groupOf: (tab) => tab.pinned,
    listRef,
    axis: 'x',
    onAnnounce: (from, to) => {
      const done = labels.reorderDone;
      const moved = tabs[from];
      if (!done || !moved) return;
      // 같은 문장이 연속으로 들어가면 aria-live 가 다시 읽지 않는다 — 끝에 공백을 번갈아 붙인다.
      setAnnouncement((previous) => {
        const next = done(moved.title, to + 1, tabs.length);
        return previous === next ? `${next} ` : next;
      });
    },
  });

  /** 오버플로 감지 — 넘칠 때만 prev/next 버튼을 보인다(QA .tab-controls). */
  const scrollAreaWidth = useElementWidth(scrollRef);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    setOverflowing(element.scrollWidth > element.clientWidth + 1);
  }, [scrollAreaWidth, tabs]);

  // 활성 탭이 바뀌면 보이는 곳으로 데려온다 — 드롭다운에서 고른 탭이 화면 밖이면 소용이 없다.
  useEffect(() => {
    if (activeId === null) return;
    chipRefs.current.get(activeId)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeId]);

  const scrollByPage = useCallback((direction: -1 | 1) => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollBy({
      left: direction * Math.max(element.clientWidth * 0.6, 160),
      behavior: 'smooth',
    });
  }, []);

  /**
   * 칩 전체가 드래그 면이다 — 단, 닫기 버튼 위에서 시작한 포인터는 드래그가 아니고,
   * 임계 거리(DRAG_THRESHOLD_PX)를 넘기 전에는 드래그를 시작하지 않는다(클릭 보호).
   */
  const pendingDrag = useRef<{
    readonly index: number;
    readonly x: number;
    readonly y: number;
  } | null>(null);

  const handleChipPointerDown = (event: ReactPointerEvent<HTMLElement>, index: number) => {
    // 새 상호작용의 시작 — 이전 드래그가 남긴 클릭 억제 플래그를 여기서 푼다.
    // 캡처 재타게팅 탓에 드래그 직후의 click 은 <a> 에 도달하지 않아 플래그가 소비되지 않고,
    // 그대로 두면 **다음 정상 클릭 한 번을 삼킨다**(실측 버그).
    suppressClick.current = false;
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
    // 브라우저의 링크 네이티브 드래그·텍스트 선택을 막는다(click 은 죽지 않는다) —
    // 네이티브 드래그가 시작되면 pointercancel 로 우리 드래그가 통째로 무력화된다.
    event.preventDefault();
    pendingDrag.current = { index, x: event.clientX, y: event.clientY };
  };

  const handleChipPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const pending = pendingDrag.current;
    if (pending) {
      // 캡처 전에 포인터가 칩 밖으로 나가면 pointerup 을 못 받아 pending 이 남는다 —
      // 버튼이 떨어진 채 들어온 move 는 유령 드래그가 되므로 여기서 정리한다.
      if (event.buttons === 0) {
        pendingDrag.current = null;
        return;
      }
      const moved = Math.hypot(event.clientX - pending.x, event.clientY - pending.y);
      if (moved < DRAG_THRESHOLD_PX) return;
      // 여기서야 비로소 드래그 — 이 move 지점이 이동량의 기준점이 된다(4px 오차는 체감 불가).
      pendingDrag.current = null;
      reorder.handlePointerDown(event, pending.index);
      return;
    }
    reorder.handlePointerMove(event);
  };

  const handleChipPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    pendingDrag.current = null;
    reorder.handlePointerUp(event);
  };

  return (
    <nav
      aria-label={labels.tabBar}
      className={cn('relative flex h-dl-worktab-bar items-end gap-2 px-5', className)}
    >
      {/* QA .tab-menu-wrapper:before — 전체 폭 1px 베이스라인. 칩과 활성 라인이 위에 얹힌다. */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-dl-border" />

      {/* 드래그는 순전히 시각적 조작이라, 이 영역이 없으면 화면을 못 보는 사용자에게는
          아무 일도 일어나지 않은 것과 같다. */}
      <output aria-live="polite" className="sr-only">
        {announcement}
      </output>

      <div
        ref={scrollRef}
        // QA .tab-scroll-container — 스크롤바를 숨기고 prev/next 버튼·휠로 움직인다.
        className="flex flex-1 items-end self-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* 밀집 배치 — 칩끼리 붙어 하나의 탭 그룹으로 읽힌다(gap 은 CHIP_GAP_PX 와 한 쌍이다). */}
        <ul ref={listRef} className="flex w-max items-end">
          {tabs.map((tab, index) => {
            const active = tab.id === activeId;
            const dragging = reorder.draggingIndex === index;

            /**
             * 드래그 중에는 **배열을 바꾸지 않는다.** 잡은 칩은 손을 그대로 따라가고(`offsetY`
             * — axis:'x' 라 x 이동량이다), 나머지는 잡은 칩 폭 + 간격만큼 비켜난다.
             */
            const shift =
              reorder.draggingIndex === null || reorder.dropIndex === null
                ? 0
                : dragging
                  ? reorder.offsetY
                  : shiftFor(
                      index,
                      reorder.draggingIndex,
                      reorder.dropIndex,
                      reorder.rowHeight + CHIP_GAP_PX,
                    );

            return (
              <ContextMenu.Root key={tab.id}>
                <ContextMenu.Trigger asChild>
                  <li
                    ref={(element) => {
                      if (element) chipRefs.current.set(tab.id, element);
                      else chipRefs.current.delete(tab.id);
                    }}
                    style={shift === 0 ? undefined : { transform: `translateX(${shift}px)` }}
                    onPointerDown={(event) => handleChipPointerDown(event, index)}
                    onPointerMove={handleChipPointerMove}
                    onPointerUp={handleChipPointerUp}
                    onPointerCancel={handleChipPointerUp}
                    className={cn(
                      // 밀집 카드 탭 — 라운드 없이 붙이고, 칩마다 우측 1px 이 구분선이 된다.
                      // touch-none 이 없으면 터치 기기에서 드래그가 스크롤로 가로채인다.
                      'relative flex h-dl-worktab shrink-0 touch-none select-none items-center gap-1 px-4 text-dl-sm',
                      'border-t border-r border-b border-dl-subtab-border first:border-l',
                      // 포커스 링은 칩 전체가 받는다 — <a> 에 걸면 링이 글자만 감싸 칩 모양과 어긋난다.
                      // inset 이라 밀집 배치에서 옆 칩을 침범하지 않는다.
                      'has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-dl-primary has-[a:focus-visible]:ring-inset',
                      active
                        ? // 활성 — 아래 화면과 같은 흰 표면 + 검정 글자 + 하단 3px primary 라인.
                          // 하단 보더는 **지우지 않고 transparent 로 자리만 남긴다** — 없애면
                          // border-box 안쪽 높이가 1px 늘어 활성 글자만 아래로 내려앉는다.
                          'border-b-transparent bg-dl-subtab-active font-semibold text-dl-subtab-active-fg after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-dl-primary'
                        : 'bg-dl-subtab text-dl-subtab-fg hover:bg-dl-subtab-hover hover:text-dl-fg',
                      // 잡은 칩: 떠 있는 카드. transition 을 주지 않는다 — 손보다 늦게 따라와 늘어진다.
                      dragging
                        ? 'z-10 cursor-grabbing shadow-dl-menu'
                        : 'transition-transform duration-150',
                    )}
                  >
                    <a
                      href={tab.href}
                      title={tab.title}
                      // 앵커는 기본 draggable — 켜 두면 칩 드래그가 링크 드래그에 가로채인다.
                      draggable={false}
                      aria-current={active ? 'page' : undefined}
                      onClick={(event) => {
                        // 드래그 직후의 click 은 이동 의도가 아니다 — 한 번 삼킨다.
                        if (suppressClick.current) {
                          suppressClick.current = false;
                          event.preventDefault();
                          return;
                        }
                        // 보조키 조합은 브라우저 기본 동작(새 탭·새 창)에 맡긴다.
                        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                          return;
                        event.preventDefault();
                        onSelect(tab);
                      }}
                      className="flex min-w-0 cursor-pointer items-center gap-1 outline-none focus-visible:outline-none"
                    >
                      {/* 앵커 탭(closable:false)은 핀이어도 자물쇠를 그리지 않는다 —
                          자물쇠는 "사용자가 고정했다"는 뜻이라 시스템 앵커에는 거짓말이 된다. */}
                      {tab.pinned && tab.closable !== false ? (
                        // 제목보다 앞서 읽히면 안 되는 보조 표시다 — 활성 칩에서 primary 를 물려받지 않게 낮춘다.
                        <Icon icon={Lock} size="lock" className="text-dl-fg-subtle" />
                      ) : null}
                      <span className="max-w-40 truncate">{tab.title}</span>
                    </a>

                    {/* 핀 탭·앵커 탭은 닫기 버튼을 숨긴다 — QA .tab-menu-btn-close. */}
                    {tab.pinned || tab.closable === false ? null : (
                      <button
                        type="button"
                        aria-label={`${labels.close}: ${tab.title}`}
                        onClick={() => onClose(tab.id)}
                        className={cn(
                          // 아이콘(16)보다 큰 정사각 히트 영역 — 밀집 배치라 오조작 여지가 크고,
                          // hover 배경이 "지금 눌리는 것이 닫기다"를 알린다.
                          'flex size-5 shrink-0 items-center justify-center rounded-dl-badge hover:bg-dl-icon-hover hover:text-dl-fg',
                          active ? 'text-dl-fg-muted' : 'text-dl-fg-subtle',
                        )}
                      >
                        <Icon icon={X} size="sm" />
                      </button>
                    )}
                  </li>
                </ContextMenu.Trigger>

                <ContextMenu.Portal>
                  <ContextMenu.Content className={MENU_PANEL_CLASS}>
                    {/* 앵커 탭(closable:false)은 자기 닫기·핀 항목을 내지 않는다 —
                        다른 탭을 닫는 항목(closeOthers·closeRight)은 그대로 유효하다. */}
                    {tab.closable === false ? null : (
                      <ContextMenu.Item
                        className={MENU_ITEM_CLASS}
                        onSelect={() => onClose(tab.id)}
                      >
                        {labels.close}
                      </ContextMenu.Item>
                    )}
                    <ContextMenu.Item
                      className={MENU_ITEM_CLASS}
                      onSelect={() => onCloseOthers(tab.id)}
                    >
                      {labels.closeOthers}
                    </ContextMenu.Item>
                    <ContextMenu.Item
                      className={MENU_ITEM_CLASS}
                      onSelect={() => onCloseRight(tab.id)}
                    >
                      {labels.closeRight}
                    </ContextMenu.Item>
                    {tab.closable === false ? null : (
                      <>
                        <ContextMenu.Separator className="my-1 h-px bg-dl-divider" />
                        <ContextMenu.Item
                          className={MENU_ITEM_CLASS}
                          onSelect={() => onTogglePin(tab.id)}
                        >
                          {tab.pinned ? labels.unpin : labels.pin}
                        </ContextMenu.Item>
                      </>
                    )}
                  </ContextMenu.Content>
                </ContextMenu.Portal>
              </ContextMenu.Root>
            );
          })}
        </ul>
      </div>

      {/* QA .tab-controls — 스크롤 prev/next + 전체 목록 + 핀 제외 전체 닫기. margin-bottom 6px. */}
      <div className="mb-1.5 flex shrink-0 items-center gap-2">
        {overflowing ? (
          <>
            <button
              type="button"
              aria-label={labels.scrollPrev}
              title={labels.scrollPrev}
              onClick={() => scrollByPage(-1)}
              className={CTRL_BTN_CLASS}
            >
              <Icon icon={ChevronLeft} size="sm" />
            </button>
            <button
              type="button"
              aria-label={labels.scrollNext}
              title={labels.scrollNext}
              onClick={() => scrollByPage(1)}
              className={CTRL_BTN_CLASS}
            >
              <Icon icon={ChevronRight} size="sm" />
            </button>
          </>
        ) : null}

        {/* 전체 탭 목록 — 화면 밖 탭도 여기서 바로 고른다(QA 에 없는 우리 추가 UI). */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label={labels.listMenu}
              title={labels.listMenu}
              disabled={tabs.length === 0}
              className={CTRL_BTN_CLASS}
            >
              <Icon icon={Menu} size="sm" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content sideOffset={4} align="end" className={MENU_PANEL_CLASS}>
              <div className="max-h-dl-menu-max overflow-y-auto">
                {tabs.map((tab) => (
                  <DropdownMenu.Item
                    key={tab.id}
                    className={cn(
                      MENU_ITEM_CLASS,
                      tab.id === activeId && 'font-semibold text-dl-primary-ink',
                    )}
                    onSelect={() => onSelect(tab)}
                  >
                    {tab.pinned && tab.closable !== false ? <Icon icon={Lock} size="lock" /> : null}
                    <span className="max-w-60 truncate">{tab.title}</span>
                  </DropdownMenu.Item>
                ))}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <button
          type="button"
          aria-label={labels.closeUnpinned}
          title={labels.closeUnpinned}
          disabled={tabs.every((tab) => tab.pinned)}
          // 되돌릴 수 없는 일괄 동작이라 확인 모달을 거친다 — 파괴적이므로 확인 버튼이 Danger.
          onClick={async () => {
            const ok = await askConfirm({
              message: labels.closeUnpinnedConfirm,
              confirmLabel: labels.closeUnpinned,
              destructive: true,
            });
            if (ok) onCloseUnpinned();
          }}
          className={CTRL_BTN_CLASS}
        >
          <Icon icon={X} size="sm" />
        </button>
      </div>
    </nav>
  );
}
