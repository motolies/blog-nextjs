import type { FieldMode } from './form-mode';

/**
 * 폼 컨트롤 상태 계약의 **순수 코어** — 전 컨트롤이 이 한 곳의 해석을 공유한다.
 *
 * | 축 | 타입 | 의미 | FormData | 시각 |
 * |---|---|---|---|---|
 * | `mode` | edit·view·disabled | 폼 상태. 컨트롤 prop > `Field` > `FormMode` > edit | edit O · view X(DOM 없음) · disabled X | disabled → `dl-field-locked` |
 * | `lock` | boolean | 시스템 채움 영구 불변 — **모든 mode 를 이긴다**(edit 에서도 편집 불가) | **O**(readOnly) | `dl-field-locked` + 자물쇠 + 안내문 재표시 |
 * | `masking` | boolean | 서버가 이미 마스킹한 개인정보 값 선언 | **X**(`name` 미전달 — 마스킹값 저장사고 방어) | `dl-field-locked` + `dl-field-masked` |
 *
 * React 에 의존하지 않는다 — vitest 환경이 node(DOM 없음)라 순수 모듈만
 * 단위 테스트가 가능하다(`rangeOrder.ts` 와 같은 이유).
 */

/**
 * mode 해석의 단일 구현 — `Field`(컨텍스트 확정)와 `useFieldControl`(컨트롤 소비)이
 * 같은 함수를 쓴다. 우선순위: 명시 prop > Field 컨텍스트 > FormMode > 'edit'.
 * 폼이 view/disabled 여도 명시 prop 이 이기므로 특정 칸만 편집으로 남길 수 있다.
 */
export function resolveMode(
  explicit: FieldMode | undefined,
  contextMode: FieldMode | undefined,
  formMode: FieldMode | null,
): FieldMode {
  return explicit ?? contextMode ?? formMode ?? 'edit';
}

export type ControlStateInput = {
  readonly mode: FieldMode;
  readonly lock?: boolean;
  readonly masking?: boolean;
};

/**
 * 컨트롤 루트가 방출하는 표준 DOM 속성 — CSS·테스트·앱(저장 페이로드 strip 판별)이
 * 상태를 한 가지 방식으로 조회하는 통로다. `data-invalid` 는 만들지 않는다(`aria-invalid` 중복).
 */
export type ControlDataProps = {
  readonly 'data-mode': FieldMode;
  readonly 'data-locked'?: '';
  readonly 'data-masked'?: '';
};

export type ControlState = {
  /** mode === 'view' — 입력 DOM 을 없애고 값 텍스트만 그린다. */
  readonly view: boolean;
  /** lock ∥ masking — 값은 보이되 편집 불가. lock 은 값을 전송하고 masking 은 하지 않는다. */
  readonly readOnly: boolean;
  /** mode === 'disabled' — 네이티브 disabled(FormData 제외). */
  readonly disabled: boolean;
  /** 이 컨트롤의 값이 폼 전송에 실려도 되는가 — `edit && !masking`. hidden input 류의 가드다. */
  readonly submits: boolean;
  /** 잠금 배색 클래스 묶음. 없으면 undefined — `cn()` 에 그대로 넣는다. */
  readonly lockClass: string | undefined;
  readonly dataProps: ControlDataProps;
};

/**
 * 상태 합성의 단일 구현.
 *
 * - lock 과 masking 이 겹치면 배색·전송은 **masking 이 이긴다**(미전송이 더 위험한 축의 방어라서).
 *   자물쇠 아이콘은 컴포넌트가 lock 만 보고 그리므로 아이콘은 남는다.
 * - `dl-field-locked-hint` 는 lock 전용이다 — 잠긴 칸은 placeholder 를 감추지만
 *   lock 칸의 안내문("자동 / 저장 시 발급")만은 다시 보여야 한다.
 */
export function resolveControlState(input: ControlStateInput): ControlState {
  const lock = input.lock === true;
  const masking = input.masking === true;
  const view = input.mode === 'view';
  const disabled = input.mode === 'disabled';

  const lockClass = masking
    ? 'dl-field-locked dl-field-masked'
    : lock
      ? 'dl-field-locked dl-field-locked-hint'
      : disabled
        ? 'dl-field-locked'
        : undefined;

  const dataProps: ControlDataProps = {
    'data-mode': input.mode,
    ...(lock ? { 'data-locked': '' as const } : null),
    ...(masking ? { 'data-masked': '' as const } : null),
  };

  return {
    view,
    readOnly: lock || masking,
    disabled,
    submits: input.mode === 'edit' && !masking,
    lockClass,
    dataProps,
  };
}
