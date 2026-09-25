import {
  Badge,
  EmptyState,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@hvy/ui';
import Link from 'next/link';
import { DashboardTable } from '@/components/dashboard/DashboardTable';
import { activeTriggers, morningDiffCounts, morningDiffRows } from '@/lib/quant/morningDiff';
import { adviceHref } from '@/lib/quant/routes';
import type { CandidateRow, MorningDiff } from '@/types/quant';
import {
  PICK_ACTION_LABEL,
  pickActionLabel,
  pickActionTone,
  pickDirectionLabel,
} from './advisorLabels';
import { formatRate } from './kpiFormat';

/** 예상 갭 트리거의 지수 코드 → 이름. 모르는 코드는 원문. */
const INDEX_NAME: Record<string, string> = { '0001': 'KOSPI', '1001': 'KOSDAQ' };

/**
 * 아침 재판정(MORNING) "저녁 대비" 서브탭 — `diffJson` 의 유지·추가·제외 표와 사유, 밤사이 트리거.
 *
 * 트리거는 LLM 호출 여부를 가르지 않고 기록만 한다(`MorningAdviseJob`) — "트리거일" 은 KPI 의 대응 비교를 가르는 기준이라
 * 표 위에 먼저 보인다. 종목명은 이 판단의 후보군에서 찾되, 저녁에만 있던 DROP 종목은 이름이 없을 수 있다(코드만 표시).
 */
export function AdviceMorningDiffPanel({
  diff,
  candidates,
}: {
  diff: MorningDiff | null | undefined;
  candidates: readonly CandidateRow[];
}) {
  const rows = morningDiffRows(diff);

  if (!diff) {
    return (
      <EmptyState
        message="저녁 대비 기록이 없습니다"
        hint="아침 재판정(M4) 이전 판단이거나 저장이 실패했습니다"
      />
    );
  }

  const nameOf = new Map(candidates.map((c) => [c.ticker, c.stockName ?? '']));
  const counts = morningDiffCounts(rows);
  const triggers = activeTriggers(diff.triggers);
  const triggered = diff.triggers?.any === true;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5 text-dl-sm">
        <Badge tone={triggered ? 'warning' : 'neutral'} size="sm">
          {triggered ? '트리거일' : '비트리거일'}
        </Badge>
        {triggers.map((trigger) => (
          <Badge key={trigger.kind} tone="warning" size="xs">
            {trigger.kind === 'gap'
              ? `예상 갭 ≥ σ${trigger.codes.length > 0 ? ` (${trigger.codes.map((c) => INDEX_NAME[c] ?? c).join('·')})` : ''}`
              : trigger.kind === 'sector'
                ? `섹터 연동 |z| ≥ 2${trigger.codes.length > 0 ? ` (${trigger.codes.join('·')})` : ''}`
                : '07:30 점검 주의'}
          </Badge>
        ))}
        <span className="text-dl-xs text-dl-fg-muted">
          미국 세션 {diff.usDate ?? '—'}
          {diff.usClosed ? ' (휴장)' : ''}
          {diff.parentAdviceId !== null && diff.parentAdviceId !== undefined ? (
            <>
              {' · 원 저녁 판단 '}
              <Link
                href={adviceHref(diff.parentAdviceId)}
                className="text-dl-primary-ink hover:underline"
              >
                #{diff.parentAdviceId}
              </Link>
            </>
          ) : null}
        </span>
      </div>

      <p className="m-0 text-dl-xs text-dl-fg-muted">
        {(['KEEP', 'ADD', 'DROP'] as const)
          .map((action) => `${PICK_ACTION_LABEL[action]} ${counts[action]}`)
          .join(' · ')}
      </p>

      {rows.length === 0 ? (
        <EmptyState message="조치가 없습니다" hint="저녁 픽이 없었거나 가드가 전부 걸러냈습니다" />
      ) : (
        <DashboardTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>조치</TableHeaderCell>
              <TableHeaderCell>종목</TableHeaderCell>
              <TableHeaderCell className="whitespace-normal">사유</TableHeaderCell>
              <TableHeaderCell>저녁 방향</TableHeaderCell>
              <TableHeaderCell className="text-right">저녁 확신</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.action}-${row.ticker}`}>
                <TableCell>
                  <Badge tone={pickActionTone(row.action)} size="xs">
                    {pickActionLabel(row.action)}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="font-dl-mono">{row.ticker}</span>
                  {nameOf.get(row.ticker) ? (
                    <span className="ml-1 text-dl-fg-muted">{nameOf.get(row.ticker)}</span>
                  ) : null}
                </TableCell>
                <TableCell className="wrap-anywhere">{row.reason ?? '—'}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {row.direction ? pickDirectionLabel(row.direction) : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatRate(row.conviction, 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DashboardTable>
      )}
    </div>
  );
}
