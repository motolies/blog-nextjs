'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * URL 쿼리 파라미터를 상태처럼 읽고 쓴다 — `?tab=`·`?run=`·`?advice=` 배선용.
 *
 * "검색·페이징·열린 모달까지 URL 이 단일 진실 소스"(dialog.tsx 규칙)를 지키는 최소 훅이다.
 * `@hvy/ui` Tabs/Dialog 는 URL 을 모르므로(next/* import 금지) 앱이 여기서 배선한다.
 *
 * - `replace` 를 쓴다 — 탭 전환·모달 열기마다 히스토리가 쌓이면 뒤로가기가 탭을 되감는다.
 * - `scroll: false` — 쿼리만 바뀌는데 페이지 상단으로 튀면 안 된다.
 * - 다른 파라미터는 보존한다 — `?tab=runs&run=1201` 에서 run 만 지워도 tab 은 남는다.
 *
 * ⚠️ `useSearchParams` 는 Suspense 경계를 요구한다 — 페이지가 `<Suspense>` 로 감싼다(system-log 선례).
 */

/** 여러 키를 한 번에 — `null` 은 삭제. 렌더 시점의 문자열에 patch 를 얹으므로 키별 setter 를 연달아 부르는 것과 달리 덮어쓰기가 없다. */
export type SearchParamPatch = Record<string, string | null>;

/** 렌더 시점 쿼리 문자열에 patch 를 적용한 새 href — 순수 계산. */
function applyPatch(searchString: string, pathname: string, patch: SearchParamPatch): string {
  const params = new URLSearchParams(searchString);
  for (const [key, next] of Object.entries(patch)) {
    if (next === null || next === '') params.delete(key);
    else params.set(key, next);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * 여러 파라미터를 한 번에 바꾼다 — 탭 전환 시 `?run=`·`?advice=` 를 함께 지우는 용도.
 * 키별 `useSearchParamState` setter 를 두 번 부르면 둘째가 첫째의 결과를 모르는 렌더 시점 문자열에 쓰므로 하나가 사라진다.
 */
export function useSearchParamsPatch(): (patch: SearchParamPatch) => void {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  // URLSearchParams 객체는 매 렌더 새 참조라 의존성으로 못 쓴다 — 문자열로 고정한다(system-log 선례).
  const searchString = searchParams.toString();

  return useCallback(
    (patch: SearchParamPatch) => {
      router.replace(applyPatch(searchString, pathname, patch), { scroll: false });
    },
    [pathname, router, searchString],
  );
}

/** 파라미터 하나 — 값과 setter. 여러 키를 동시에 바꿔야 하면 `useSearchParamsPatch` 를 쓴다. */
export function useSearchParamState(key: string): [string | null, (next: string | null) => void] {
  const searchParams = useSearchParams();
  const value = searchParams.get(key);
  const patch = useSearchParamsPatch();

  const setValue = useCallback((next: string | null) => patch({ [key]: next }), [key, patch]);

  return [value, setValue];
}
