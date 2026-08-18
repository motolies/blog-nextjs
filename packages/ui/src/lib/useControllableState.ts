'use client';

import { useCallback, useState } from 'react';

/**
 * controlled / uncontrolled 를 둘 다 지원한다.
 *
 * **왜 필요한가**: 커스텀 `Select` 는 `<button>` 기반이라 폼 값이 없어 본질적으로 controlled 다.
 * 그런데 이 프로젝트의 검색 폼은 `new FormData(event.currentTarget)` 로 읽는
 * uncontrolled 패턴이고, 그게 규칙이다 — 검색 조건의 단일 진실 소스는 URL 이라
 * 폼이 자기 상태를 갖기 시작하면 진실이 둘이 된다(CLAUDE.md §2).
 *
 * `value` 를 주면 controlled, `defaultValue` 만 주면 내부 상태로 동작한다.
 * 어느 쪽이든 `onChange` 는 호출된다.
 */
export function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): readonly [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = useState<T>(defaultValue);
  const isControlled = controlled !== undefined;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [isControlled ? controlled : uncontrolled, setValue] as const;
}
