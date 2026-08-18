'use client';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { parseIsoDate, toIsoDate } from './isoDate';

/** 헤더 내비게이션 방향 → lucide 아이콘 매핑 (구 스프라이트 prev/next/double-* 대응) */
const NAV_ICONS: Readonly<Record<'prev' | 'next' | 'double-prev' | 'double-next', LucideIcon>> = {
  prev: ChevronLeft,
  next: ChevronRight,
  'double-prev': ChevronsLeft,
  'double-next': ChevronsRight,
};

/**
 * 달력 그리드 — DatePicker · DateRangePicker 의 팝업 본체.
 *
 * 날짜 라이브러리를 쓰지 않는다: 값의 계약이 `YYYY-MM-DD` **문자열**이라
 * (URL·FormData·zod 가 전부 문자열을 주고받는다) 필요한 연산이 월 그리드 생성과
 * 문자열 비교뿐이다. ISO 형식은 사전순 비교가 곧 날짜 비교라 min/max·범위 판정이
 * `<=` 하나로 끝난다. 타임존 문제도 없다 — Date 는 로컬 y/m/d 계산에만 쓰고
 * 값으로는 절대 들고 다니지 않는다.
 *
 * 표시 달(month) 상태는 내부에서 관리한다 — Popover 가 닫히면 언마운트되므로
 * 다시 열 때마다 선택값의 달에서 시작한다. controlled month 가 필요해지면 그때 연다.
 */

// 변환 자체는 순수 모듈로 분리했다(datePresets 가 React 무의존으로 쓴다) — 기존 소비처용 재export.
export { parseIsoDate, toIsoDate };

/** 오늘 — 렌더마다 new Date() 를 부르지 않도록 셀 판정에 한 번만 쓴다. */
function todayIso(): string {
  return toIsoDate(new Date());
}

type MonthCell = {
  readonly iso: string;
  readonly day: number;
  readonly outside: boolean;
};

/**
 * 6주 × 7일 고정 그리드. 달마다 행 수가 4~6으로 출렁이면 팝업 높이가 널뛰므로
 * 항상 42칸을 채운다 — 앞뒤는 인접 달 날짜(muted)로 메운다. 주 시작은 일요일.
 */
function buildMonthGrid(year: number, monthIndex: number): readonly MonthCell[] {
  const first = new Date(year, monthIndex, 1);
  const start = new Date(year, monthIndex, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, offset) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    return {
      iso: toIsoDate(date),
      day: date.getDate(),
      outside: date.getMonth() !== monthIndex,
    };
  });
}

export type CalendarProps = {
  /** 단일 선택 강조(primary 채움). */
  readonly value?: string;
  /** 범위 강조 — 양끝은 primary, 사이는 tonal. DateRangePicker 가 쓴다. */
  readonly range?: { readonly start?: string; readonly end?: string };
  readonly onSelect?: (iso: string) => void;
  /** ISO 문자열 경계(포함). 밖의 날짜는 비활성. */
  readonly min?: string;
  readonly max?: string;
  /** 처음 보여줄 달의 기준 날짜 — 없으면 value → range.start → 오늘 순. */
  readonly initialFocus?: string;
  readonly className?: string;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function Calendar({
  value,
  range,
  onSelect,
  min,
  max,
  initialFocus,
  className,
}: CalendarProps) {
  const anchor =
    parseIsoDate(initialFocus) ?? parseIsoDate(value) ?? parseIsoDate(range?.start) ?? new Date();
  const [year, setYear] = useState(anchor.getFullYear());
  const [monthIndex, setMonthIndex] = useState(anchor.getMonth());
  /** 키보드 로빙 포커스의 현재 칸. 그리드에서 tabIndex 0 은 이 칸 하나뿐이다. */
  const [focusIso, setFocusIso] = useState(toIsoDate(anchor));
  const gridRef = useRef<HTMLDivElement>(null);
  const today = todayIso();

  const moveMonth = (delta: number) => {
    const next = new Date(year, monthIndex + delta, 1);
    setYear(next.getFullYear());
    setMonthIndex(next.getMonth());
  };

  const isDisabled = (iso: string) => Boolean((min && iso < min) || (max && iso > max));

  /** 화살표 이동 — 달 경계를 넘으면 표시 달도 따라간다. */
  const moveFocus = (deltaDays: number) => {
    const current = parseIsoDate(focusIso) ?? new Date(year, monthIndex, 1);
    const next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + deltaDays);
    setFocusIso(toIsoDate(next));
    setYear(next.getFullYear());
    setMonthIndex(next.getMonth());
  };

  // 로빙 포커스: 그리드 안에 포커스가 있을 때만 따라간다 — 마우스 사용자를 방해하지 않는다.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid?.contains(document.activeElement)) return;
    grid.querySelector<HTMLButtonElement>(`[data-iso="${focusIso}"]`)?.focus();
  }, [focusIso]);

  const handleGridKeyDown = (event: React.KeyboardEvent) => {
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const delta = deltas[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      moveFocus(delta);
      return;
    }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      const current = parseIsoDate(focusIso) ?? new Date(year, monthIndex, 1);
      const next = new Date(
        current.getFullYear(),
        current.getMonth() + (event.key === 'PageUp' ? -1 : 1),
        current.getDate(),
      );
      setFocusIso(toIsoDate(next));
      setYear(next.getFullYear());
      setMonthIndex(next.getMonth());
    }
  };

  const rangeStart = range?.start;
  const rangeEnd = range?.end;
  const hasRange = Boolean(rangeStart && rangeEnd && rangeStart <= rangeEnd);

  return (
    <div className={cn('w-64 select-none p-2', className)}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex">
          <NavButton label="이전 해" icon="double-prev" onClick={() => moveMonth(-12)} />
          <NavButton label="이전 달" icon="prev" onClick={() => moveMonth(-1)} />
        </span>
        <span aria-live="polite" className="text-dl-sm font-semibold text-dl-fg-strong">
          {year}년 {monthIndex + 1}월
        </span>
        <span className="flex">
          <NavButton label="다음 달" icon="next" onClick={() => moveMonth(1)} />
          <NavButton label="다음 해" icon="double-next" onClick={() => moveMonth(12)} />
        </span>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            aria-hidden
            className="flex h-8 items-center justify-center text-dl-xs font-semibold text-dl-fg-muted"
          >
            {weekday}
          </span>
        ))}
      </div>

      {/* biome-ignore lint/a11y/useSemanticElements: 로빙 포커스 그리드 — 표준 grid 패턴이다 */}
      <div ref={gridRef} role="grid" onKeyDown={handleGridKeyDown} className="grid grid-cols-7">
        {buildMonthGrid(year, monthIndex).map((cell) => {
          const selected = cell.iso === value || cell.iso === rangeStart || cell.iso === rangeEnd;
          const inRange =
            hasRange &&
            Boolean(rangeStart && rangeEnd) &&
            cell.iso > (rangeStart as string) &&
            cell.iso < (rangeEnd as string);
          const disabled = isDisabled(cell.iso);
          return (
            <button
              key={cell.iso}
              type="button"
              data-iso={cell.iso}
              disabled={disabled}
              tabIndex={cell.iso === focusIso ? 0 : -1}
              aria-label={cell.iso}
              aria-current={cell.iso === today ? 'date' : undefined}
              aria-pressed={selected}
              onFocus={() => setFocusIso(cell.iso)}
              onClick={() => onSelect?.(cell.iso)}
              className={cn(
                'flex h-9 items-center justify-center text-dl-sm',
                // 범위 중간은 이어져 보여야 하므로 사각, 그 외에는 컨트롤 radius
                inRange ? 'bg-dl-tonal text-dl-tonal-fg' : 'rounded-dl-control',
                !selected && !inRange && !disabled && 'hover:bg-dl-tonal hover:text-dl-tonal-fg',
                cell.outside && !selected && 'text-dl-fg-subtle',
                cell.iso === today && !selected && 'font-semibold text-dl-primary-ink',
                selected && 'bg-dl-primary font-semibold text-dl-primary-fg',
                disabled && 'cursor-not-allowed text-dl-label-disabled hover:bg-transparent',
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 헤더 내비게이션 버튼 — 32px 히트박스, 아이콘 16px(QA is-16). */
function NavButton({
  label,
  icon,
  onClick,
}: {
  readonly label: string;
  readonly icon: 'prev' | 'next' | 'double-prev' | 'double-next';
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-dl-control text-dl-icon hover:bg-dl-icon-hover"
    >
      <Icon icon={NAV_ICONS[icon]} size="sm" />
    </button>
  );
}
