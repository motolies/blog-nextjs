'use client';

import { Menu } from 'lucide-react';
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react';
import { Button } from '../components/button';
import { Checkbox } from '../components/checkbox';
import { ContentDialog } from '../components/dialog';
import { FormMode } from '../components/form-mode';
import { shiftFor } from '../dnd/listReorder';
import { useListReorder } from '../dnd/useListReorder';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ColumnDef, type GridPreference, orderColumns } from './columns';

/**
 * 컬럼 표시 설정 — 현행 `gridWrapper.js` 의 `openGridSettingWindow()` 대응.
 *
 * 현행은 dhtmlx 그리드 두 개(source/target)를 나란히 두고 드래그로 옮기는 방식이다.
 * 여기서는 **한 목록 + 체크박스 + 드래그 손잡이**로 한다.
 *
 * 손잡이는 `<button>` 이라 **드래그와 ↑↓ 키를 둘 다 받는다.** 드래그 전용으로 만들면
 * 키보드 사용자가 순서를 바꿀 수 없는데, 이 모달은 "표를 읽을 수 있게 만드는" 도구라
 * 그 사람들이야말로 가장 필요로 한다.
 */

export type ColumnSettingsLabels = {
  readonly title: string;
  readonly description: string;
  /** 손잡이의 스크린리더 이름. 아이콘 단독이라 없으면 빈 버튼이 된다. */
  readonly reorder: string;
  /** 조작 방법 안내. 드래그는 눈에 보이지만 화살표 키는 알려주지 않으면 아무도 모른다. */
  readonly reorderHint: string;
  /**
   * 이동 결과를 스크린리더에 읽어 줄 문장. 예) `"주소, 5번째로 이동(전체 14개)"`.
   *
   * **드래그는 순전히 시각적 조작이라 이게 없으면 화면을 못 보는 사용자에게는
   * 아무 일도 일어나지 않은 것과 같다.** `ui` 는 사전을 모르므로 문구를 함수로 주입받는다
   * (`TotalCount` 의 `format` 과 같은 방식).
   */
  readonly reorderAnnouncement: (name: string, position: number, total: number) => string;
  readonly visibleColumn: string;
  /** 끌 수 없는 컬럼의 사유. v3 §ds-06 은 왜 못 누르는지 적으라고 한다. */
  readonly alwaysVisible: string;
  /** 고정열이 일반열 영역으로 못 내려가는 사유. */
  readonly pinnedFixed: string;
  readonly reset: string;
  readonly cancel: string;
  readonly apply: string;
};

type Draft = { readonly id: string; readonly visible: boolean; readonly pinned: boolean };

export function ColumnSettingsDialog<T extends Record<string, unknown>>({
  open,
  onOpenChange,
  columns,
  preference,
  onApply,
  onReset,
  translateHeader,
  labels,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** **숨김이 적용되기 전의 원본 컬럼 정의**를 넘긴다 — 꺼진 컬럼도 목록에 있어야 다시 켤 수 있다. */
  readonly columns: readonly ColumnDef<T>[];
  readonly preference: GridPreference | null;
  readonly onApply: (next: Pick<GridPreference, 'hidden' | 'order'>) => void;
  readonly onReset: () => void;
  readonly translateHeader?: (code: string) => string;
  readonly labels: ColumnSettingsLabels;
}) {
  const [draft, setDraft] = useState<readonly Draft[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const handleRefs = useRef(new Map<string, HTMLButtonElement>());
  /** 키보드로 옮긴 직후 포커스를 되돌려 줄 항목. 재배열되면 DOM 이 새로 만들어진다. */
  const focusAfterMove = useRef<string | null>(null);

  /**
   * 열릴 때마다 현재 설정에서 다시 만든다.
   * 편집 중 취소하고 다시 열었을 때 지난 편집이 남아 있으면, 사용자는 그것이 이미
   * 적용된 상태라고 읽는다.
   */
  useEffect(() => {
    if (!open) return;
    const hidden = new Set<string>(preference?.hidden ?? []);
    // applyColumnPreference 와 같은 규칙 — 저장 당시 없던 컬럼(order 에 없음)은 정의의 hidden 을 따른다.
    // 컬럼 초기화 후(order 비어 있고 pageSize 만 남은 상태)에도 표와 목록이 같은 것을 보여준다.
    const known = new Set<string>(preference?.order ?? []);
    setDraft(
      orderColumns(columns, preference?.order ?? []).map((column) => ({
        id: column.id,
        visible: known.has(column.id) ? !hidden.has(column.id) : column.hidden !== true,
        pinned: column.pinned === true,
      })),
    );
  }, [open, columns, preference]);

  /**
   * 키보드 이동 후 포커스 복원.
   *
   * 배열이 바뀌면 React 가 항목을 새로 그려 포커스가 `<body>` 로 떨어진다 —
   * 그러면 ↑ 를 두 번 연속 누를 수 없어 키보드로는 한 칸씩밖에 못 옮긴다.
   */
  useEffect(() => {
    const id = focusAfterMove.current;
    if (!id) return;
    focusAfterMove.current = null;
    handleRefs.current.get(id)?.focus();
  }, [draft]);

  const byId = new Map(columns.map((column) => [column.id as string, column]));

  const reorder = useListReorder<Draft>({
    items: draft,
    onReorder: setDraft,
    groupOf: (item) => item.pinned,
    listRef,
    onAnnounce: (from, to) => {
      const moved = draft[from];
      const column = moved ? byId.get(moved.id) : undefined;
      if (!column) return;
      // 같은 문장이 연속으로 들어가면 aria-live 가 다시 읽지 않는다 — 끝에 공백을 번갈아 붙인다.
      setAnnouncement((previous) => {
        const next = labels.reorderAnnouncement(
          headerText(column, translateHeader),
          to + 1,
          draft.length,
        );
        return previous === next ? `${next} ` : next;
      });
    },
  });

  const toggle = (index: number) => {
    const current = draft[index];
    if (!current) return;
    const next = [...draft];
    next[index] = { ...current, visible: !current.visible };
    setDraft(next);
  };

  const onHandleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : null;
    if (direction === null) return;

    event.preventDefault();
    const moved = reorder.moveByKeyboard(index, direction);
    if (moved !== index) focusAfterMove.current = draft[index]?.id ?? null;
  };

  const apply = () => {
    onApply({
      hidden: draft.filter((item) => !item.visible).map((item) => item.id),
      order: draft.map((item) => item.id),
    });
    onOpenChange(false);
  };

  return (
    /* 그리드 크롬은 폼이 아니다 — FormMode(view/disabled) 아래에서도 표시 여부
       체크박스가 잠기면 안 되므로 edit 로 핀한다. Portal 이어도 React 트리를 따라 관통한다. */
    <FormMode value="edit">
      <ContentDialog
        open={open}
        onOpenChange={onOpenChange}
        title={labels.title}
        description={labels.description}
        footer={
          <>
            <Button variant="outline-gray" onClick={onReset}>
              {labels.reset}
            </Button>
            <Button variant="outline-strong" onClick={() => onOpenChange(false)}>
              {labels.cancel}
            </Button>
            <Button variant="primary" onClick={apply}>
              {labels.apply}
            </Button>
          </>
        }
      >
        <p className="mb-2 text-dl-xs text-dl-fg-muted">{labels.reorderHint}</p>

        {/* 드래그는 순전히 시각적 조작이라, 이 영역이 없으면 화면을 못 보는 사용자에게는
          아무 일도 일어나지 않은 것과 같다. */}
        <output aria-live="polite" className="sr-only">
          {announcement}
        </output>

        <ul
          ref={listRef}
          className="max-h-dl-column-list overflow-y-auto rounded-dl-container border border-dl-border"
        >
          {draft.map((item, index) => {
            const column = byId.get(item.id);
            if (!column) return null;

            const hideable = column.hideable !== false;
            const title = headerText(column, translateHeader);
            const dragging = reorder.draggingIndex === index;

            /**
             * 드래그 중에는 **배열을 바꾸지 않는다.** 잡은 행은 손을 그대로 따라가고(`offsetY`),
             * 나머지는 비켜날 만큼만 움직인다(`shiftFor`). 배열은 놓을 때 한 번 바뀐다.
             */
            const shift =
              reorder.draggingIndex === null || reorder.dropIndex === null
                ? 0
                : dragging
                  ? reorder.offsetY
                  : shiftFor(index, reorder.draggingIndex, reorder.dropIndex, reorder.rowHeight);

            return (
              <li
                key={item.id}
                style={shift === 0 ? undefined : { transform: `translateY(${shift}px)` }}
                className={cn(
                  'flex items-center gap-2 border-dl-divider border-b bg-dl-surface px-3 py-1.5 last:border-b-0',
                  // 잡은 행: 떠 있는 카드. z 가 없으면 다음 행 배경에 덮여 떠 보이지 않는다.
                  // **transition 을 주지 않는다** — 손보다 늦게 따라와 고무줄처럼 늘어진다.
                  dragging
                    ? 'relative z-10 shadow-dl-menu'
                    : // 비켜나는 행만 부드럽게 움직인다.
                      'transition-transform duration-150',
                )}
              >
                <Checkbox
                  checked={item.visible}
                  // undefined 여야 다이얼로그의 FormMode edit 핀을 따른다.
                  mode={hideable ? undefined : 'disabled'}
                  title={hideable ? undefined : labels.alwaysVisible}
                  aria-label={`${labels.visibleColumn}: ${title}`}
                  onChange={() => toggle(index)}
                />
                <span
                  className={cn('flex-1 truncate text-dl-sm', !item.visible && 'text-dl-fg-subtle')}
                >
                  {title}
                </span>

                <button
                  type="button"
                  ref={(element) => {
                    if (element) handleRefs.current.set(item.id, element);
                    else handleRefs.current.delete(item.id);
                  }}
                  aria-label={`${labels.reorder}: ${title}`}
                  // 고정열은 고정 구간 안에서만 움직인다 — 왜 더 못 가는지 여기에 남긴다.
                  title={item.pinned ? labels.pinnedFixed : labels.reorder}
                  onPointerDown={(event) => reorder.handlePointerDown(event, index)}
                  onPointerMove={reorder.handlePointerMove}
                  onPointerUp={reorder.handlePointerUp}
                  onPointerCancel={reorder.handlePointerUp}
                  onKeyDown={(event) => onHandleKeyDown(event, index)}
                  className={cn(
                    // touch-none 이 없으면 터치 기기에서 드래그가 스크롤로 가로채인다
                    'flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-dl-badge text-dl-fg-muted hover:bg-dl-icon-hover',
                    dragging && 'cursor-grabbing text-dl-tonal-fg',
                  )}
                >
                  {/*
                  세트에 grip 아이콘이 없다. `nav-menu`(가로선 3개)가 드래그 손잡이의
                  관례적인 모양(≡)과 정확히 같아 그대로 쓴다 — 자산이 늘지 않는다.
                */}
                  <Icon icon={Menu} size="sm" />
                </button>
              </li>
            );
          })}
        </ul>
      </ContentDialog>
    </FormMode>
  );
}

function headerText<T extends Record<string, unknown>>(
  column: ColumnDef<T>,
  translateHeader: ((code: string) => string) | undefined,
): string {
  const code = column.headerWord ?? column.id;
  return translateHeader ? translateHeader(code) : code;
}
