import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  EmptyState,
  FieldValue,
  FormGrid,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@hvy/ui';
import Link from 'next/link';
import { DashboardTable } from '@/components/dashboard/DashboardTable';
import { runHref } from '@/lib/quant/routes';
import type { IntradayCheckRow, MorningCheckRow } from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import {
  intradayVerdictLabel,
  intradayVerdictTone,
  morningVerdictLabel,
  morningVerdictTone,
} from './advisorLabels';
import { JsonPre } from './JsonPre';
import { formatRate, formatSignedPct } from './kpiFormat';

/**
 * 판단 상세 "점검" 서브탭 — 장중 점검(12:00 INTRADAY, 여러 행)과 아침 점검(07:30 MORNING_CHECK, advice 당 1행).
 * 원문 JSON(indexJson·pickJson·detailJson)은 Accordion 으로 접는다 — 판정과 코멘트가 먼저다.
 */
export function AdviceChecksPanel({
  intradayChecks,
  morningCheck,
}: {
  intradayChecks: readonly IntradayCheckRow[];
  morningCheck: MorningCheckRow | null;
}) {
  if (intradayChecks.length === 0 && morningCheck === null) {
    return (
      <EmptyState
        message="점검 기록이 없습니다"
        hint="장중 점검은 다음 영업일 12:00, 아침 점검은 07:30 에 직전 LIVE 판단을 대상으로 실행됩니다"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-1">
        <h3 className="text-dl-sm font-semibold text-dl-fg">아침 해외 반영 점검</h3>
        {morningCheck === null ? (
          <p className="text-dl-xs text-dl-fg-muted">없음</p>
        ) : (
          <>
            <FormGrid>
              <FieldValue size="sm" label="판정">
                <Badge tone={morningVerdictTone(morningCheck.verdict)} size="sm">
                  {morningVerdictLabel(morningCheck.verdict)}
                </Badge>
              </FieldValue>
              <FieldValue size="sm" label="미국 기준일">
                {morningCheck.usDate ?? '—'}
              </FieldValue>
              <FieldValue size="sm" label="예상 갭 KOSPI / KOSDAQ">
                {formatSignedPct(morningCheck.gapKospi)} / {formatSignedPct(morningCheck.gapKosdaq)}
              </FieldValue>
              <FieldValue size="sm" label="발행">
                {morningCheck.publishedAt
                  ? formatUtcToLocal(morningCheck.publishedAt, 'MM-dd HH:mm')
                  : '미발행'}
              </FieldValue>
              <FieldValue size="sm" label="run">
                {morningCheck.runId !== null ? (
                  <Link
                    href={runHref('ADVISOR', morningCheck.runId)}
                    className="text-dl-primary-ink hover:underline"
                  >
                    #{morningCheck.runId}
                  </Link>
                ) : (
                  '—'
                )}
              </FieldValue>
            </FormGrid>
            {morningCheck.detailJson ? (
              <Accordion type="single" collapsible>
                <AccordionItem value="morning-detail">
                  <AccordionTrigger>상세 JSON</AccordionTrigger>
                  <AccordionContent>
                    <JsonPre value={morningCheck.detailJson} maxHeightClass="max-h-[30vh]" />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : null}
          </>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <h3 className="text-dl-sm font-semibold text-dl-fg">장중 점검 ({intradayChecks.length})</h3>
        {intradayChecks.length === 0 ? (
          <p className="text-dl-xs text-dl-fg-muted">없음</p>
        ) : (
          <>
            <DashboardTable>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>점검 시각</TableHeaderCell>
                  <TableHeaderCell>판정</TableHeaderCell>
                  <TableHeaderCell className="text-right">일치율</TableHeaderCell>
                  <TableHeaderCell className="whitespace-normal">코멘트</TableHeaderCell>
                  <TableHeaderCell>run</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {intradayChecks.map((check, index) => (
                  <TableRow key={check.checkId ?? `${check.checkedAt}-${index}`}>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatUtcToLocal(check.checkedAt, 'MM-dd HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge tone={intradayVerdictTone(check.verdict)} size="xs">
                        {intradayVerdictLabel(check.verdict)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatRate(check.agreementRatio, 0)}
                    </TableCell>
                    <TableCell>
                      <span
                        className="line-clamp-3 wrap-anywhere"
                        title={check.comment ?? undefined}
                      >
                        {check.comment ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {check.runId !== null ? (
                        <Link
                          href={runHref('ADVISOR', check.runId)}
                          className="text-dl-primary-ink hover:underline"
                        >
                          #{check.runId}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DashboardTable>
            <Accordion type="single" collapsible>
              <AccordionItem value="intraday-json">
                <AccordionTrigger>지수·픽 스냅샷 JSON</AccordionTrigger>
                <AccordionContent>
                  <JsonPre
                    value={intradayChecks.map((check) => ({
                      checkedAt: check.checkedAt,
                      index: check.indexJson,
                      picks: check.pickJson,
                    }))}
                    maxHeightClass="max-h-[40vh]"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </section>
    </div>
  );
}
