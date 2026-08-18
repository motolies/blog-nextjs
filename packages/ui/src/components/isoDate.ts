/**
 * ISO 날짜 문자열 ↔ 로컬 Date 변환 — **순수 모듈**이다.
 *
 * 원래 `calendar.tsx` 안에 있었는데, 날짜 프리셋 산식(`datePresets.ts`)이 React
 * 무의존으로 이 변환을 써야 해서 분리했다 — vitest 환경이 node(DOM 없음)라
 * **순수 모듈만** 단위 테스트가 가능하다(`rangeOrder.ts` 와 같은 이유).
 * 기존 소비처를 위해 `calendar.tsx` 가 재export 한다.
 *
 * 값의 계약이 `YYYY-MM-DD` **문자열**인 이유와 날짜 라이브러리를 쓰지 않는
 * 근거는 `calendar.tsx` 헤더 주석이 정본이다.
 */

/** 유효한 ISO 날짜면 로컬 Date 로, 아니면 null. 2026-02-30 같은 역직렬화 오버플로도 거른다. */
export function parseIsoDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** 로컬 y/m/d → `YYYY-MM-DD`. `toISOString()` 은 UTC 라 자정 부근에서 하루 밀린다 — 쓰지 않는다. */
export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
