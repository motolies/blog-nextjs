'use client';

import { Lock, X } from 'lucide-react';
import { Popover as RadixPopover } from 'radix-ui';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { Calendar } from './calendar';
import { CalendarButton, normalizeDateText, PANEL_CLASS } from './date-picker';
import { type DateRangePreset, PresetRow } from './date-range-picker';
import { toDateTimeRange } from './datePresets';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';
import { type DateRange, orderRange } from './rangeOrder';

/**
 * 날짜+시간 선택 — DatePicker 와 **별도 컴포넌트**다.
 *
 * 값의 계약이 다르다: `YYYY-MM-DD HH:mm:ss` — Java 정본(`Constant.DATETIME_FORMAT =
 * "yyyy-MM-dd HH:mm:ss"`)과 1:1 이고, 백엔드 역직렬화기의 수용 패턴에 초 없는 `HH:mm`
 * 꼴이 없어 **값에 초를 항상 포함**한다. 공백 구분 동일 포맷이라 DatePicker 처럼
 * 사전순 비교가 곧 시간순 비교다.
 *
 * 팝업은 달력 + 시(0-23)·분(0-59) 스크롤 리스트 2열. 날짜·시간 클릭 모두 즉시 값에
 * 반영되고 팝업은 유지된다 — 두 차원을 조정해야 하므로 한 번의 클릭으로 닫으면
 * 나머지 차원을 바꿀 기회가 없다. 닫기는 [확인]·외부 클릭·ESC.
 * 리스트 선택은 초를 00 으로 둔다 — 초가 필요하면 타이핑으로 입력한다.
 *
 * `precision="minute"` 이면 값이 `YYYY-MM-DD HH:mm` 이 된다. ⚠️ 이 꼴은 백엔드
 * 역직렬화기가 직접 받지 못하므로(수용 패턴에 HH:mm 없음) FormData 직송이 아니라
 * zod/contracts 에서 `:00` 을 붙이는 자리에서만 쓴다.
 */

/** 값 정밀도 — 포맷 문자열은 여기서 파생된다. 기본은 백엔드 정본과 1:1 인 second. */
export type DateTimePrecision = 'second' | 'minute';

/**
 * 타이핑 입력 정규화 → 정밀도에 맞는 datetime 문자열 또는 null.
 * **입력 수용은 두 모드 동일**(없음·HH:mm·HH:mm:ss·압축형) — 출력만 정밀도를 따른다.
 * minute 모드에서 타이핑된 초는 절삭한다. 날짜부는 normalizeDateText 재사용,
 * 시<24·분·초<60 검증.
 */
export function normalizeDateTimeText(
  text: string,
  precision: DateTimePrecision = 'second',
): string | null {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  const spaceIndex = trimmed.indexOf(' ');
  const datePart = spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
  const timePart = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1);

  const isoDate = normalizeDateText(datePart);
  if (!isoDate) return null;

  let hour = 0;
  let minute = 0;
  let second = 0;
  if (timePart !== '') {
    const digits = timePart.replace(/:/g, '');
    if (!/^\d{4}(\d{2})?$/.test(digits)) return null;
    hour = Number(digits.slice(0, 2));
    minute = Number(digits.slice(2, 4));
    second = digits.length === 6 ? Number(digits.slice(4, 6)) : 0;
    if (hour > 23 || minute > 59 || second > 59) return null;
  }

  const pad = (n: number) => `${n}`.padStart(2, '0');
  const base = `${isoDate} ${pad(hour)}:${pad(minute)}`;
  return precision === 'minute' ? base : `${base}:${pad(second)}`;
}

/** 두 정밀도 모두 분해한다(`HH:mm:ss` · `HH:mm`). 형식이 어긋나면 null. */
function splitDateTime(value: string): { date: string; hour: number; minute: number } | null {
  const match = value.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  return { date: match[1] as string, hour: Number(match[2]), minute: Number(match[3]) };
}

/**
 * 시·분 스크롤 리스트 한 열. 열릴 때 선택값을 중앙으로 끌어온다 —
 * Select 의 활성 항목 scrollIntoView 패턴(select.tsx)과 같은 이유다:
 * 60개 목록에서 이게 없으면 매번 처음부터 스크롤한다.
 */
function TimeColumn({
  label,
  count,
  value,
  onSelect,
}: {
  readonly label: string;
  readonly count: 24 | 60;
  readonly value: number | null;
  readonly onSelect: (next: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // 마운트(팝업 열림) 시 1회 — 이후 클릭 선택은 화면 안에서 일어나므로 따라가지 않는다.
  useEffect(() => {
    if (value === null) return;
    listRef.current?.querySelector(`[data-value="${value}"]`)?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <div className="flex min-w-0 flex-col">
      <span className="flex h-8 shrink-0 items-center justify-center text-dl-xs font-semibold text-dl-fg-muted">
        {label}
      </span>
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        className="min-h-0 w-14 flex-1 overflow-y-auto"
      >
        {Array.from({ length: count }, (_, index) => (
          <button
            key={`${label}-${index}`}
            type="button"
            role="option"
            data-value={index}
            aria-selected={value === index}
            onClick={() => onSelect(index)}
            className={cn(
              'flex h-8 w-full items-center justify-center rounded-dl-control text-dl-sm',
              value === index
                ? 'bg-dl-primary font-semibold text-dl-primary-fg'
                : 'hover:bg-dl-tonal hover:text-dl-tonal-fg',
            )}
          >
            {`${index}`.padStart(2, '0')}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 팝업 본체 — 달력 + 시·분 리스트 + [확인]. 단일·범위 양쪽이 공유한다. */
function DateTimePanel({
  value,
  min,
  max,
  precision,
  onChange,
  onConfirm,
}: {
  readonly value: string;
  readonly min?: string;
  readonly max?: string;
  readonly precision: DateTimePrecision;
  readonly onChange: (next: string) => void;
  readonly onConfirm: () => void;
}) {
  const parts = splitDateTime(value);
  const pad = (n: number) => `${n}`.padStart(2, '0');

  /** 부위 하나를 바꿔 완전한 datetime 을 만든다 — 빈 값에서 시작하면 나머지는 기본값. */
  const compose = (patch: { date?: string; hour?: number; minute?: number }) => {
    const date = patch.date ?? parts?.date;
    if (!date) return; // 날짜 없이 시간만 고르면 조합할 수 없다 — 달력 먼저
    const hour = patch.hour ?? parts?.hour ?? 0;
    const minute = patch.minute ?? parts?.minute ?? 0;
    const base = `${date} ${pad(hour)}:${pad(minute)}`;
    onChange(precision === 'minute' ? base : `${base}:00`);
  };

  return (
    <div className="flex flex-col">
      <div className="flex max-h-80 items-stretch">
        <Calendar
          value={parts?.date}
          min={min}
          max={max}
          onSelect={(iso) => compose({ date: iso })}
        />
        <div className="flex gap-1 border-l border-dl-divider p-2 pt-2">
          <TimeColumn
            label="시"
            count={24}
            value={parts?.hour ?? null}
            onSelect={(hour) => compose({ hour, date: parts?.date ?? todayIso() })}
          />
          <TimeColumn
            label="분"
            count={60}
            value={parts?.minute ?? null}
            onSelect={(minute) => compose({ minute, date: parts?.date ?? todayIso() })}
          />
        </div>
      </div>
      <div className="flex justify-end border-t border-dl-divider px-2 py-1.5">
        <button
          type="button"
          onClick={onConfirm}
          className="h-dl-control-sm rounded-dl-container bg-dl-primary px-4 text-dl-base font-semibold text-dl-primary-fg hover:bg-dl-primary-hover"
        >
          확인
        </button>
      </div>
    </div>
  );
}

/** 오늘 — 빈 값에서 시간부터 고른 경우의 날짜 기본값. */
function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export type DateTimePickerProps = {
  /** `YYYY-MM-DD HH:mm:ss`(precision="minute" 면 `HH:mm` 까지). 주면 controlled. */
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  /** FormData 전송용 — 입력 자신이 값을 든다. */
  readonly name?: string;
  readonly placeholder?: string;
  /**
   * 값 정밀도 — 기본 second(백엔드 정본과 1:1). minute 은 `HH:mm` 까지만 담으므로
   * 백엔드 직송 불가(zod 에서 `:00` 부착 필요) — 컴포넌트 머리말 주석 참조.
   */
  readonly precision?: DateTimePrecision;
  /** ISO **날짜** 경계(포함) — 달력의 날짜 비활성용. 시간 단위 경계는 지원하지 않는다. */
  readonly min?: string;
  readonly max?: string;
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  /** 시스템 채움 영구 불변 — readOnly + 자물쇠(선택 버튼 대신). 모든 mode 를 이긴다. */
  readonly lock?: boolean;
  readonly invalid?: boolean;
  /** 5단 사이즈. 생략하면 감싼 `Field` 의 size, 그것도 없으면 `md`(42). */
  readonly size?: ControlSize;
  readonly id?: string;
  /** 값 지우기(×) — 값이 있으면 선택 버튼 왼쪽에 뜬다. */
  readonly clearable?: boolean;
  /** × 버튼의 접근성 이름. `ui` 는 사전을 모른다 — 필요하면 번역을 주입한다. */
  readonly clearLabel?: string;
  readonly className?: string;
};

/** 정밀도별 기본 placeholder — 명시 placeholder 가 있으면 그쪽이 이긴다. */
function defaultPlaceholder(precision: DateTimePrecision): string {
  return precision === 'minute' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD HH:mm:ss';
}

export function DateTimePicker({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  name,
  placeholder,
  precision = 'second',
  min,
  max,
  mode,
  lock,
  invalid,
  size,
  id,
  clearable,
  clearLabel = '지우기',
  className,
}: DateTimePickerProps) {
  const field = useFieldControl({ id, invalid, size, mode, lock });
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  if (field.state.view) {
    // 값 계약이 datetime 문자열 그대로라 그대로가 표시값이다. 빈값이면 빈칸.
    return <FieldViewText size={field.size}>{value || null}</FieldViewText>;
  }

  // 지우기는 편집 가능한 상태에서만 뜬다 — 잠긴 값은 지울 수 있는 값이 아니다.
  const showClear =
    clearable === true && !field.state.readOnly && !field.state.disabled && value !== '';

  /** 값이 바뀐 지점마다 dirty 를 통지한다 — 근거는 `DatePicker.commitText` 주석. */
  const commitText = (text: string) => {
    setDraft(null);
    if (text.trim() === '') {
      setValue('');
      field.notifyDirty();
      return;
    }
    const normalized = normalizeDateTimeText(text, precision);
    if (normalized) {
      setValue(normalized);
      field.notifyDirty();
    }
  };

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Anchor asChild>
        <span className={cn('relative block w-full', className)}>
          <input
            className={cn(
              // 19자 + 아이콘 — 날짜(130px)보다 넓은 하한
              'dl-field min-w-[190px] pr-10',
              FIELD_SIZE_CLASS[field.size],
              field.invalid && 'dl-field-error',
              field.state.lockClass,
              showClear && 'pr-16',
            )}
            id={field.id}
            name={name}
            value={draft ?? value}
            placeholder={placeholder ?? defaultPlaceholder(precision)}
            aria-invalid={field['aria-invalid']}
            aria-describedby={field['aria-describedby']}
            aria-required={field.required || undefined}
            readOnly={field.state.readOnly}
            disabled={field.state.disabled}
            {...field.state.dataProps}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => commitText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitText(event.currentTarget.value);
            }}
          />
          {showClear ? (
            <button
              type="button"
              aria-label={clearLabel}
              onClick={() => {
                setDraft(null);
                setValue('');
                field.notifyDirty();
              }}
              className="absolute inset-y-0 right-10 my-auto flex size-5 items-center justify-center rounded-dl-badge text-dl-field-caret hover:bg-dl-option-hover hover:text-dl-fg"
            >
              <Icon icon={X} className="size-3" />
            </button>
          ) : null}
          {lock ? (
            // 잠긴 칸은 비활성 버튼 대신 자물쇠 표식 — 거짓 어포던스를 남기지 않는다.
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-dl-locked-icon">
              <Icon icon={Lock} size="lock" />
            </span>
          ) : (
            <RadixPopover.Trigger asChild>
              <CalendarButton label="날짜·시간 선택 열기" locked={field.state.disabled} />
            </RadixPopover.Trigger>
          )}
        </span>
      </RadixPopover.Anchor>

      <RadixPopover.Portal>
        <RadixPopover.Content sideOffset={4} align="start" className={PANEL_CLASS}>
          <DateTimePanel
            value={value}
            min={min}
            max={max}
            precision={precision}
            onChange={(next) => {
              setValue(next);
              setDraft(null);
              field.notifyDirty();
            }}
            onConfirm={() => setOpen(false)}
          />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

export type DateTimeRangePickerProps = {
  /** 각각 `YYYY-MM-DD HH:mm:ss` 또는 빈 문자열. 주면 controlled. */
  readonly start?: string;
  readonly end?: string;
  readonly defaultStart?: string;
  readonly defaultEnd?: string;
  readonly onRangeChange?: (range: DateRange) => void;
  readonly startName?: string;
  readonly endName?: string;
  /** 양끝이 공유한다 — 같은 정밀도여야 문자열 비교(스왑 판정)가 성립한다. */
  readonly precision?: DateTimePrecision;
  readonly min?: string;
  readonly max?: string;
  /**
   * 기간 프리셋 — 양쪽 팝오버 상단에 같은 행이 뜨고, 클릭하면 양끝을 한 번에 채운다.
   * 날짜만 있는 프리셋(`presetRange` 산출물)은 하루 전체(00:00~23:59)로 넓힌다.
   */
  readonly presets?: readonly DateRangePreset[];
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  /** 시스템 채움 영구 불변 — readOnly + 자물쇠(선택 버튼 대신). 모든 mode 를 이긴다. */
  readonly lock?: boolean;
  readonly invalid?: boolean;
  /** 5단 사이즈 — 시작·종료 입력 둘 다에 적용된다. */
  readonly size?: ControlSize;
  readonly className?: string;
};

/**
 * 날짜+시간 기간 — DateRangePicker(공유 달력 1개)와 달리 **끝마다 자기 팝오버**를 가진다.
 * datetime 은 끝마다 날짜+시간 2차원이라 공유 팝업 하나에 시간 리스트 2벌을 담으면
 * 과밀하다 — QA 의 기준일자 검색 변형도 입력별 달력 형태다.
 * 순서가 뒤집히면(시작 > 종료) 맞바꾸는 규칙은 `orderRange`(rangeOrder.ts) 를
 * DateRangePicker 와 공유한다 — 공백 구분 동일 포맷이라 문자열 비교가 그대로 성립한다.
 */
export function DateTimeRangePicker({
  start: startProp,
  end: endProp,
  defaultStart = '',
  defaultEnd = '',
  onRangeChange,
  startName,
  endName,
  precision = 'second',
  min,
  max,
  presets,
  mode,
  lock,
  invalid,
  size,
  className,
}: DateTimeRangePickerProps) {
  const [range, setRange] = useControllableState<DateRange>(
    startProp !== undefined || endProp !== undefined
      ? { start: startProp ?? '', end: endProp ?? '' }
      : undefined,
    { start: defaultStart, end: defaultEnd },
    onRangeChange,
  );
  /** view 분기용 mode·size 만 쓴다 — id·invalid·dirty 는 양끝 `SideDateTime` 이 각자 배선한다. */
  const field = useFieldControl({ invalid, size, mode, lock });

  if (field.state.view) {
    // 한쪽만 있으면 그쪽만 그린다 — `~` 는 양쪽 값이 있을 때만 뜻이 있다. 둘 다 빈값이면 빈칸.
    const display =
      range.start && range.end ? `${range.start} ~ ${range.end}` : range.start || range.end;
    return <FieldViewText size={field.size}>{display || null}</FieldViewText>;
  }

  const commitSide = (side: 'start' | 'end', nextValue: string) => {
    setRange(orderRange({ ...range, [side]: nextValue }));
  };

  /**
   * 프리셋 클릭 — 양끝을 한 번에 채운다. 날짜만 온 프리셋(`presetRange` 산출물)은
   * `toDateTimeRange` 가 하루 전체로 넓힌다. dirty 통지는 누른 쪽 `SideDateTime` 이 한다.
   */
  const applyPreset = (preset: DateRangePreset) => {
    const resolved = typeof preset.range === 'function' ? preset.range(new Date()) : preset.range;
    setRange(orderRange(toDateTimeRange(resolved, precision)));
  };

  return (
    // gap 10px · 물결표 20px/500/black — QA .filter-calender-wrapper · .form-calender__tilde 승계
    <span className={cn('flex w-full items-center gap-2.5', className)}>
      <SideDateTime
        side="start"
        value={range.start}
        name={startName}
        precision={precision}
        min={min}
        max={max}
        presets={presets}
        onPreset={applyPreset}
        lock={lock}
        invalid={invalid}
        size={size}
        mode={field.mode}
        onCommit={commitSide}
      />
      <span aria-hidden className="shrink-0 text-dl-title font-medium text-dl-fg">
        ~
      </span>
      <SideDateTime
        side="end"
        value={range.end}
        name={endName}
        precision={precision}
        min={min}
        max={max}
        presets={presets}
        onPreset={applyPreset}
        lock={lock}
        invalid={invalid}
        size={size}
        mode={field.mode}
        onCommit={commitSide}
      />
    </span>
  );
}

/**
 * 기간의 한쪽 — 자기 팝오버를 가진 DateTimePicker 축약판.
 * `mode` 는 부모가 해석한 값을 prop 으로 받는다(view 분기는 부모가 통째로 한다).
 */
function SideDateTime({
  side,
  value,
  name,
  precision,
  min,
  max,
  presets,
  onPreset,
  lock,
  invalid,
  size,
  mode,
  onCommit,
}: {
  readonly side: 'start' | 'end';
  readonly value: string;
  readonly name?: string;
  readonly precision: DateTimePrecision;
  readonly min?: string;
  readonly max?: string;
  readonly presets?: readonly DateRangePreset[];
  readonly onPreset?: (preset: DateRangePreset) => void;
  readonly lock?: boolean;
  readonly invalid?: boolean;
  readonly size?: ControlSize;
  readonly mode: FieldMode;
  readonly onCommit: (side: 'start' | 'end', value: string) => void;
}) {
  const field = useFieldControl({ invalid, size, mode, lock });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const label = side === 'start' ? '시작' : '종료';

  /**
   * 값 커밋의 단일 통로 — 타이핑과 팝업이 여기로 모인다.
   * 한곳으로 모으는 이유는 dirty 통지를 빠뜨리지 않기 위해서다(근거는 `DatePicker.commitText`).
   */
  const commit = (next: string) => {
    onCommit(side, next);
    field.notifyDirty();
  };

  const commitText = (text: string) => {
    setDraft(null);
    if (text.trim() === '') {
      commit('');
      return;
    }
    const normalized = normalizeDateTimeText(text, precision);
    if (normalized) commit(normalized);
  };

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Anchor asChild>
        <span className="relative block w-full">
          <input
            className={cn(
              'dl-field min-w-[190px] pr-10',
              FIELD_SIZE_CLASS[field.size],
              field.invalid && 'dl-field-error',
              field.state.lockClass,
            )}
            name={name}
            value={draft ?? value}
            placeholder={defaultPlaceholder(precision)}
            aria-label={`${label}일시`}
            aria-invalid={field['aria-invalid']}
            aria-describedby={field['aria-describedby']}
            aria-required={field.required || undefined}
            readOnly={field.state.readOnly}
            disabled={field.state.disabled}
            {...field.state.dataProps}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => commitText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitText(event.currentTarget.value);
            }}
          />
          {lock ? (
            // 잠긴 칸은 비활성 버튼 대신 자물쇠 표식 — 거짓 어포던스를 남기지 않는다.
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-dl-locked-icon">
              <Icon icon={Lock} size="lock" />
            </span>
          ) : (
            <RadixPopover.Trigger asChild>
              <CalendarButton label={`${label}일시 선택 열기`} locked={field.state.disabled} />
            </RadixPopover.Trigger>
          )}
        </span>
      </RadixPopover.Anchor>

      <RadixPopover.Portal>
        <RadixPopover.Content sideOffset={4} align="start" className={PANEL_CLASS}>
          {presets && onPreset ? (
            <PresetRow
              presets={presets}
              onApply={(preset) => {
                onPreset(preset);
                // 부모 applyPreset 은 값만 바꾼다 — dirty 통지·닫기는 누른 쪽이 한다.
                field.notifyDirty();
                setOpen(false);
              }}
            />
          ) : null}
          <DateTimePanel
            value={value}
            min={min}
            max={max}
            precision={precision}
            onChange={(next) => {
              setDraft(null);
              commit(next);
            }}
            onConfirm={() => setOpen(false)}
          />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
