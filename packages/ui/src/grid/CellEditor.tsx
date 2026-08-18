'use client';

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { DatePicker } from '../components/date-picker';
import { DateTimePicker } from '../components/date-time-picker';
import { Input } from '../components/input';
import { MultiSelect } from '../components/multi-select';
import { Select } from '../components/select';
import type { ControlSize } from '../lib/controlSize';
import type { ColumnDef, ColumnEditor } from './columns';

/**
 * 활성 셀에 그려지는 인라인 에디터 — `editor.type` 별로 기존 폼 컨트롤을 그대로 쓴다.
 *
 * 컨트롤 높이는 그리드의 density 를 그대로 따른다 — **셀 전용 축소 사이즈를 만들지 않는다.**
 * 행(30+4n)과 컨트롤(22+4n)의 기울기가 같아 **차이가 언제나 8px** 이므로, 어느 density·
 * 어느 테마에서도 위아래 여유가 4px 씩 남는다 (default md 50↔42 · default xs 40↔32 ·
 * compact md 44↔36). 셀 쪽 좌우 패딩은 편집 중에만 `px-1` 로 줄인다.
 *
 * 키보드 규약:
 * - Enter = 확정 + 아래 행 이동 · Tab/Shift+Tab = 확정 + 좌우 편집 셀 이동 · Esc = 취소
 * - Select/DatePicker 의 팝오버는 Radix Portal 에 뜬다. React 는 Portal 도 트리로
 *   버블링하므로, 래퍼 키 핸들러는 **DOM 포함 여부**로 팝오버발 이벤트를 걸러낸다.
 */

export type CellEditorMove = 'next' | 'prev' | 'down';

type CellEditorProps<T extends Record<string, unknown>> = {
  readonly column: ColumnDef<T>;
  readonly row: T;
  /** 현재 표시 값(draft 반영본). */
  readonly value: unknown;
  /** 그리드 density — 안에 서는 컨트롤이 같은 단계로 움직인다. 생략하면 컨트롤 기본(md). */
  readonly size?: ControlSize;
  readonly invalid: boolean;
  /** 값만 반영한다 — 편집 종료·이동은 `onClose`/`onMove` 가 따로 맡는다. */
  readonly onCommitValue: (value: unknown) => void;
  readonly onClose: () => void;
  readonly onMove: (move: CellEditorMove) => void;
};

export function CellEditor<T extends Record<string, unknown>>(props: CellEditorProps<T>) {
  const editor = props.column.editor;
  // checkbox 는 Cell 이 조회 모드에서 상시 렌더한다 — 여기 오면 배선 오류다.
  if (!editor || editor.type === 'checkbox') return null;

  switch (editor.type) {
    case 'text':
    case 'number':
      return <TextCellEditor {...props} editor={editor} />;
    case 'select':
      return <SelectCellEditor {...props} editor={editor} />;
    case 'multiselect':
      return <MultiSelectCellEditor {...props} editor={editor} />;
    case 'date':
    case 'datetime':
      return <DateCellEditor {...props} editor={editor} />;
    case 'custom':
      return editor.render({
        value: props.value,
        row: props.row,
        commit: (value) => {
          props.onCommitValue(value);
          props.onClose();
        },
        cancel: props.onClose,
      });
  }
}

/**
 * text/number 의 확정 규칙. number 는 빈 값 → null, 숫자가 아니면 **커밋하지 않는다** —
 * `DatePicker` 의 normalize 실패("조용히 이전 값 복원")와 같은 규칙이다.
 */
function commitTextValue<T>(
  editor: Extract<ColumnEditor<T>, { type: 'text' | 'number' }>,
  draft: string,
  onCommitValue: (value: unknown) => void,
): void {
  if (editor.type === 'text') {
    onCommitValue(draft);
    return;
  }
  const text = draft.trim();
  if (text === '') {
    onCommitValue(null);
    return;
  }
  const parsed = Number(text);
  if (Number.isNaN(parsed)) return;
  const min = editor.min ?? Number.NEGATIVE_INFINITY;
  const max = editor.max ?? Number.POSITIVE_INFINITY;
  onCommitValue(Math.min(max, Math.max(min, parsed)));
}

function TextCellEditor<T extends Record<string, unknown>>({
  editor,
  column,
  value,
  size,
  invalid,
  onCommitValue,
  onClose,
  onMove,
}: CellEditorProps<T> & {
  readonly editor: Extract<ColumnEditor<T>, { type: 'text' | 'number' }>;
}) {
  const [draft, setDraft] = useState(value == null ? '' : String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  /** 마운트 시점의 표시 텍스트 — 이 값 그대로면 "변경 없음 = 커밋 없음"이다. */
  const initial = useRef(draft);
  /** 확정/취소가 끝났는지. cleanup 커밋의 중복 방지 플래그다. */
  const settled = useRef(false);
  /** cleanup 은 마운트 시점 클로저라 최신 draft 를 ref 로 들고 있어야 한다. */
  const latest = useRef({ draft, onCommitValue });
  latest.current = { draft, onCommitValue };

  // 마운트 시 포커스 + 전체 선택 — 엑셀처럼 바로 덮어쓰며 시작한다.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  /**
   * 가상 스크롤로 화면 밖에 밀려 언마운트되어도 타이핑을 잃지 않는다 — blur 와 같은 의미로 커밋한다.
   * "변경 없음이면 커밋 없음" 가드가 이중 역할을 한다: 불필요한 검증 실행을 막고,
   * StrictMode(dev)의 마운트→cleanup→재마운트 사이클이 빈 draft 를 커밋하는 것도 막는다.
   */
  useEffect(
    () => () => {
      if (settled.current || latest.current.draft === initial.current) return;
      commitTextValue(editor, latest.current.draft, latest.current.onCommitValue);
    },
    [editor],
  );

  const settle = () => {
    if (settled.current) return;
    settled.current = true;
    if (draft === initial.current) return;
    commitTextValue(editor, draft, onCommitValue);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      settle();
      onMove('down');
    } else if (event.key === 'Tab') {
      event.preventDefault();
      settle();
      onMove(event.shiftKey ? 'prev' : 'next');
    } else if (event.key === 'Escape') {
      settled.current = true;
      onClose();
    }
  };

  return (
    <Input
      ref={inputRef}
      className="w-full"
      size={size}
      value={draft}
      invalid={invalid}
      align={(column.align ?? 'center') === 'center' ? 'center' : 'left'}
      inputMode={editor.type === 'number' ? 'decimal' : undefined}
      maxLength={editor.type === 'text' ? editor.maxLength : undefined}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        settle();
        onClose();
      }}
    />
  );
}

/** Radix Portal(팝오버) 안에서 버블링해 온 이벤트인지 — DOM 포함 여부로 가른다. */
function isOutsidePortal(event: ReactKeyboardEvent<HTMLDivElement>): boolean {
  return event.target instanceof Node && event.currentTarget.contains(event.target);
}

/**
 * 에디터(래퍼)·팝오버 밖 pointerdown = "다른 곳을 클릭했다" — 편집을 닫는다.
 *
 * blur/relatedTarget 판정을 쓰지 않는 이유: Radix 팝오버가 열릴 때 오토포커스가
 * **body 를 잠깐 거쳐 가는 순간**이 있어, 달력을 여는 클릭이 "밖으로 나감"으로 오판된다.
 * pointerdown 좌표(이벤트 타깃)는 그 타이밍 문제가 없다.
 */
function useCloseOnOutsidePointerDown(
  wrapperRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const handle = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (wrapperRef.current?.contains(target)) return;
      // Radix Portal 팝오버(달력·옵션 목록) 안은 에디터의 일부다
      if (target instanceof Element && target.closest('[data-radix-popper-content-wrapper]')) {
        return;
      }
      closeRef.current();
    };
    // capture — 안쪽 요소가 stopPropagation 해도 "밖을 눌렀다"는 사실은 변하지 않는다
    document.addEventListener('pointerdown', handle, true);
    return () => document.removeEventListener('pointerdown', handle, true);
  }, [wrapperRef]);
}

function SelectCellEditor<T extends Record<string, unknown>>({
  editor,
  value,
  size,
  invalid,
  onCommitValue,
  onClose,
  onMove,
}: CellEditorProps<T> & { readonly editor: Extract<ColumnEditor<T>, { type: 'select' }> }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  useCloseOnOutsidePointerDown(wrapperRef, onClose);

  // Select 는 autoFocus prop 이 없다 — 트리거에 포커스를 줘야 Enter/Space 로 바로 연다.
  useEffect(() => {
    wrapperRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!isOutsidePortal(event)) return;
    // Enter 는 이동에 안 쓴다 — 닫힌 트리거에서 Enter 는 "팝오버 열기"다.
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      onMove(event.shiftKey ? 'prev' : 'next');
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: 키 입력의 주체는 안쪽 Select 트리거다 — 래퍼는 버블링만 받는다.
    <div ref={wrapperRef} className="w-full" onKeyDown={handleKeyDown}>
      <Select
        value={value == null ? '' : String(value)}
        size={size}
        options={editor.options}
        placeholder={editor.placeholder}
        invalid={invalid}
        onValueChange={(next) => {
          onCommitValue(next);
          onClose();
        }}
      />
    </div>
  );
}

function MultiSelectCellEditor<T extends Record<string, unknown>>({
  editor,
  value,
  size,
  invalid,
  onCommitValue,
  onClose,
  onMove,
}: CellEditorProps<T> & { readonly editor: Extract<ColumnEditor<T>, { type: 'multiselect' }> }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  useCloseOnOutsidePointerDown(wrapperRef, onClose);

  useEffect(() => {
    wrapperRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!isOutsidePortal(event)) return;
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      onMove(event.shiftKey ? 'prev' : 'next');
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: 키 입력의 주체는 안쪽 MultiSelect 트리거다 — 래퍼는 버블링만 받는다.
    <div ref={wrapperRef} className="w-full" onKeyDown={handleKeyDown}>
      <MultiSelect
        value={Array.isArray(value) ? (value as readonly string[]) : []}
        size={size}
        options={editor.options}
        placeholder={editor.placeholder}
        invalid={invalid}
        // 다중 선택은 토글마다 커밋하고 **닫지 않는다** — 첫 토글에 닫히면 하나밖에 못 고른다.
        onValueChange={(next) => onCommitValue(next)}
      />
    </div>
  );
}

function DateCellEditor<T extends Record<string, unknown>>({
  editor,
  value,
  size,
  invalid,
  onCommitValue,
  onClose,
  onMove,
}: CellEditorProps<T> & {
  readonly editor: Extract<ColumnEditor<T>, { type: 'date' | 'datetime' }>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  useCloseOnOutsidePointerDown(wrapperRef, onClose);

  useEffect(() => {
    wrapperRef.current?.querySelector('input')?.focus();
  }, []);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!isOutsidePortal(event)) return;
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'Enter') {
      // 같은 Enter 로 DatePicker 가 이미 텍스트를 확정(onValueChange → 커밋)한 뒤다 — 이동만 한다.
      onMove('down');
    } else if (event.key === 'Tab') {
      event.preventDefault();
      // preventDefault 로 포커스 이동(blur)이 사라지므로 직접 blur 시켜 타이핑을 확정시킨다.
      if (event.target instanceof HTMLElement) event.target.blur();
      onMove(event.shiftKey ? 'prev' : 'next');
    }
  };

  /**
   * 달력 선택·타이핑 확정 = 값이 정해졌다 — Select 의 단일 선택과 같은 의미라 즉시 종료한다.
   *
   * ⚠️ 값이 그대로인 커밋은 무시한다. `useControllableState` 는 같은 값에도 onChange 를
   * 부르는데, 달력 버튼을 누르는 순간 input blur 가 기존 값을 재확정한다 — 이걸 닫힘
   * 트리거로 받으면 **달력이 열리자마자 에디터째 닫힌다**.
   */
  const commitAndClose = (next: string) => {
    if (next === (typeof value === 'string' ? value : '')) return;
    onCommitValue(next);
    onClose();
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: 키 입력의 주체는 안쪽 DatePicker 입력이다 — 래퍼는 버블링만 받는다.
    <div ref={wrapperRef} className="w-full" onKeyDown={handleKeyDown}>
      {editor.type === 'date' ? (
        <DatePicker
          className="w-full"
          size={size}
          value={typeof value === 'string' ? value : ''}
          min={editor.min}
          max={editor.max}
          invalid={invalid}
          onValueChange={commitAndClose}
        />
      ) : (
        <DateTimePicker
          className="w-full"
          size={size}
          value={typeof value === 'string' ? value : ''}
          invalid={invalid}
          onValueChange={commitAndClose}
        />
      )}
    </div>
  );
}
