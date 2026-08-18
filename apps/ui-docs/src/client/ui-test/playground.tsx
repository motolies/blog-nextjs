'use client';

import { cn, Input, Label, NativeSelect, Switch } from '@hvy/ui';
import { type ReactNode, useId } from 'react';

/**
 * 테스트 페이지 전용 컨트롤 헬퍼 — **도그푸딩**이다.
 *
 * 컨트롤 자체를 `@hvy/ui`(NativeSelect · Switch · Input)로 만들어, 컨트롤을 조작하는
 * 것이 곧 그 컴포넌트들의 상시 동작 검증이 된다. 검색형 `Select` 를 쓰지 않는 이유:
 * 그쪽은 select 문서의 **피검사 대상**이라 컨트롤과 겹치면 어느 쪽 상태를 보고 있는지
 * 헷갈린다. 피검사 컴포넌트가 깨지면 컨트롤도 같이 죽는 순환은 개발 전용 페이지라
 * 수용한다 — 개요(전체 목록)는 무상태 정적 렌더라 최소한의 진단은 남는다.
 *
 * `packages/ui` 에 넣지 않는다 — 화면 조합물(Composite)은 앱이 갖는다는
 * Primitive/Composite 구분 기준(ui/index.ts) 그대로다.
 */

/** enum 형 prop 선택 컨트롤. `<option>` 값이 곧 prop 값이라 캐스팅이 안전하다. */
export function EnumControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly T[];
  readonly onChange: (next: T) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="w-24 shrink-0">
        {label}
      </Label>
      <NativeSelect
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-w-0 flex-1"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </NativeSelect>
    </div>
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
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="w-24 shrink-0">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} label={label} />
    </div>
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
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="w-24 shrink-0">
        {label}
      </Label>
      <Input
        id={id}
        size="sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1"
      />
    </div>
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
 * 인터랙티브 플레이그라운드의 본체 — 좌측 컨트롤 · 우측 프리뷰 2컬럼.
 * `code` 는 현재 컨트롤 값으로 만든 JSX 문자열이다 — 눈으로 본 상태를 그대로 복붙한다.
 * 카드(Panel)를 두르지 않는 이유: 문서 페이지의 ComponentPreview 카드 **안**에서
 * 쓰이므로 여기서 또 두르면 이중 카드가 된다.
 */
export function PlaygroundGrid({
  controls,
  code,
  children,
}: {
  readonly controls: ReactNode;
  readonly code?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-2.5 border-dl-divider md:border-r md:pr-4">{controls}</div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 rounded-dl-control bg-dl-canvas p-4">
          {children}
        </div>
        {code ? (
          <pre className="overflow-x-auto rounded-dl-control bg-dl-canvas px-3 py-2 font-dl-mono text-dl-xs text-dl-fg-muted">
            {code}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
