/**
 * NumberInput 의 표시·확정 규칙 — React 무의존 순수 모듈(node 환경 단위 테스트 대상).
 *
 * 확정 규칙은 그리드 셀 에디터(`grid/CellEditor.tsx` `commitTextValue`)와 같다:
 * 빈 값 → null, 숫자가 아니면 **커밋하지 않는다**(이전 값 유지), min/max 는 클램프.
 * 표시는 천단위 구분(`1,234,567.89`) — 로케일 API 를 쓰지 않는 이유는 실행 환경에 따라
 * 구분자가 갈리기 때문이다(값 계약은 항상 `,` 구분 · `.` 소수점).
 */

/** 표시용 천단위 구분 문자열. null 은 빈칸. `decimalPlaces` 가 있으면 자릿수를 고정한다. */
export function formatThousands(value: number | null, decimalPlaces?: number): string {
  if (value === null || Number.isNaN(value)) return '';
  const fixed = decimalPlaces === undefined ? String(value) : value.toFixed(decimalPlaces);
  const [integer, fraction] = fixed.split('.');
  const sign = integer?.startsWith('-') ? '-' : '';
  const digits = sign ? integer?.slice(1) : integer;
  const grouped = (digits ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction === undefined ? `${sign}${grouped}` : `${sign}${grouped}.${fraction}`;
}

export type ParseNumberOptions = {
  readonly min?: number;
  readonly max?: number;
  readonly decimalPlaces?: number;
};

export type ParseNumberResult =
  | { readonly ok: true; readonly value: number | null }
  | { readonly ok: false };

/**
 * 타이핑 텍스트 → 확정값. 구분자(`,`·공백)는 허용해서 걷어낸다.
 * 실패(`ok: false`)면 호출부가 이전 값으로 되돌린다 — 반쯤 친 문자열을 값으로 남기지 않는다.
 */
export function parseNumberText(text: string, options: ParseNumberOptions = {}): ParseNumberResult {
  const cleaned = text.replace(/[,\s]/g, '');
  if (cleaned === '') return { ok: true, value: null };
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) return { ok: false };
  return { ok: true, value: clampNumber(parsed, options) };
}

/** min/max 클램프 + 소수 자릿수 반올림 — 스텝 증감(화살표 키)도 같은 규칙을 지난다. */
export function clampNumber(value: number, options: ParseNumberOptions = {}): number {
  const min = options.min ?? Number.NEGATIVE_INFINITY;
  const max = options.max ?? Number.POSITIVE_INFINITY;
  const clamped = Math.min(max, Math.max(min, value));
  if (options.decimalPlaces === undefined) return clamped;
  return Number(clamped.toFixed(options.decimalPlaces));
}
