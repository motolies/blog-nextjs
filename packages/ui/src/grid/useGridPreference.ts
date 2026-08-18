'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { warnOnce } from '../lib/warnOnce';
import type { GridPreference } from './columns';
import type { ColumnWidths } from './useColumnLayout';

/**
 * 그리드 표시 설정(폭·숨김·순서)의 브라우저 영속.
 *
 * `ui` 는 사전도 라우터도 모르지만 `localStorage` 는 웹 표준이라 여기 둔다.
 * **다만 키는 앱이 만든다** — 어떤 사용자·어떤 메뉴인지는 이 패키지가 알 수 없다.
 */

const PREFERENCE_VERSION = 1;
const KEY_PREFIX = 'nx:grid';

/**
 * 저장소 쓰기를 미루는 시간(ms).
 *
 * 컬럼 폭 드래그는 프레임마다 값을 바꾼다. `localStorage.setItem` 은 **동기 I/O** 라
 * 그때마다 쓰면 드래그가 눈에 띄게 무거워진다. 화면에 보이는 값은 즉시 바꾸고,
 * 저장은 손이 멈춘 뒤 한 번만 한다.
 */
const WRITE_DELAY_MS = 300;

/** 참조가 매번 바뀌면 `columnWidths` 를 받는 쪽이 계속 다시 계산한다 — 빈 값은 상수로 둔다. */
const EMPTY_WIDTHS: ColumnWidths = {};

/**
 * 저장 키의 세 축. **셋 다 필수다.**
 *
 * 특히 `gridId` 를 빼면 한 화면에 그리드가 둘 있을 때 서로의 설정을 덮어쓴다 —
 * A 에서 컬럼을 숨겼는데 B 가 무너지는, 에러 없이 조용히 어긋나는 사고다.
 * 문자열 키 하나로 받으면 언젠가 누가 빼먹으므로 **누락이 컴파일 에러**가 되게 인자를 나눈다
 * (CLAUDE.md §2 "사람이 지키는 규칙은 반드시 언젠가 깨진다").
 *
 * 현행 `gridWrapper.js` 의 `deleo_grid_{userId}{menuId}{targetLayer}` 와 같은 3축 구성이되,
 * 그리드 축이 DOM id 가 아니다 — 그쪽은 화면 전환 시 id 가 재사용돼 충돌한 전례가 있다
 * (`gridWrapper.js:325-328`).
 */
export type GridPreferenceScope = {
  /** 사용자 축. 공용 PC 에서 앞사람 설정이 보이면 안 된다. */
  readonly userKey: string;
  /** 메뉴 축. 서버 상수(`MENU.*`)이지 클라이언트가 지어낸 값이 아니다. */
  readonly menuUrl: string;
  /** 그리드 축. 한 화면 안에서 그리드를 구분하는 이름(`'orderList'` 등). */
  readonly gridId: string;
};

export function gridStorageKey({ userKey, menuUrl, gridId }: GridPreferenceScope): string {
  return `${KEY_PREFIX}:${userKey}:${menuUrl}:${gridId}`;
}

/** 지금 마운트되어 있는 저장 키. 같은 키가 둘이면 서로를 덮어쓴다. */
const mountedKeys = new Set<string>();

export function useGridPreference(scope: GridPreferenceScope): {
  /** 저장된 설정. **아직 로드 전이거나 저장된 것이 없으면 `null`** — 컬럼 정의 기본값을 쓴다는 뜻이다. */
  readonly preference: GridPreference | null;
  /**
   * `DataGrid` 의 `columnWidths` 에 그대로 넘긴다. **항상 객체다** —
   * `undefined` 가 되면 그리드가 uncontrolled 로 전환되어 폭의 진실이 두 곳으로 갈린다.
   */
  readonly widths: ColumnWidths;
  readonly setWidths: (widths: ColumnWidths) => void;
  readonly setPreference: (next: Pick<GridPreference, 'hidden' | 'order'>) => void;
  readonly reset: () => void;
} {
  const key = gridStorageKey(scope);
  const [preference, setStored] = useState<GridPreference | null>(null);

  /**
   * SSR 에는 `localStorage` 가 없으므로 첫 렌더는 항상 `null` 이고 로드는 effect 에서 한다.
   * 초기 state 에서 읽으면 서버·클라이언트 렌더 결과가 달라져 하이드레이션이 깨진다.
   */
  useEffect(() => {
    setStored(readPreference(key));
  }, [key]);

  // 같은 키를 두 그리드가 쓰고 있는지 감시한다. cleanup 이 있어 StrictMode 이중 마운트에 견딘다.
  useEffect(() => {
    if (mountedKeys.has(key)) {
      warnOnce(
        `grid-preference-duplicate:${key}`,
        `그리드 설정 저장 키 "${key}" 를 두 그리드가 동시에 쓰고 있습니다. 한 화면의 그리드에는 서로 다른 gridId 를 주세요 — 지금은 설정이 서로를 덮어씁니다.`,
      );
      return;
    }
    mountedKeys.add(key);
    return () => {
      mountedKeys.delete(key);
    };
  }, [key]);

  /** 아직 저장소에 못 쓴 값. 언마운트·키 변경 시 흘리지 않고 즉시 밀어 넣는다. */
  const pending = useRef<{ key: string; value: GridPreference } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const waiting = pending.current;
    if (!waiting) return;
    pending.current = null;
    try {
      localStorage.setItem(waiting.key, JSON.stringify(waiting.value));
    } catch {
      // 프라이빗 모드·용량 초과. 이번 세션에서만 유지되고 끝난다 — 화면이 죽는 것보다 낫다.
    }
  }, []);

  // 드래그 도중 화면을 떠나면 마지막 폭이 유실된다 — 언마운트 때 남은 값을 확정한다.
  useEffect(() => flush, [flush]);

  const write = useCallback(
    (next: GridPreference) => {
      setStored(next);
      pending.current = { key, value: next };
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(flush, WRITE_DELAY_MS);
    },
    [key, flush],
  );

  const setWidths = useCallback(
    (widths: ColumnWidths) => write({ ...(preference ?? emptyPreference()), widths }),
    [preference, write],
  );

  const setPreference = useCallback(
    (next: Pick<GridPreference, 'hidden' | 'order'>) =>
      write({ ...(preference ?? emptyPreference()), hidden: next.hidden, order: next.order }),
    [preference, write],
  );

  const reset = useCallback(() => {
    // 미뤄 둔 쓰기를 버린다 — 안 버리면 지운 직후 옛 값이 되살아난다.
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;

    setStored(null);
    try {
      localStorage.removeItem(key);
    } catch {
      // 위와 같다.
    }
  }, [key]);

  return useMemo(
    () => ({
      preference,
      widths: preference?.widths ?? EMPTY_WIDTHS,
      setWidths,
      setPreference,
      reset,
    }),
    [preference, setWidths, setPreference, reset],
  );
}

function emptyPreference(): GridPreference {
  return { version: PREFERENCE_VERSION, widths: {}, hidden: [], order: [] };
}

/**
 * 저장된 값을 읽어 검증한다. **조금이라도 어긋나면 폐기하고 기본값으로 간다.**
 *
 * 저장소는 사용자가 손댈 수 있는 곳이고, `version` 이 다르면 컬럼 스키마가 이미 바뀐 뒤다 —
 * 그 상태로 순서·숨김을 적용하면 "없는 컬럼만 남은 표"가 된다.
 */
function readPreference(key: string): GridPreference | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const candidate = parsed as Record<string, unknown>;
    if (candidate.version !== PREFERENCE_VERSION) return null;

    return {
      version: PREFERENCE_VERSION,
      widths: toWidths(candidate.widths),
      hidden: toStringList(candidate.hidden),
      order: toStringList(candidate.order),
    };
  } catch {
    return null;
  }
}

/** 폭은 양수만 받는다 — 0 이나 음수가 섞이면 컬럼이 사라진 표가 된다. */
function toWidths(value: unknown): ColumnWidths {
  if (typeof value !== 'object' || value === null) return {};
  const result: Record<string, number> = {};
  for (const [id, width] of Object.entries(value)) {
    if (typeof width === 'number' && Number.isFinite(width) && width > 0) result[id] = width;
  }
  return result;
}

function toStringList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}
