'use client';

import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from 'react';

/**
 * 폼 오류의 **배선** 계층 — v3 §ds-05 의 네 가지 동작을 한 훅에 담는다.
 *
 *   1. 저장 시 전체 검사 → **모든** 오류 칸에 동시 표시 (모달로 막지 않는다)
 *   2. 포커스는 **첫 오류 칸**으로
 *   3. 값이 채워지면 **그 칸의 오류만** 즉시 사라진다 (다른 칸은 남겨 무엇이 남았는지 보이게)
 *   4. 다른 건을 열면 앞 건의 오류 표시는 지운다 (`clearAll`)
 *
 * **규칙(무엇이 유효한가)은 여기 없다.** 그건 `packages/contracts` 의 zod 스키마가 갖고,
 * 그 스키마는 서버 검증·URL 파싱과 **같은 것**이다. 복제하면 갈라지고, 갈라지면
 * 클라이언트만 통과하는 값이 서버에서 터진다.
 *
 * 이 훅은 규칙도 사전도 모른다 — 결과(문구)를 받아 나르고, 지우고, 포커스만 잡는다.
 */
export type FieldErrorMap<K extends string> = Readonly<Partial<Record<K, ReactNode>>>;

export function useFieldErrors<K extends string>(): {
  readonly errors: FieldErrorMap<K>;
  /**
   * 검사 결과를 한 번에 심는다. 오류가 있으면 첫 오류 칸으로 포커스한다.
   *
   * @param scope 포커스를 찾을 범위. 보통 `<form>` ref 다. 없으면 document 전체에서 찾는다.
   * @returns 오류가 **없으면** true — `if (!errors.setAll(...)) return;` 로 쓴다.
   */
  readonly setAll: (next: FieldErrorMap<K>, scope?: RefObject<HTMLElement | null>) => boolean;
  readonly clearAll: () => void;
  /**
   * `<Field {...bind('memo')} htmlFor="memo" label={…}>` 로 쓴다.
   * 값이 바뀌면 그 칸의 오류만 지운다.
   */
  readonly bind: (name: K) => { readonly error: ReactNode; readonly onDirty: () => void };
} {
  /**
   * 내부는 느슨한 맵으로 둔다 — 제네릭 `Partial<Record<K, …>>` 는 빈 객체 리터럴조차
   * 받지 못한다(TS7). 외부로 나가는 `errors` 에서만 좁혀 준다.
   */
  const [errors, setErrors] = useState<Record<string, ReactNode>>({});

  /**
   * 포커스 요청. **숫자 카운터인 이유**: `setAll` 안에서 곧바로 DOM 을 찾으면
   * 아직 리렌더 전이라 `[aria-invalid="true"]` 가 **하나도 없다**. 상태를 심고
   * effect(= 다음 렌더 이후)에서 찾아야 한다. boolean 이면 연속 제출에서
   * 값이 안 바뀌어 effect 가 다시 돌지 않는다.
   */
  const [focusTick, setFocusTick] = useState(0);
  const focusScope = useRef<RefObject<HTMLElement | null> | null>(null);

  useEffect(() => {
    if (focusTick === 0) return;
    const root = focusScope.current?.current ?? document;
    /**
     * DOM 순서가 곧 시각 순서라 "첫 오류 칸"의 정의가 정확해진다 —
     * ref 배열을 관리하면 순서가 선언 순서가 되고, 그건 화면 순서와 다를 수 있다.
     */
    root.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusTick]);

  const setAll = useCallback((next: FieldErrorMap<K>, scope?: RefObject<HTMLElement | null>) => {
    setErrors(next as Record<string, ReactNode>);

    const hasError = Object.values(next).some((message) => message !== undefined);
    if (hasError) {
      focusScope.current = scope ?? null;
      setFocusTick((tick) => tick + 1);
    }
    return !hasError;
  }, []);

  const clearAll = useCallback(() => setErrors({}), []);

  const bind = useCallback(
    (name: K) => ({
      error: errors[name],
      onDirty: () => {
        setErrors((prev) => {
          if (prev[name] === undefined) return prev; // 이미 없으면 리렌더를 만들지 않는다
          const next = { ...prev };
          delete next[name];
          return next;
        });
      },
    }),
    [errors],
  );

  return { errors: errors as FieldErrorMap<K>, setAll, clearAll, bind };
}
