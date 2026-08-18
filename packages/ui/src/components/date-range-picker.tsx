'use client';

import { Lock } from 'lucide-react';
import { Popover as RadixPopover } from 'radix-ui';
import { useRef, useState } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { Calendar } from './calendar';
import { CalendarButton, normalizeDateText, PANEL_CLASS } from './date-picker';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';
import { type DateRange, orderRange } from './rangeOrder';

/**
 * 기간 선택 — 시작·종료 입력 한 쌍 + **공용 달력 하나**.
 *
 * `DatePicker` 를 기반으로 조립한다: 타이핑 정규화(`normalizeDateText`)·달력 버튼
 * (`CalendarButton`)·팝업 배색(`PANEL_CLASS`) 을 그대로 재사용하고, 이 파일은
 * "두 값을 한 몸으로 다룬다"는 부분만 더한다.
 *
 * **양끝 모두 달력 버튼을 가진다.** 누른 버튼이 곧 지금 정할 칸이고, 반대편이
 * 비어 있을 때만 팝오버를 닫지 않고 그쪽으로 넘어간다 — 빈 상태에서 두 번 클릭하면
 * 기간이 완성되고, 이미 채워진 기간에서는 누른 칸 하나만 바뀐다.
 *
 * 역순(시작 > 종료)은 **경로를 가리지 않고** `orderRange` 가 맞바꾼다. 달력 클릭에만
 * 있던 "재시작"(종료값을 버리고 다시 시작) 예외는 제거했다 — 같은 상황을 마우스와
 * 키보드가 다르게 처리하던 원인이었다.
 *
 * **`Popover.Trigger` 를 쓰지 않는다.** Radix 는 트리거를 `triggerRef` 하나로만
 * 추적해서(`@radix-ui/react-popover` 의 `Popover.Trigger` 가 ref 를 합성한다),
 * 버튼이 둘이면 나중 렌더된 쪽만 등록된다. 미등록 버튼은 바깥 클릭 방어
 * (`onInteractOutside` 의 `triggerRef.current?.contains(target)` 검사)를 못 받아
 * **pointerdown 으로 닫힌 뒤 click 이 다시 열어 영영 닫히지 않고**, 닫힐 때
 * 포커스도 항상 첫 버튼으로 돌아간다. 그래서 open 을 직접 들고 그 두 가지를
 * 아래에서 이행한다.
 */

export type { DateRange };

/**
 * 기간 프리셋 한 건 — 라벨은 앱이 주입한다(`ui` 는 사전을 모른다).
 * 산식은 `presetRange`(datePresets.ts)를 가져다 조립하는 것이 정본이다 —
 * `range` 를 함수로 주면 **클릭 시점**의 오늘로 계산한다(화면을 밤새 열어둬도 맞는 근거).
 */
export type DateRangePreset = {
  readonly label: string;
  readonly range: DateRange | ((today: Date) => DateRange);
};

/**
 * 프리셋 버튼 행 — 달력 팝오버 상단. 기간 2종(날짜 · datetime)이 공유한다
 * (`CalendarButton`·`PANEL_CLASS` 를 date-picker 가 내주는 것과 같은 방식).
 * 패널엔 패딩이 없다(Calendar 가 자체 패딩을 가진다) — 이 행은 자기 패딩을 갖는다.
 */
export function PresetRow({
  presets,
  onApply,
}: {
  readonly presets: readonly DateRangePreset[];
  readonly onApply: (preset: DateRangePreset) => void;
}) {
  if (presets.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 border-b border-dl-divider px-2 pt-2 pb-2">
      {presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => onApply(preset)}
          className="rounded-dl-control border border-dl-border bg-dl-surface px-2 py-1 text-dl-fg-muted text-dl-xs hover:bg-dl-option-hover"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

export type DateRangePickerProps = {
  /** 각각 `YYYY-MM-DD` 또는 빈 문자열. 주면 controlled. */
  readonly start?: string;
  readonly end?: string;
  readonly defaultStart?: string;
  readonly defaultEnd?: string;
  readonly onRangeChange?: (range: DateRange) => void;
  /** FormData 전송용 — 시작·종료가 각자 이름을 가진다(검색 조건 관례). */
  readonly startName?: string;
  readonly endName?: string;
  readonly min?: string;
  readonly max?: string;
  /**
   * 기간 프리셋 — 달력 팝오버 위에 버튼 행으로 뜬다. 클릭하면 양끝을 한 번에
   * 채우고 닫는다. edit 에서만 렌더된다(view/lock 은 기존 분기가 선행).
   */
  readonly presets?: readonly DateRangePreset[];
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  /** 시스템 채움 영구 불변 — readOnly + 자물쇠(달력 버튼 대신). 모든 mode 를 이긴다. */
  readonly lock?: boolean;
  readonly invalid?: boolean;
  /** 5단 사이즈 — 시작·종료 입력 둘 다에 적용된다. */
  readonly size?: ControlSize;
  /**
   * **시작일 입력**의 id — 감싼 `Field` 의 `htmlFor` 가 가리킬 대상이다.
   * 없으면 라벨이 존재하지 않는 요소를 가리켜 클릭·스크린리더 연결이 조용히 끊긴다.
   */
  readonly id?: string;
  readonly className?: string;
};

export function DateRangePicker({
  start: startProp,
  end: endProp,
  defaultStart = '',
  defaultEnd = '',
  onRangeChange,
  startName,
  endName,
  min,
  max,
  presets,
  mode,
  lock,
  invalid,
  size,
  id,
  className,
}: DateRangePickerProps) {
  // 한 이벤트(스왑·이어받기)가 두 값을 동시에 바꾸므로 range 를 하나의 상태로 든다.
  const [range, setRange] = useControllableState<DateRange>(
    startProp !== undefined || endProp !== undefined
      ? { start: startProp ?? '', end: endProp ?? '' }
      : undefined,
    { start: defaultStart, end: defaultEnd },
    onRangeChange,
  );
  const [open, setOpen] = useState(false);
  /** 달력이 지금 정하는 칸 — 버튼을 누른 쪽에서 시작한다. */
  const [editing, setEditing] = useState<'start' | 'end'>('start');
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const endButtonRef = useRef<HTMLButtonElement>(null);
  /** 바깥을 눌러 닫혔는가 — 그때는 포커스를 버튼으로 끌어오지 않는다(Radix 비모달과 같은 규칙). */
  const closedByOutsideRef = useRef(false);
  /**
   * `notifyDirty`(달력은 Portal 이라 버블링이 닿지 않는다 — `DatePicker.commitText` 주석 참조)와
   * view 분기용 `mode`·`size` 만 쓴다. invalid 는 양끝 `SideInput` 이 각자 배선한다.
   */
  const field = useFieldControl({ invalid, size, mode, lock });
  const notifyDirty = field.notifyDirty;

  if (field.state.view) {
    // 한쪽만 있으면 그쪽만 그린다 — `~` 는 양쪽 값이 있을 때만 뜻이 있다. 둘 다 빈값이면 빈칸.
    const display =
      range.start && range.end ? `${range.start} ~ ${range.end}` : range.start || range.end;
    return <FieldViewText size={field.size}>{display || null}</FieldViewText>;
  }

  const commitSide = (side: 'start' | 'end', text: string) => {
    const iso = text.trim() === '' ? '' : normalizeDateText(text);
    if (iso === null) return; // 무효 입력은 SideInput 이 이전 값으로 되돌린다
    notifyDirty();
    setRange(orderRange({ ...range, [side]: iso }));
  };

  /** 달력 버튼 — 누른 쪽이 곧 편집 대상이다. 같은 쪽을 다시 누르면 닫는다. */
  const toggleCalendar = (side: 'start' | 'end') => {
    if (open && editing === side) {
      setOpen(false);
      return;
    }
    setEditing(side);
    setOpen(true);
  };

  /**
   * 달력 클릭 — 누른 쪽 칸을 채운다.
   * 반대편이 **비어 있을 때만** 열어 둔 채 그쪽으로 넘어간다(두 번 클릭 = 기간 완성).
   * 반대편이 이미 있으면 정렬해 확정하고 닫는다. 반쪽 상태에서는 정렬하지 않는다 —
   * 아직 비교 대상이 없어서 뒤집을 근거가 없다.
   */
  const handleSelect = (iso: string) => {
    notifyDirty();
    const other = editing === 'start' ? 'end' : 'start';
    const next = { ...range, [editing]: iso } as DateRange;
    if (range[other] === '') {
      setRange(next);
      setEditing(other);
      return;
    }
    setRange(orderRange(next));
    setOpen(false);
  };

  /**
   * 프리셋 클릭 — 양끝을 한 번에 채우고 닫는다. 달력 클릭과 같은 커밋 경로
   * (`orderRange`)를 지나므로 앱이 역순 range 를 줘도 뒤집힌 기간이 생기지 않는다.
   */
  const applyPreset = (preset: DateRangePreset) => {
    notifyDirty();
    const next = typeof preset.range === 'function' ? preset.range(new Date()) : preset.range;
    setRange(orderRange(next));
    setOpen(false);
  };

  // 한쪽만 채워졌으면 그 값을 단일 강조한다 — 범위 강조는 양끝이 있어야 성립한다.
  const soleValue = range.start && !range.end ? range.start : !range.start ? range.end : '';

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Anchor asChild>
        {/* gap 10px · 물결표 20px/500/black — QA .filter-calender-wrapper · .form-calender__tilde 실측 */}
        <span className={cn('flex w-full items-center gap-2.5', className)}>
          <span className="relative block w-full">
            <SideInput
              side="start"
              value={range.start}
              name={startName}
              id={id}
              lock={lock}
              invalid={invalid}
              size={size}
              mode={field.mode}
              onCommit={commitSide}
              className="pr-10"
            />
            {lock ? (
              // 잠긴 칸은 비활성 버튼 대신 자물쇠 표식 — 거짓 어포던스를 남기지 않는다.
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-dl-locked-icon">
                <Icon icon={Lock} size="lock" />
              </span>
            ) : (
              <CalendarButton
                ref={startButtonRef}
                label="시작일 달력 열기"
                locked={field.state.disabled}
                aria-haspopup="dialog"
                aria-expanded={open && editing === 'start'}
                onClick={() => toggleCalendar('start')}
              />
            )}
          </span>
          <span aria-hidden className="shrink-0 text-dl-title font-medium text-dl-fg">
            ~
          </span>
          <span className="relative block w-full">
            <SideInput
              side="end"
              value={range.end}
              name={endName}
              lock={lock}
              invalid={invalid}
              size={size}
              mode={field.mode}
              onCommit={commitSide}
              className="pr-10"
            />
            {lock ? (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-dl-locked-icon">
                <Icon icon={Lock} size="lock" />
              </span>
            ) : (
              <CalendarButton
                ref={endButtonRef}
                label="종료일 달력 열기"
                locked={field.state.disabled}
                aria-haspopup="dialog"
                aria-expanded={open && editing === 'end'}
                onClick={() => toggleCalendar('end')}
              />
            )}
          </span>
        </span>
      </RadixPopover.Anchor>

      <RadixPopover.Portal>
        <RadixPopover.Content
          sideOffset={4}
          // 누른 쪽에 붙는다 — 앵커가 행 전체라 정렬이 곧 어느 칸을 고치는지의 표시가 된다.
          align={editing === 'start' ? 'start' : 'end'}
          className={PANEL_CLASS}
          onInteractOutside={(event) => {
            const target = event.target as Node | null;
            const onButton =
              !!target &&
              (Boolean(startButtonRef.current?.contains(target)) ||
                Boolean(endButtonRef.current?.contains(target)));
            // 버튼 위 pointerdown 은 닫지 않는다 — 이어지는 onClick 이 토글하므로
            // 여기서 닫으면 "닫혔다 다시 열림"이 되어 같은 버튼으로는 영영 못 닫는다.
            if (onButton) {
              event.preventDefault();
              return;
            }
            closedByOutsideRef.current = true;
          }}
          onCloseAutoFocus={(event) => {
            // Radix 기본은 triggerRef 로 포커스를 되돌리는데 여기엔 트리거가 없어 body 로 샌다.
            event.preventDefault();
            if (!closedByOutsideRef.current) {
              (editing === 'start' ? startButtonRef : endButtonRef).current?.focus();
            }
            closedByOutsideRef.current = false;
          }}
        >
          {presets ? <PresetRow presets={presets} onApply={applyPreset} /> : null}
          <Calendar
            range={{ start: range.start || undefined, end: range.end || undefined }}
            value={soleValue || undefined}
            initialFocus={
              range[editing] || range[editing === 'start' ? 'end' : 'start'] || undefined
            }
            min={min}
            max={max}
            onSelect={handleSelect}
          />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

/**
 * 기간의 한쪽 입력 — DatePicker 의 draft/commit 규칙과 동일하다.
 * `mode` 는 부모가 해석한 값을 prop 으로 받는다 — 자체 컨텍스트 조회에 맡기면
 * 부모와 다른 값을 읽을 수 있는 배선을 남기게 된다(view 분기는 부모가 통째로 한다).
 */
function SideInput({
  side,
  value,
  name,
  id,
  lock,
  invalid,
  size,
  mode,
  onCommit,
  className,
}: {
  readonly side: 'start' | 'end';
  readonly value: string;
  readonly name?: string;
  readonly id?: string;
  readonly lock?: boolean;
  readonly invalid?: boolean;
  readonly size?: ControlSize;
  readonly mode: FieldMode;
  readonly onCommit: (side: 'start' | 'end', text: string) => void;
  readonly className?: string;
}) {
  const field = useFieldControl({ id, invalid, size, mode, lock });
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (text: string) => {
    setDraft(null);
    onCommit(side, text);
  };

  return (
    <input
      className={cn(
        'dl-field min-w-[130px]',
        FIELD_SIZE_CLASS[field.size],
        field.invalid && 'dl-field-error',
        field.state.lockClass,
        className,
      )}
      // 종료 쪽은 id 를 받지 않는다 — Field 의 htmlFor 는 칸의 첫 입력을 가리킨다.
      id={side === 'start' ? field.id : undefined}
      name={name}
      value={draft ?? value}
      placeholder="YYYY-MM-DD"
      inputMode="numeric"
      aria-label={side === 'start' ? '시작일' : '종료일'}
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      aria-required={field.required || undefined}
      readOnly={field.state.readOnly}
      disabled={field.state.disabled}
      {...field.state.dataProps}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit(event.currentTarget.value);
      }}
    />
  );
}
