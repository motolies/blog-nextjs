'use client';

import { Lock, X } from 'lucide-react';
import { Popover as RadixPopover } from 'radix-ui';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { Calendar } from './calendar';
import {
  CalendarButton,
  normalizeDateText,
  PANEL_CLASS,
  POPOVER_COLLISION_PADDING,
  POPOVER_FIT_CLASS,
  RANGE_INPUT_CLASS,
  RANGE_LOCK_SLOT_CLASS,
  RANGE_SHELL_CLASS,
  RANGE_TILDE_CLASS,
  RANGE_TRIGGER_CLASS,
} from './date-picker';
import { type DateRangePreset, PresetRow, RangeSideTabs } from './date-range-picker';
import { toDateTimeRange } from './datePresets';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';
import {
  abbreviateDateTime,
  commitRangeSide,
  footerAction,
  initialEditingSide,
  type RangeSide,
} from './rangeFlow';
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
 * 단일 `DateTimePicker` 입력의 최소폭 — 정밀도별 글자 수(19자 · 16자) + 아이콘. 날짜(130px)보다 넓은 하한이다.
 * 기간 피커는 이 값을 쓰지 않는다 — 셸 안의 입력이 `ch` 폭을 가진다(`RANGE_INPUT_WIDTH_CLASS`).
 */
const FIELD_MIN_WIDTH_CLASS: Record<DateTimePrecision, string> = {
  second: 'min-w-[190px]',
  minute: 'min-w-[170px]',
};

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
        className="min-h-0 w-14 flex-1 overflow-y-auto max-sm:w-12"
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

/**
 * 팝업 본체 — 달력 + 시·분 리스트 + 푸터 버튼. 단일·범위 양쪽이 공유한다.
 * 범위는 `range` 로 양끝을 달력에 함께 강조하고(활성 측은 `value` 로 단일 강조),
 * 푸터 라벨을 `확인`/`다음` 으로 바꿔 쓴다.
 */
function DateTimePanel({
  value,
  range,
  min,
  max,
  precision,
  confirmLabel = '확인',
  onChange,
  onConfirm,
}: {
  readonly value: string;
  /** ISO **날짜** 양끝 — 범위 피커가 달력의 range 강조용으로 준다. */
  readonly range?: { readonly start?: string; readonly end?: string };
  readonly min?: string;
  readonly max?: string;
  readonly precision: DateTimePrecision;
  readonly confirmLabel?: string;
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
        {/* 프리셋 행이 더 넓을 때 남는 폭은 달력이 흡수하고(시간 열은 고정 — PresetRow 주석),
            팝오버가 가용 폭에 눌리면 달력이 먼저 줄어든다(POPOVER_FIT_CLASS). */}
        <Calendar
          className="min-w-0 flex-1"
          value={parts?.date}
          range={range}
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
          {confirmLabel}
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
              'dl-field pr-10',
              FIELD_MIN_WIDTH_CLASS[precision],
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
        <RadixPopover.Content
          sideOffset={4}
          align="start"
          collisionPadding={POPOVER_COLLISION_PADDING}
          className={cn(PANEL_CLASS, POPOVER_FIT_CLASS)}
        >
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
   * 기간 프리셋 — 팝오버 상단에 버튼 행으로 뜨고, 클릭하면 양끝을 한 번에 채우고 닫는다.
   * 날짜만 있는 프리셋(`presetRange` 산출물)은 하루 전체(00:00~23:59)로 넓힌다.
   */
  readonly presets?: readonly DateRangePreset[];
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  /** 시스템 채움 영구 불변 — readOnly + 자물쇠(달력 버튼 대신). 모든 mode 를 이긴다. */
  readonly lock?: boolean;
  readonly invalid?: boolean;
  /** 5단 사이즈 — 셸과 양끝 입력에 함께 적용된다. */
  readonly size?: ControlSize;
  /**
   * **시작 입력**의 id — 감싼 `Field`/라벨의 `htmlFor` 가 가리킬 대상이다(DateRangePicker 와 같은 규약).
   * 없으면 라벨이 존재하지 않는 요소를 가리켜 클릭·스크린리더 연결이 조용히 끊긴다.
   */
  readonly id?: string;
  readonly className?: string;
};

/**
 * 범위 셸 안 입력의 폭 — 정밀도별 글자 수(`YYYY-MM-DD HH:mm` 16자 · `HH:mm:ss` 19자).
 * `ch` 단위라 픽셀 리터럴 없이 컨트롤 글자 크기를 따라가고, `min-w-0` 과 함께라
 * 컨테이너가 더 좁으면 **줄바꿈 대신 입력 안에서 글자가 밀린다** — 한 줄이 산술이 아니라 구조에서 보장된다.
 */
const RANGE_INPUT_WIDTH_CLASS: Record<DateTimePrecision, string> = {
  second: 'w-[19ch]',
  minute: 'w-[16ch]',
};

/**
 * 날짜+시간 기간 — **테두리 하나(`dl-field-box`) 안에 시작 입력 · `~` · 종료 입력 · 달력 버튼 하나**.
 *
 * 예전엔 끝마다 자기 입력 테두리와 팝오버를 가졌는데, 관리자 검색 패널의 모바일 가용 폭(375px 기준 약 325px)에
 * 최소폭 170px 짜리 입력 둘과 버튼 둘이 들어가지 못해 두 줄로 꺾였다. 셸 하나로 합치면 값 16자×2 + 패딩 +
 * 버튼 하나 ≈ 316px 로 한 줄에 들어가고, 폭 분기(미디어쿼리·컨테이너쿼리·JS 측정)가 필요 없다.
 *
 * 팝오버도 하나다. 트리거가 하나라 `Popover.Trigger` 를 그대로 쓴다 — `DateRangePicker` 가 버튼 둘 때문에
 * 손수 구현한 `onInteractOutside`/`onCloseAutoFocus` 우회가 필요 없고 포커스 복귀는 Radix 가 맡는다.
 * 팝오버 안에서 시작/종료는 **탭**으로 오간다. 자동으로 넘어가지 않는다 — datetime 은 날짜·시·분
 * 3클릭이라 첫 클릭에서 넘기면 시·분을 고를 기회가 사라진다(`footerAction`).
 *
 * 값 커밋은 타이핑·달력·시·분 모두 `commitRangeSide`(rangeFlow.ts) 하나를 지난다 —
 * 순서가 뒤집히면(시작 > 종료) `orderRange` 로 맞바꾸고, 그때 편집 중인 탭도 값을 따라 옮긴다.
 *
 * 한계: `precision="second"`(19자×2)는 325px 에 들어가지 않는다 — 줄바꿈은 없고 글자가 입력 안에서 밀린다.
 * 검색 필드는 전부 `minute` 이다.
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
  id,
  className,
}: DateTimeRangePickerProps) {
  const [range, setRange] = useControllableState<DateRange>(
    startProp !== undefined || endProp !== undefined
      ? { start: startProp ?? '', end: endProp ?? '' }
      : undefined,
    { start: defaultStart, end: defaultEnd },
    onRangeChange,
  );
  const [open, setOpen] = useState(false);
  /** 팝오버가 지금 고치는 쪽 — 탭·[다음]·인라인 입력 포커스·맞바꿈이 바꾼다. */
  const [editing, setEditing] = useState<RangeSide>('start');
  const field = useFieldControl({ id, invalid, size, mode, lock });

  if (field.state.view) {
    // 한쪽만 있으면 그쪽만 그린다 — `~` 는 양쪽 값이 있을 때만 뜻이 있다. 둘 다 빈값이면 빈칸.
    const display =
      range.start && range.end ? `${range.start} ~ ${range.end}` : range.start || range.end;
    return <FieldViewText size={field.size}>{display || null}</FieldViewText>;
  }

  /** 값 커밋의 단일 통로 — 타이핑·달력·시·분이 모두 여기로 모인다(dirty 통지를 빠뜨리지 않기 위해). */
  const commitSide = (side: RangeSide, next: string) => {
    const result = commitRangeSide(range, side, next);
    setRange(result.range);
    setEditing(result.editing);
    field.notifyDirty();
  };

  /**
   * 프리셋 클릭 — 양끝을 한 번에 채우고 닫는다. 날짜만 온 프리셋(`presetRange` 산출물)은
   * `toDateTimeRange` 가 하루 전체로 넓힌다.
   */
  const applyPreset = (preset: DateRangePreset) => {
    const resolved = typeof preset.range === 'function' ? preset.range(new Date()) : preset.range;
    setRange(orderRange(toDateTimeRange(resolved, precision)));
    field.notifyDirty();
    setOpen(false);
  };

  /** 열 때마다 어느 쪽부터 고칠지 다시 정한다 — 채워가는 중이면 다음 빈칸, 다 찼으면 시작. */
  const handleOpenChange = (next: boolean) => {
    if (next) setEditing(initialEditingSide(range));
    setOpen(next);
  };

  const action = footerAction(editing, range);
  const calendarRange = {
    start: splitDateTime(range.start)?.date,
    end: splitDateTime(range.end)?.date,
  };
  const abbreviate = (value: string) => abbreviateDateTime(value) || '미입력';

  return (
    <RadixPopover.Root open={open} onOpenChange={handleOpenChange}>
      <RadixPopover.Anchor asChild>
        {/* 셸 — 왼쪽 안쪽 여백만 셸이 갖고(오른쪽은 버튼이 모서리까지 닿는다), 폭은 내용이 정한다.
            max-w-full 은 소비자 컨테이너를 넘지 않는 안전장치(넘치면 입력 안에서 글자가 밀린다). */}
        <span
          className={cn(
            RANGE_SHELL_CLASS,
            FIELD_SIZE_CLASS[field.size],
            field.invalid && 'dl-field-error',
            field.state.lockClass,
            className,
          )}
          {...field.state.dataProps}
        >
          <RangeInput
            side="start"
            value={range.start}
            name={startName}
            id={field.id}
            precision={precision}
            control={field}
            onCommit={commitSide}
            onFocusSide={setEditing}
          />
          <span aria-hidden className={RANGE_TILDE_CLASS}>
            ~
          </span>
          <RangeInput
            side="end"
            value={range.end}
            name={endName}
            precision={precision}
            control={field}
            onCommit={commitSide}
            onFocusSide={setEditing}
          />
          {lock ? (
            // 잠긴 셸은 비활성 버튼 대신 자물쇠 표식 — 버튼과 같은 폭이라 레이아웃이 흔들리지 않는다.
            <span className={RANGE_LOCK_SLOT_CLASS}>
              <Icon icon={Lock} size="lock" />
            </span>
          ) : (
            <RadixPopover.Trigger asChild>
              <CalendarButton
                label="일시 범위 선택 열기"
                locked={field.state.disabled}
                className={RANGE_TRIGGER_CLASS}
              />
            </RadixPopover.Trigger>
          )}
        </span>
      </RadixPopover.Anchor>

      <RadixPopover.Portal>
        <RadixPopover.Content
          sideOffset={4}
          align="start"
          collisionPadding={POPOVER_COLLISION_PADDING}
          className={cn(PANEL_CLASS, POPOVER_FIT_CLASS)}
        >
          {presets ? <PresetRow presets={presets} onApply={applyPreset} /> : null}
          <RangeSideTabs
            editing={editing}
            startLabel={abbreviate(range.start)}
            endLabel={abbreviate(range.end)}
            onEditingChange={setEditing}
          />
          {/* key={editing}: TimeColumn 의 scrollIntoView 가 마운트 1회라 탭 전환 시 활성 값으로 다시 맞추려면
              리마운트가 필요하다. 달력도 활성 측 날짜의 달로 다시 열린다. */}
          <DateTimePanel
            key={editing}
            value={range[editing]}
            range={calendarRange}
            min={min}
            max={max}
            precision={precision}
            confirmLabel={action === 'next' ? '다음' : '확인'}
            onChange={(next) => commitSide(editing, next)}
            onConfirm={() => {
              if (action === 'next') setEditing('end');
              else setOpen(false);
            }}
          />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

/**
 * 셸 안의 한쪽 입력 — 테두리·배경·패딩이 없고 글꼴·색은 셸에서 상속한다(input 은 기본으로 상속하지 않는다).
 * 타이핑 정규화·draft/commit 규칙은 `DatePicker.commitText` 와 같다. 포커스가 오면 팝오버의 편집 쪽도 따라온다.
 */
function RangeInput({
  side,
  value,
  name,
  id,
  precision,
  control,
  onCommit,
  onFocusSide,
}: {
  readonly side: RangeSide;
  readonly value: string;
  readonly name?: string;
  readonly id?: string;
  readonly precision: DateTimePrecision;
  readonly control: ReturnType<typeof useFieldControl>;
  readonly onCommit: (side: RangeSide, value: string) => void;
  readonly onFocusSide: (side: RangeSide) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const label = side === 'start' ? '시작' : '종료';

  const commitText = (text: string) => {
    setDraft(null);
    if (text.trim() === '') {
      onCommit(side, '');
      return;
    }
    const normalized = normalizeDateTimeText(text, precision);
    if (normalized) onCommit(side, normalized);
  };

  return (
    <input
      className={cn(RANGE_INPUT_CLASS, RANGE_INPUT_WIDTH_CLASS[precision])}
      id={id}
      name={name}
      value={draft ?? value}
      placeholder={defaultPlaceholder(precision)}
      aria-label={`${label}일시`}
      aria-invalid={control['aria-invalid']}
      aria-describedby={control['aria-describedby']}
      aria-required={control.required || undefined}
      readOnly={control.state.readOnly}
      disabled={control.state.disabled}
      onFocus={() => onFocusSide(side)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => commitText(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commitText(event.currentTarget.value);
      }}
    />
  );
}
