'use client';

import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import type { ControlSize } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { warnOnce } from '../lib/warnOnce';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';

/**
 * 스위치 — QA `custom-switch`: md 트랙 36×20 · knob 14 · ON 이면 Primary 채움.
 * (5단은 테마 스케일 유도 — 높이는 체크박스 공식, 폭은 높이 × 1.8.)
 *
 * `<button role="switch">` 다. `<input type="checkbox">` 로 만들면 켜짐/꺼짐을
 * "체크됨"으로 읽어 의미가 흐려지고, div 로 만들면 키보드가 죽는다.
 */

const TRACK_CLASS: Record<ControlSize, string> = {
  xs: 'h-dl-switch-h-xs w-dl-switch-w-xs',
  sm: 'h-dl-switch-h-sm w-dl-switch-w-sm',
  md: 'h-dl-switch-h-md w-dl-switch-w-md',
  lg: 'h-dl-switch-h-lg w-dl-switch-w-lg',
  xl: 'h-dl-switch-h-xl w-dl-switch-w-xl',
};

/** knob 지름 = 트랙 높이 - 6px(상하 3px 마진) — 트랙 토큰에서 유도해 어긋나지 않는다. */
const KNOB_CLASS: Record<ControlSize, string> = {
  xs: 'size-[calc(var(--spacing-dl-switch-h-xs)-6px)]',
  sm: 'size-[calc(var(--spacing-dl-switch-h-sm)-6px)]',
  md: 'size-[calc(var(--spacing-dl-switch-h-md)-6px)]',
  lg: 'size-[calc(var(--spacing-dl-switch-h-lg)-6px)]',
  xl: 'size-[calc(var(--spacing-dl-switch-h-xl)-6px)]',
};

/** ON 위치 = 트랙 폭 - (knob + 우측 3px 마진) = w - h + 3px. */
const KNOB_ON_CLASS: Record<ControlSize, string> = {
  xs: 'left-[calc(var(--spacing-dl-switch-w-xs)-var(--spacing-dl-switch-h-xs)+3px)]',
  sm: 'left-[calc(var(--spacing-dl-switch-w-sm)-var(--spacing-dl-switch-h-sm)+3px)]',
  md: 'left-[calc(var(--spacing-dl-switch-w-md)-var(--spacing-dl-switch-h-md)+3px)]',
  lg: 'left-[calc(var(--spacing-dl-switch-w-lg)-var(--spacing-dl-switch-h-lg)+3px)]',
  xl: 'left-[calc(var(--spacing-dl-switch-w-xl)-var(--spacing-dl-switch-h-xl)+3px)]',
};

export type SwitchProps = {
  /** 주면 controlled. 생략하면 `defaultChecked` 로 시작하는 내부 상태가 된다. */
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
  /** 스위치는 라벨이 옆에 있어도 자체 이름이 필요하다. */
  readonly label: string;
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  /** Field 밖에서 단독으로 쓸 때만. 배색은 QA 미규정이라 aria 만 단다. */
  readonly invalid?: boolean;
  /** 5단 사이즈 — 기본 md(36×20). 생략하면 감싼 `Field` 의 size 를 따른다. */
  readonly size?: ControlSize;
  readonly id?: string;
  /** view 모드 표시 문구. `ui` 는 사전을 모른다 — 주입받는다. 없으면 개발 경고 + 빈칸. */
  readonly viewLabels?: { readonly on: ReactNode; readonly off: ReactNode };
  readonly className?: string;
};

export function Switch({
  checked: checkedProp,
  defaultChecked,
  onCheckedChange,
  label,
  mode,
  invalid,
  size,
  id,
  viewLabels,
  className,
}: SwitchProps) {
  // invalid·size 도 넘긴다 — 안 넘기면 Field 의 오류·사이즈가 스위치에 도달하지 못한다.
  const field = useFieldControl({ id, invalid, size, mode });
  /**
   * 다른 선택형 컨트롤과 같은 관리형 규약 — 비제어(defaultChecked)에서도 view 모드가
   * 현재값을 알고, 기존 controlled(checked+onCheckedChange) 호출부는 그대로 동작한다.
   */
  const [checked, setChecked] = useControllableState(
    checkedProp,
    Boolean(defaultChecked),
    onCheckedChange,
  );

  if (field.state.view) {
    // `<button>` 이라 FormData 에 애초에 없다 — view 에서도 표시는 주입 문구가 전부다.
    if (!viewLabels) {
      warnOnce(
        `switch-view-no-labels:${id ?? field.id ?? 'unknown'}`,
        'view 모드의 Switch 에 viewLabels 가 없습니다. { on, off } 표시 문구를 주입해 주세요.',
      );
      return <FieldViewText size={field.size} />;
    }
    return (
      <FieldViewText size={field.size}>{checked ? viewLabels.on : viewLabels.off}</FieldViewText>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      id={field.id}
      aria-checked={checked}
      aria-label={label}
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      aria-required={field.required || undefined}
      disabled={field.state.disabled}
      onClick={() => setChecked(!checked)}
      {...field.state.dataProps}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-dl-pill transition-colors',
        TRACK_CLASS[field.size],
        checked ? 'bg-dl-primary' : 'bg-dl-outline-border',
        // disabled 는 흐림이 아니라 전용 배색이다 — off #e6e6e6 · on 하늘색(QA 실측)
        field.state.disabled && 'cursor-not-allowed',
        field.state.disabled && (checked ? 'bg-dl-check-disabled-on-bg' : 'bg-dl-locked-bg'),
        className,
      )}
    >
      {/* knob 은 상태와 무관하게 한 색이다(QA) — 체크 글리프·라디오 점과 같은 **도형**
          축이라 `-mark` 를 쓴다. 한때 `-fg`(글자색)로 묶었더니 on-brand 가 짙은 테마에서
          꺼진 knob 까지 진해져 위계가 뒤집혔는데, 그건 글자와 도형을 한 토큰에 묶은 탓이지
          상태별로 갈라야 할 문제가 아니었다. 도형 토큰이 분리된 지금은 한 색이 맞다. */}
      <span
        className={cn(
          'absolute top-[3px] rounded-full bg-dl-primary-mark transition-[left]',
          KNOB_CLASS[field.size],
          checked ? KNOB_ON_CLASS[field.size] : 'left-[3px]',
        )}
      />
    </button>
  );
}
