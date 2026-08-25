'use client';

import { Button, cn, Input, Label, NativeSelect, NumberInput, Switch } from '@hvy/ui';
import { RotateCcw } from 'lucide-react';
import { createContext, type ReactNode, useContext, useId } from 'react';

/**
 * 테스트 페이지 전용 컨트롤 헬퍼 — **도그푸딩**이다.
 *
 * 컨트롤 자체를 `@hvy/ui` 로 만들어, 컨트롤을 조작하는 것이 곧 그 컴포넌트들의 상시 동작
 * 검증이 된다. 피검사 컴포넌트가 깨지면 컨트롤도 같이 죽는 순환은 개발 전용 페이지라
 * 수용한다 — 개요(전체 목록)는 무상태 정적 렌더라 최소한의 진단은 남는다.
 *
 * `packages/ui` 에 넣지 않는다 — 화면 조합물(Composite)은 앱이 갖는다는
 * Primitive/Composite 구분 기준(ui/index.ts) 그대로다.
 *
 * ── 무엇을 컨트롤로 쓸 수 있나 (규칙) ──────────────────────────────────────
 * **인라인(비-오버레이) 프리미티브만 쓴다.** 오버레이(`Select` · `MultiSelect` · `Combobox` ·
 * 피커류 · `Dialog`)는 좌측 컬럼에서 열리면 프리뷰 위를 덮어 **지금 보는 패널이 어느 쪽
 * 것인지**가 흐려지고, 포커스 트랩·z-index 가 피검사 대상과 서로를 밟는다. 인라인
 * (`Input` · `NativeSelect` · `Switch` · `NumberInput` · `Button`)은 자리에 고정돼 그 문제가 없다.
 *
 * 단 **피검사 대상과 컨트롤이 100% 일치하는 문서에서는 그 컨트롤을 쓰지 않는다** —
 * `number-input` 문서의 플레이그라운드는 숫자 축을 `NumberControl` 로 두지 않는다(어느 쪽이
 * 고장인지 구분이 안 된다). 그런 자리는 `EnumControl` 로 후보값 목록을 준다.
 *
 * ── 범위 슬라이더를 두지 않는 이유 ─────────────────────────────────────────
 * 1. `@hvy/ui` 에 slider 가 없다. 네이티브 `<input type="range">` 는 조작해도 **아무것도
 *    검증하지 못하고**, 디자인시스템 문서가 시스템에 없는 위젯을 전시하게 된다.
 * 2. 트랙·썸은 벤더 의사요소(`::-webkit-slider-thumb`)라 테마 4종 전환을 따라가지 않는데,
 *    `verify:tokens` 는 클래스 문자열만 보므로 **이 부패를 잡지 못한다**.
 * 3. 이 앱의 숫자 축은 전부 임계값 축이다(searchThreshold 10 · 페이지 경계 20 ·
 *    WORK_TABS_MAX). 필요한 건 연속 드래그가 아니라 **정확히 11 을 밟는 것**이고,
 *    그건 `NumberControl` 의 presets 칩이 한다.
 * 4. 정말 연속 스크럽이 필요해지면 순서는 `packages/ui` 에 Slider 를 추가하는 것이다.
 *    앱 전용 우회 위젯을 먼저 만들면 나중에 DS Slider 가 생겨도 이 자리는 안 바뀐다.
 */

/**
 * 컨트롤 배치 방향 — `PlaygroundGrid` 가 내리고 `ControlGroup` 의 구분선이 읽는다.
 * 기본값을 두는 이유: 컨트롤만 인라인으로 쓰는 데모(data-grid/density 등)가 실제로 있다.
 */
const ControlLayoutContext = createContext<'side' | 'stack'>('side');

/**
 * 내부 전용 공용 행 — 라벨 폭을 **한 곳에서** 정한다.
 * 컨트롤마다 복제하면 종류가 늘 때마다 폭이 조용히 어긋난다. export 하지 않는 이유는
 * 데모가 직접 조립하기 시작하면 그게 곧 새로운 축 표기 방식이 되기 때문이다.
 */
function ControlRow({
  id,
  label,
  align = 'center',
  children,
}: {
  /**
   * 라벨이 가리킬 컨트롤. **생략하면 그룹**으로 렌더한다 — 스위치 여러 개처럼 단일 컨트롤이
   * 없는 축에서 `htmlFor` 를 주면 허공을 가리켜 라벨 클릭이 조용히 죽는다.
   */
  readonly id?: string;
  readonly label: string;
  /** presets 칩처럼 컨트롤이 여러 줄이면 'start' — 라벨이 첫 줄에 붙는다. */
  readonly align?: 'center' | 'start';
  readonly children: ReactNode;
}) {
  const labelClass = cn('w-24 shrink-0', align === 'start' && 'pt-1.5');
  const rowClass = cn('flex gap-2', align === 'center' ? 'items-center' : 'items-start');
  const body = <div className="flex min-w-0 flex-1 flex-col gap-1.5">{children}</div>;

  // 두 갈래를 삼항이 아니라 분기로 나눈다 — 조건부 role 은 정적 분석이 판정하지 못한다.
  // 그룹 쪽이 `div role="group"` 이 아니라 `fieldset` 인 이유도 같다: 시맨틱 요소가 있으면
  // 그걸 쓴다. 시각 라벨에 aria-hidden 을 다는 것은 legend 와 **같은 문장이 두 번 읽히는**
  // 것을 막기 위해서다 — 이름은 legend 가 맡고 span 은 보이기만 한다.
  if (id === undefined) {
    return (
      <fieldset className="min-w-0">
        <legend className="sr-only">{label}</legend>
        <div className={rowClass}>
          <span aria-hidden="true" className={cn(labelClass, 'text-dl-sm text-dl-fg')}>
            {label}
          </span>
          {body}
        </div>
      </fieldset>
    );
  }

  return (
    <div className={rowClass}>
      <Label htmlFor={id} className={labelClass}>
        {label}
      </Label>
      {body}
    </div>
  );
}

/** enum 형 prop 선택 컨트롤. `<option>` 값이 곧 prop 값이라 캐스팅이 안전하다. */
export function EnumControl<T extends string>({
  label,
  value,
  options,
  onChange,
  optionLabel,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly T[];
  readonly onChange: (next: T) => void;
  /** 값과 다른 표시 문구가 필요할 때만. 없으면 값이 곧 라벨이다. */
  readonly optionLabel?: (value: T) => string;
}) {
  const id = useId();
  return (
    <ControlRow id={id} label={label}>
      <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel ? optionLabel(option) : option}
          </option>
        ))}
      </NativeSelect>
    </ControlRow>
  );
}

/** boolean prop 토글 컨트롤. `<button>` 도 labelable 이라 라벨 클릭으로 토글된다. */
export function BoolControl({
  label,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (next: boolean) => void;
}) {
  const id = useId();
  return (
    <ControlRow id={id} label={label}>
      <Switch id={id} checked={checked} onCheckedChange={onChange} label={label} />
    </ControlRow>
  );
}

/** 문자열 prop 입력 컨트롤. */
export function TextControl({
  label,
  value,
  onChange,
  placeholder,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly placeholder?: string;
}) {
  const id = useId();
  return (
    <ControlRow id={id} label={label}>
      <Input
        id={id}
        size="sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </ControlRow>
  );
}

/**
 * 숫자 축. `NumberInput` 도그푸딩이라 조작이 곧 draft/확정 · 클램프 · 천단위 구분의 검증이다.
 *
 * `presets` 는 **경계를 정확히 밟기 위한 것**이다. 임계값 축은 10↔11 한 칸 차이가 전부인데
 * 자유 입력만으로는 아무도 그 한 칸을 밟아보지 않는다. 칩이 즉시 반영된다는 점은
 * `NumberInput` 이 blur/Enter 에 값을 확정하는 것의 완충재이기도 하다.
 */
export function NumberControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  presets,
  hint,
}: {
  readonly label: string;
  readonly value: number;
  readonly onChange: (next: number) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** 임계값 점프 칩. 현재 값과 같은 칩은 primary 로 차서 "어디에 서 있는지"를 알린다. */
  readonly presets?: readonly number[];
  /** 지금 값이 어느 국면인지 한 줄 — "11개 → 검색형". 판정 결과는 숫자 옆에 있어야 읽힌다. */
  readonly hint?: ReactNode;
}) {
  const id = useId();
  return (
    <ControlRow id={id} label={label} align={presets || hint ? 'start' : 'center'}>
      <NumberInput
        id={id}
        size="sm"
        value={value}
        min={min}
        max={max}
        step={step}
        // 축은 항상 값이 있어야 한다 — 빈 축은 "prop 을 안 준 것"과 구분되지 않는다.
        onValueChange={(next) => onChange(next ?? min ?? 0)}
      />
      {presets ? (
        <div className="flex flex-wrap gap-1">
          {presets.map((preset) => (
            <Button
              key={preset}
              size="xs"
              variant={value === preset ? 'primary' : 'outline-gray'}
              onClick={() => onChange(preset)}
            >
              {preset}
            </Button>
          ))}
        </div>
      ) : null}
      {hint ? <p className="text-dl-xs text-dl-fg-muted">{hint}</p> : null}
    </ControlRow>
  );
}

/**
 * 여러 값을 동시에 켜는 축 — variant 비교처럼 "무엇을 화면에 **나란히** 남길지"가 축인 자리.
 * 톤·크기 계열은 옆에 놓고 봐야 차이가 읽히므로 하나씩 고르는 enum 으로는 부족하다.
 * `Switch` 를 쓰는 이유는 `CheckboxGroup` 이 값 배열 계약이라 이 자리의 부분 토글과 어긋나서다.
 */
export function MultiEnumControl<T extends string>({
  label,
  values,
  options,
  onChange,
  optionLabel,
}: {
  readonly label: string;
  readonly values: readonly T[];
  readonly options: readonly T[];
  readonly onChange: (next: readonly T[]) => void;
  readonly optionLabel?: (value: T) => string;
}) {
  return (
    <ControlRow label={label} align="start">
      <div className="flex flex-col gap-1.5">
        {options.map((option) => {
          const checked = values.includes(option);
          return (
            <Switch
              key={option}
              checked={checked}
              // 원본 options 순서를 유지한다 — 토글 순서대로 쌓이면 프리뷰가 매번 뒤섞인다.
              onCheckedChange={() =>
                onChange(
                  checked
                    ? values.filter((value) => value !== option)
                    : options.filter((value) => value === option || values.includes(value)),
                )
              }
              label={optionLabel ? optionLabel(option) : option}
            />
          );
        })}
      </div>
    </ControlRow>
  );
}

/**
 * 컨트롤 묶음. 축이 예닐곱을 넘으면 나열만으로는 **무엇이 무엇과 직교하는지**가 사라진다.
 * 첫 그룹의 선은 CSS(`first:`)가 지운다 — 인덱스를 세지 않는다.
 */
export function ControlGroup({
  title,
  note,
  children,
}: {
  readonly title: string;
  /** 이 묶음이 왜 한 덩어리인지 한 줄 — "이 셋은 직교한다" 같은 것. */
  readonly note?: ReactNode;
  readonly children: ReactNode;
}) {
  const layout = useContext(ControlLayoutContext);
  return (
    <section
      className={cn(
        'flex flex-col gap-2.5 border-dl-divider',
        layout === 'stack'
          ? 'border-l pl-4 first:border-l-0 first:pl-0'
          : 'border-t pt-3 first:border-t-0 first:pt-0',
      )}
    >
      <div>
        <h4 className="text-dl-xs font-semibold text-dl-fg-strong">{title}</h4>
        {note ? <p className="mt-0.5 text-dl-xs text-dl-fg-muted">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** 섹션 카드 — 갤러리 공용 패널. */
export function Panel({
  title,
  note,
  children,
  className,
}: {
  readonly title: string;
  readonly note?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <section className="rounded-dl-container border border-dl-border bg-dl-surface">
      <header className="border-b border-dl-divider px-4 py-3">
        <h3 className="text-dl-xl font-bold text-dl-fg-strong">{title}</h3>
        {note ? <p className="mt-0.5 text-dl-sm text-dl-fg-muted">{note}</p> : null}
      </header>
      <div className={cn('px-4 py-4', className)}>{children}</div>
    </section>
  );
}

/**
 * 인터랙티브 플레이그라운드의 본체.
 *
 * `code` 는 현재 컨트롤 값으로 만든 JSX 문자열이다 — 눈으로 본 상태를 그대로 복붙한다.
 * 카드(Panel)를 두르지 않는 이유: 문서 페이지의 ComponentPreview 카드 **안**에서 쓰이므로
 * 여기서 또 두르면 이중 카드가 된다.
 *
 * `layout='stack'` 은 프리뷰가 **전폭을 요구하는** 것(DataGrid · Table · WorkTabsBar)용이다 —
 * 280px 좌측 컬럼을 붙이면 그리드가 못 볼 만큼 좁아진다.
 *
 * 프리뷰 컬럼의 sticky 는 조상 체인에 `overflow` 가 없다는 전제 위에 있다(ComponentPreview →
 * Tabs → TabPanel 확인함). 나중에 그 사슬 어딘가에 `overflow-hidden` 이 들어가면 **에러 없이**
 * 죽으므로, 컨트롤을 스크롤해도 프리뷰가 따라오는지 눈으로 확인하는 것이 유일한 진단이다.
 */
export function PlaygroundGrid({
  controls,
  code,
  onReset,
  layout = 'side',
  children,
}: {
  readonly controls: ReactNode;
  readonly code?: string;
  /** 있으면 컨트롤 머리에 초기화 버튼이 붙는다. 축이 예닐곱을 넘는 데모에서만 켠다. */
  readonly onReset?: () => void;
  readonly layout?: 'side' | 'stack';
  readonly children: ReactNode;
}) {
  const resetButton = onReset ? (
    <Button size="xs" variant="outline-gray" icon={RotateCcw} onClick={onReset}>
      초기화
    </Button>
  ) : null;

  return (
    <ControlLayoutContext.Provider value={layout}>
      {layout === 'stack' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-dl-divider pb-3">
            {controls}
            {resetButton}
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div className="rounded-dl-control bg-dl-canvas p-4">{children}</div>
            {code ? <PlaygroundCode code={code} /> : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-2.5 border-dl-divider md:border-r md:pr-4">
            {resetButton ? <div className="flex justify-end">{resetButton}</div> : null}
            {controls}
          </div>
          {/* self-start 가 없으면 grid item 이 stretch 되어 sticky 가 먹지 않는다. */}
          <div className="flex min-w-0 flex-col gap-3 md:sticky md:top-dl-gutter md:self-start">
            <div className="flex flex-wrap items-center gap-2 rounded-dl-control bg-dl-canvas p-4">
              {children}
            </div>
            {code ? <PlaygroundCode code={code} /> : null}
          </div>
        </div>
      )}
    </ControlLayoutContext.Provider>
  );
}

/** 현재 값으로 조립된 스니펫 — 줄바꿈이 살아야 하므로 `whitespace-pre` 다. */
function PlaygroundCode({ code }: { readonly code: string }) {
  return (
    <pre className="overflow-x-auto rounded-dl-control bg-dl-canvas px-3 py-2 font-dl-mono text-dl-xs whitespace-pre text-dl-fg-muted">
      {code}
    </pre>
  );
}
