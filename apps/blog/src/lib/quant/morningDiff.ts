/**
 * 아침 재판정(MORNING) `diffJson` → 표 행. 백엔드 `MorningAdviseJob.diffJson` 은 `Map<String,Object>` JSONB 라 스키마가 느슨하다 —
 * 배열이 빠지거나 원소가 객체가 아니어도 화면이 깨지지 않게 여기서 한 번 걸러 낸다.
 *
 * DROP 은 MORNING 픽 테이블에 없고 `diffJson.drop` 이 유일한 기록이다 — 그래서 픽 표가 아니라 이 행을 정본으로 쓴다.
 */
import type {
  MorningDiff,
  MorningDiffAction,
  MorningTriggers,
  PickAction,
  PickDirection,
} from '../../types/quant';

export type MorningDiffRow = {
  action: PickAction;
  ticker: string;
  reason: string | null;
  /** DROP 행에만 — 저녁 픽의 방향·확신. */
  direction: PickDirection | null;
  conviction: number | null;
};

/** 원소 하나를 행으로 — ticker 가 없으면 버린다(표의 키다). */
function toRow(action: PickAction, raw: unknown): MorningDiffRow | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Partial<MorningDiffAction>;
  if (typeof item.ticker !== 'string' || item.ticker === '') return null;
  return {
    action,
    ticker: item.ticker,
    reason: typeof item.reason === 'string' && item.reason !== '' ? item.reason : null,
    direction: item.direction === 'LONG' || item.direction === 'AVOID' ? item.direction : null,
    conviction: typeof item.conviction === 'number' ? item.conviction : null,
  };
}

/** 조치별 원소 배열 → 행들. 배열이 아니면 빈 목록. */
function rowsOf(action: PickAction, list: unknown): MorningDiffRow[] {
  if (!Array.isArray(list)) return [];
  return list.map((raw) => toRow(action, raw)).filter((row): row is MorningDiffRow => row !== null);
}

/** 표 순서는 제외 → 추가 → 유지 — 운영자가 먼저 봐야 하는 것은 "왜 뺐나" 다. */
export function morningDiffRows(diff: MorningDiff | null | undefined): MorningDiffRow[] {
  if (!diff) return [];
  return [...rowsOf('DROP', diff.drop), ...rowsOf('ADD', diff.add), ...rowsOf('KEEP', diff.keep)];
}

/** 조치별 건수 — 서브탭 배지·요약 줄. */
export function morningDiffCounts(rows: readonly MorningDiffRow[]): Record<PickAction, number> {
  const counts: Record<PickAction, number> = { KEEP: 0, ADD: 0, DROP: 0 };
  for (const row of rows) counts[row.action] += 1;
  return counts;
}

/** 켜진 트리거 목록 — 라벨 조립은 화면이 한다. 트리거가 없거나 모양이 다르면 빈 목록. */
export type ActiveTrigger =
  | { kind: 'gap'; codes: string[] }
  | { kind: 'sector'; codes: string[] }
  | { kind: 'caution' };

export function activeTriggers(triggers: MorningTriggers | null | undefined): ActiveTrigger[] {
  if (!triggers || typeof triggers !== 'object') return [];
  const strings = (value: unknown) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  const result: ActiveTrigger[] = [];
  if (triggers.gap === true) result.push({ kind: 'gap', codes: strings(triggers.gapIndexes) });
  if (triggers.sector === true) {
    result.push({ kind: 'sector', codes: strings(triggers.sectorSymbols) });
  }
  if (triggers.caution === true) result.push({ kind: 'caution' });
  return result;
}
