import { Badge, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@hvy/ui';
import { DashboardTable } from '@/components/dashboard/DashboardTable';
import { formatDurationMs } from '@/lib/quant/format';
import { stepStatusLabel, stepStatusTone } from '@/lib/quant/runStatus';
import { formatCompact } from '@/lib/statFormat';
import type { RunStep } from '@/types/quant';

/**
 * `metadata.steps[]` 정적 표 — 파이프라인 run 상세에서 단계별 상태·소요·처리·실패·사유를 보인다.
 *
 * 5~20행 참조 데이터라 `Table` 이다(표 3분법). `DashboardTable` 로 감싸 좁은 폭의 가로 넘침을 스크롤러로 받는다 —
 * 다이얼로그 본문도 `.contentWrapper` 안이라 넘친 폭은 스크롤 없이는 도달할 수 없다(admin-horizontal-overflow-trap).
 * BACKFILL_ALL 하위 run 모양(`rows`·`apiCalls`·`apiFails`)도 같은 열에 얹는다 — 있으면 그 값을 보인다.
 */
export function RunStepsTable({ steps }: { steps: readonly RunStep[] }) {
  return (
    <DashboardTable>
      <TableHead>
        <TableRow>
          <TableHeaderCell>단계</TableHeaderCell>
          <TableHeaderCell>상태</TableHeaderCell>
          <TableHeaderCell className="text-right">소요</TableHeaderCell>
          <TableHeaderCell className="text-right">처리</TableHeaderCell>
          <TableHeaderCell className="text-right">실패</TableHeaderCell>
          <TableHeaderCell className="whitespace-normal">사유</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {steps.map((step) => {
          const processed = step.processed ?? step.rows ?? null;
          const failures = step.failures ?? step.apiFails ?? null;
          return (
            <TableRow key={step.step}>
              <TableCell className="font-dl-mono whitespace-nowrap">
                {step.step}
                {step.runId ? <span className="ml-1 text-dl-fg-muted">#{step.runId}</span> : null}
              </TableCell>
              <TableCell>
                <Badge tone={stepStatusTone(step.status)} size="xs">
                  {stepStatusLabel(step.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatDurationMs(step.ms)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {processed === null ? '—' : formatCompact(processed)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {failures === null ? '—' : formatCompact(failures)}
              </TableCell>
              <TableCell>
                <span className="line-clamp-2 wrap-anywhere" title={step.reason ?? undefined}>
                  {step.reason ?? '—'}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </DashboardTable>
  );
}
