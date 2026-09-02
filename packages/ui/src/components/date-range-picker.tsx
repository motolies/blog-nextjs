'use client';

import { Lock } from 'lucide-react';
import { Popover as RadixPopover } from 'radix-ui';
import { useState } from 'react';
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
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';
import {
  abbreviateDate,
  commitRangeSide,
  initialEditingSide,
  type RangeSide,
  selectRangeDate,
} from './rangeFlow';
import { type DateRange, orderRange } from './rangeOrder';
import { Tab, TabList, Tabs } from './tabs';

/**
 * 기간 선택 — **테두리 하나(`dl-field-box`) 안에 시작 입력 · `~` · 종료 입력 · 달력 버튼 하나**.
 * DateTimeRangePicker 와 같은 셸(`RANGE_SHELL_CLASS` 계열)과 편집 규칙(`rangeFlow.ts`)을 쓴다.
 *
 * `DatePicker` 를 기반으로 조립한다: 타이핑 정규화(`normalizeDateText`)·달력 버튼
 * (`CalendarButton`)·팝업 배색(`PANEL_CLASS`) 을 그대로 재사용하고, 이 파일은
 * "두 값을 한 몸으로 다룬다"는 부분만 더한다.
 *
 * 팝오버는 하나고 상단 탭이 어느 칸을 고칠지 정한다. 열 때는 채워가는 중이면 다음 빈칸, 다 찼으면 시작부터
 * (`initialEditingSide`). 달력 클릭은 한쪽을 확정하고, 반대편이 **비어 있을 때만** 닫지 않고 그쪽으로
 * 넘어간다 — 빈 상태에서 두 번 클릭하면 기간이 완성되고, 이미 채워진 기간에서는 고른 칸 하나만 바뀐다
 * (`selectRangeDate`). 인라인 입력에 포커스가 가면 탭도 그쪽을 따라간다.
 *
 * 역순(시작 > 종료)은 **경로를 가리지 않고** `orderRange` 가 맞바꾸고, 그때 편집 중인 탭도 값을 따라 옮긴다
 * (`commitRangeSide`). 달력 클릭에만 있던 "재시작"(종료값을 버리고 다시 시작) 예외는 없다 — 같은 상황을
 * 마우스와 키보드가 다르게 처리하던 원인이었다.
 *
 * 트리거가 하나라 `Popover.Trigger asChild` 를 그대로 쓴다 — 예전 양끝 버튼 구조에서 필요했던
 * `onInteractOutside`/`onCloseAutoFocus` 수동 이행(Radix 는 트리거를 `triggerRef` 하나로만 추적한다)이
 * 사라졌고 포커스 복귀는 Radix 가 맡는다.
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
 *
 * **항상 한 줄**이다 — 행은 nowrap, 버튼은 `shrink-0 whitespace-nowrap`(라벨 "최근 7일"
 * 의 공백에서 버튼 안쪽이 접히지 않게).
 *
 * 팝오버에는 폭 지정이 없어 자식 중 가장 넓은 것을 따라간다(shrink-to-fit). 프리셋이
 * 달력보다 넓으면 팝오버 폭이 이 행의 폭이 되는데, 그때 달력이 고정 폭이면 **달력 오른쪽에
 * 빈 공간**이 생기고 그리드가 왼쪽으로 쏠려 보인다(실측 292 vs 256 — 36px). 그래서
 * `Calendar` 에 `w-auto min-w-64`(최소만 고정)를 넘겨 이 행의 폭을 **채운다** — 7열 그리드가
 * 균등 분배되므로 쏠림이 없다. 그 덮어쓰기를 빼면(기본 `w-64`) 위 증상이 돌아온다.
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
    <div className="flex gap-1 border-b border-dl-divider px-2 pt-2 pb-2">
      {presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => onApply(preset)}
          className="shrink-0 whitespace-nowrap rounded-dl-control border border-dl-border bg-dl-surface px-2 py-1 text-dl-fg-muted text-dl-xs hover:bg-dl-option-hover"
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
  /** 5단 사이즈 — 셸과 시작·종료 입력에 함께 적용된다. */
  readonly size?: ControlSize;
  /**
   * **시작일 입력**의 id — 감싼 `Field` 의 `htmlFor` 가 가리킬 대상이다.
   * 없으면 라벨이 존재하지 않는 요소를 가리켜 클릭·스크린리더 연결이 조용히 끊긴다.
   */
  readonly id?: string;
  readonly className?: string;
};

/**
 * 팝오버 상단의 시작/종료 탭 — 날짜·일시 범위 피커가 공유한다. Radix Tabs 라 TabPanel 없이 동작하고
 * 편집 영역은 탭 아래 패널 하나를 공유한다. 탭 안 현재값(`startLabel`/`endLabel`)은 읽기 전용 축약이다.
 *
 * 탭이 둘뿐이라 **폭을 반씩 나눈다**(`flex-1 justify-center`) — 기본 탭처럼 왼쪽에 몰아 두면 오른쪽에
 * 빈 여백이 남아 어느 쪽이 활성인지 밑줄이 짧아 보인다. `Tab` 기본의 `shrink-0` 은 `shrink` 로 되돌린다.
 */
const SIDE_TAB_CLASS = 'flex-1 shrink justify-center';
export function RangeSideTabs({
  editing,
  startLabel,
  endLabel,
  onEditingChange,
}: {
  readonly editing: RangeSide;
  readonly startLabel: string;
  readonly endLabel: string;
  readonly onEditingChange: (side: RangeSide) => void;
}) {
  return (
    <Tabs value={editing} onValueChange={(value) => onEditingChange(value as RangeSide)}>
      <TabList size="sm" label="편집할 끝">
        <Tab value="start" className={SIDE_TAB_CLASS}>
          시작
          <span className="text-dl-fg-muted text-dl-xs">{startLabel}</span>
        </Tab>
        <Tab value="end" className={SIDE_TAB_CLASS}>
          종료
          <span className="text-dl-fg-muted text-dl-xs">{endLabel}</span>
        </Tab>
      </TabList>
    </Tabs>
  );
}

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
  /** 달력이 지금 정하는 칸 — 탭·이어받기·인라인 입력 포커스·맞바꿈이 바꾼다. */
  const [editing, setEditing] = useState<RangeSide>('start');
  /**
   * `notifyDirty`(달력은 Portal 이라 버블링이 닿지 않는다 — `DatePicker.commitText` 주석 참조)와
   * id·invalid·size·mode 를 한 번만 해석해 양끝 입력에 내려보낸다(중복 호출하면 Field 컨텍스트의 id 가 갈린다).
   */
  const field = useFieldControl({ id, invalid, size, mode, lock });

  if (field.state.view) {
    // 한쪽만 있으면 그쪽만 그린다 — `~` 는 양쪽 값이 있을 때만 뜻이 있다. 둘 다 빈값이면 빈칸.
    const display =
      range.start && range.end ? `${range.start} ~ ${range.end}` : range.start || range.end;
    return <FieldViewText size={field.size}>{display || null}</FieldViewText>;
  }

  /** 타이핑 커밋 — 무효 입력은 `RangeDateInput` 이 이전 값으로 되돌린다. 맞바뀌면 편집 탭도 따라간다. */
  const commitSide = (side: RangeSide, text: string) => {
    const iso = text.trim() === '' ? '' : normalizeDateText(text);
    if (iso === null) return;
    const result = commitRangeSide(range, side, iso);
    setRange(result.range);
    setEditing(result.editing);
    field.notifyDirty();
  };

  /** 달력 클릭 — 규칙은 `selectRangeDate`(반대편이 비었으면 이어받고, 아니면 정렬해 닫는다). */
  const handleSelect = (iso: string) => {
    const result = selectRangeDate(range, editing, iso);
    setRange(result.range);
    setEditing(result.editing);
    field.notifyDirty();
    if (result.close) setOpen(false);
  };

  /**
   * 프리셋 클릭 — 양끝을 한 번에 채우고 닫는다. 달력 클릭과 같은 커밋 경로
   * (`orderRange`)를 지나므로 앱이 역순 range 를 줘도 뒤집힌 기간이 생기지 않는다.
   */
  const applyPreset = (preset: DateRangePreset) => {
    const next = typeof preset.range === 'function' ? preset.range(new Date()) : preset.range;
    setRange(orderRange(next));
    field.notifyDirty();
    setOpen(false);
  };

  /** 열 때마다 어느 쪽부터 고칠지 다시 정한다 — 채워가는 중이면 다음 빈칸, 다 찼으면 시작. */
  const handleOpenChange = (next: boolean) => {
    if (next) setEditing(initialEditingSide(range));
    setOpen(next);
  };

  // 한쪽만 채워졌으면 그 값을 단일 강조한다 — 범위 강조는 양끝이 있어야 성립한다.
  const soleValue = range.start && !range.end ? range.start : !range.start ? range.end : '';
  const other: RangeSide = editing === 'start' ? 'end' : 'start';
  const abbreviate = (value: string) => abbreviateDate(value) || '미입력';

  return (
    <RadixPopover.Root open={open} onOpenChange={handleOpenChange}>
      <RadixPopover.Anchor asChild>
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
          <RangeDateInput
            side="start"
            value={range.start}
            name={startName}
            id={field.id}
            control={field}
            onCommit={commitSide}
            onFocusSide={setEditing}
          />
          <span aria-hidden className={RANGE_TILDE_CLASS}>
            ~
          </span>
          <RangeDateInput
            side="end"
            value={range.end}
            name={endName}
            control={field}
            onCommit={commitSide}
            onFocusSide={setEditing}
          />
          {lock ? (
            // 잠긴 셸은 비활성 버튼 대신 자물쇠 표식 — 거짓 어포던스를 남기지 않는다.
            <span className={RANGE_LOCK_SLOT_CLASS}>
              <Icon icon={Lock} size="lock" />
            </span>
          ) : (
            <RadixPopover.Trigger asChild>
              <CalendarButton
                label="기간 달력 열기"
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
          {/* key={editing}: 탭을 바꾸면 그쪽 값의 달로 다시 연다(initialFocus 는 마운트 때만 읽힌다). */}
          <Calendar
            key={editing}
            // 프리셋 행이 더 넓으면 그 폭을 채운다(기본 w-64 고정을 푼다) — PresetRow 주석
            className="w-auto min-w-64"
            range={{ start: range.start || undefined, end: range.end || undefined }}
            value={soleValue || undefined}
            initialFocus={range[editing] || range[other] || undefined}
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
 * 셸 안의 한쪽 날짜 입력 — 테두리·배경·패딩이 없고 글꼴·색은 셸에서 상속한다.
 * draft/commit 규칙은 DatePicker 와 동일하다(무효 입력은 blur 때 이전 값으로 되돌아간다).
 * 포커스가 오면 팝오버의 편집 탭도 따라온다.
 */
function RangeDateInput({
  side,
  value,
  name,
  id,
  control,
  onCommit,
  onFocusSide,
}: {
  readonly side: RangeSide;
  readonly value: string;
  readonly name?: string;
  readonly id?: string;
  readonly control: ReturnType<typeof useFieldControl>;
  readonly onCommit: (side: RangeSide, text: string) => void;
  readonly onFocusSide: (side: RangeSide) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (text: string) => {
    setDraft(null);
    onCommit(side, text);
  };

  return (
    <input
      // `YYYY-MM-DD` 10자 — ch 라 글꼴을 따라간다
      className={cn(RANGE_INPUT_CLASS, 'w-[10ch]')}
      // 종료 쪽은 id 를 받지 않는다 — Field 의 htmlFor 는 칸의 첫 입력을 가리킨다.
      id={id}
      name={name}
      value={draft ?? value}
      placeholder="YYYY-MM-DD"
      inputMode="numeric"
      aria-label={side === 'start' ? '시작일' : '종료일'}
      aria-invalid={control['aria-invalid']}
      aria-describedby={control['aria-describedby']}
      aria-required={control.required || undefined}
      readOnly={control.state.readOnly}
      disabled={control.state.disabled}
      onFocus={() => onFocusSide(side)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit(event.currentTarget.value);
      }}
    />
  );
}
