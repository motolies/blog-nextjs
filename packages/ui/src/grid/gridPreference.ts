import type { GridPreference } from './columns';
import type { ColumnWidths } from './useColumnLayout';

/**
 * 그리드 표시 설정의 저장 규칙 — `useGridPreference` 에서 **순수 부분만** 떼어 낸 모듈.
 *
 * 훅은 localStorage·디바운스·키 전환을 다루고 여기는 "문자열 ↔ 설정" 변환과 "이전 값에서
 * 다음 값을 만드는" 규칙만 둔다. vitest 환경이 node(DOM 없음)라 훅은 테스트할 수 없고,
 * 저장 규칙의 분기(레거시 JSON·불량 값·version 불일치)는 **여기 있어야 못 박을 수 있다.**
 */

export const PREFERENCE_VERSION = 1;

/** 저장된 것이 없을 때의 출발점 — 부분 갱신(`withPageSize` 등)이 스프레드할 바탕이다. */
export function emptyPreference(): GridPreference {
  return { version: PREFERENCE_VERSION, widths: {}, hidden: [], order: [] };
}

/**
 * 저장된 문자열을 검증해 설정으로 만든다. **조금이라도 어긋나면 폐기하고 null.**
 *
 * 저장소는 사용자가 손댈 수 있는 곳이고 `version` 이 다르면 컬럼 스키마가 이미 바뀐 뒤다 —
 * 그 상태로 순서·숨김을 적용하면 "없는 컬럼만 남은 표"가 된다.
 * 다만 `pageSize` 는 항목 단위로만 떨어뜨린다 — 그것 하나가 이상하다고 컬럼 설정까지 버리지 않는다.
 * 레거시 JSON(pageSize 키 없음)도 같은 경로로 통과한다 — `version` 을 올리지 않은 이유다.
 */
export function parsePreference(raw: string | null): GridPreference | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const candidate = parsed as Record<string, unknown>;
    if (candidate.version !== PREFERENCE_VERSION) return null;
    const pageSize = toPageSize(candidate.pageSize);
    return {
      version: PREFERENCE_VERSION,
      widths: toWidths(candidate.widths),
      hidden: toStringList(candidate.hidden),
      order: toStringList(candidate.order),
      // undefined 키를 남기지 않는다 — JSON 왕복 결과와 같은 형태를 유지한다(테스트 toEqual 도 깔끔).
      ...(pageSize === undefined ? null : { pageSize }),
    };
  } catch {
    return null;
  }
}

/**
 * 양의 정수만 — 0·음수·소수·문자열이 서버 조회 파라미터로 나가면 안 된다.
 * 허용 목록(10/20/50/100 등)은 앱이 안다 — `ui` 는 계약을 모르므로 목록 검사는 하지 않는다.
 */
export function toPageSize(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
}

/** `setPageSize` 의 순수 부분 — 폭·숨김·순서를 보존한다. */
export function withPageSize(previous: GridPreference | null, pageSize: number): GridPreference {
  return { ...(previous ?? emptyPreference()), pageSize };
}

/**
 * 컬럼 초기화의 순수 부분. **페이지 크기는 남긴다** — "표를 어떻게 보느냐"(컬럼)와
 * "몇 건씩 조회하느냐"(페이지 크기)는 다른 결정이라, 컬럼을 되돌렸는데 페이지 크기까지 튀면
 * 사용자는 누른 것과 다른 일이 일어났다고 느낀다. 남길 것이 없으면 null(저장 항목 삭제).
 */
export function resetColumnPreference(previous: GridPreference | null): GridPreference | null {
  const pageSize = previous?.pageSize;
  return pageSize === undefined ? null : { ...emptyPreference(), pageSize };
}

/** 폭은 양수만 받는다 — 0 이나 음수가 섞이면 컬럼이 사라진 표가 된다. */
export function toWidths(value: unknown): ColumnWidths {
  if (typeof value !== 'object' || value === null) return {};
  const result: Record<string, number> = {};
  for (const [id, width] of Object.entries(value)) {
    if (typeof width === 'number' && Number.isFinite(width) && width > 0) result[id] = width;
  }
  return result;
}

/** 문자열 아닌 원소는 흘린다 — 컬럼 id 는 문자열뿐이다. */
export function toStringList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}
