import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  EmptyState,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@hvy/ui';
import { DashboardTable } from '@/components/dashboard/DashboardTable';
import type { CandidateRow, PickRow } from '@/types/quant';
import {
  pickActionLabel,
  pickActionTone,
  pickDirectionLabel,
  pickDirectionTone,
} from './advisorLabels';
import { formatFixed, formatRate } from './kpiFormat';

/**
 * 판단 상세 "픽" 서브탭 — picks 정적 표 + 후보군(candidates)은 접힌 Accordion(30행이라 기본 접음).
 * 종목명은 후보군 행에만 있어 ticker 로 조인해 픽 표에 얹는다.
 * 아침 재판정 픽은 조치(유지·추가)와 사유가 있어 그때만 "조치" 열을 더한다 — 제외(DROP)는 픽이 아니라 "저녁 대비" 탭에 있다.
 */
export function AdvicePicksPanel({
  picks,
  candidates,
}: {
  picks: readonly PickRow[];
  candidates: readonly CandidateRow[];
}) {
  const nameOf = new Map(candidates.map((c) => [c.ticker, c.stockName ?? '']));
  const hasAction = picks.some((pick) => pick.action);

  return (
    <div className="flex flex-col gap-3">
      {picks.length === 0 ? (
        <EmptyState
          message="픽이 없습니다"
          hint="가드가 전부 걸러냈거나 판단이 생성되지 않았습니다"
        />
      ) : (
        <DashboardTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="text-right">순위</TableHeaderCell>
              <TableHeaderCell>종목</TableHeaderCell>
              <TableHeaderCell>방향</TableHeaderCell>
              {hasAction ? (
                <TableHeaderCell className="whitespace-normal">조치</TableHeaderCell>
              ) : null}
              <TableHeaderCell className="text-right">확신</TableHeaderCell>
              <TableHeaderCell className="whitespace-normal">논지</TableHeaderCell>
              <TableHeaderCell className="whitespace-normal">리스크</TableHeaderCell>
              <TableHeaderCell className="whitespace-normal">인용 지표</TableHeaderCell>
              <TableHeaderCell className="text-right">뉴스</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {picks.map((pick) => (
              <TableRow key={`${pick.direction}-${pick.ticker}`}>
                <TableCell className="text-right tabular-nums">{pick.pickRank}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="font-dl-mono">{pick.ticker}</span>
                  {nameOf.get(pick.ticker) ? (
                    <span className="ml-1 text-dl-fg-muted">{nameOf.get(pick.ticker)}</span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge tone={pickDirectionTone(pick.direction)} size="xs">
                    {pickDirectionLabel(pick.direction)}
                  </Badge>
                </TableCell>
                {hasAction ? (
                  <TableCell>
                    {pick.action ? (
                      <span className="flex flex-col gap-1">
                        <Badge tone={pickActionTone(pick.action)} size="xs">
                          {pickActionLabel(pick.action)}
                        </Badge>
                        {pick.actionReason ? (
                          <span
                            className="line-clamp-3 text-dl-xs text-dl-fg-muted wrap-anywhere"
                            title={pick.actionReason}
                          >
                            {pick.actionReason}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                ) : null}
                <TableCell className="text-right tabular-nums">
                  {formatRate(pick.conviction, 0)}
                </TableCell>
                <TableCell>
                  <span className="line-clamp-3 wrap-anywhere" title={pick.thesis ?? undefined}>
                    {pick.thesis ?? '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="line-clamp-3 wrap-anywhere" title={pick.riskNote ?? undefined}>
                    {pick.riskNote ?? '—'}
                  </span>
                </TableCell>
                <TableCell>
                  {pick.cited && pick.cited.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {pick.cited.map((feature) => (
                        <Badge key={feature.name} tone="neutral" size="xs">
                          {feature.name} {formatFixed(feature.value, 2)}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {pick.citedNews?.length ?? 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DashboardTable>
      )}

      {candidates.length > 0 ? (
        <Accordion type="single" collapsible>
          <AccordionItem value="candidates">
            <AccordionTrigger>후보군 {candidates.length}종목</AccordionTrigger>
            <AccordionContent>
              <DashboardTable>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className="text-right">퀀트 순위</TableHeaderCell>
                    <TableHeaderCell>종목</TableHeaderCell>
                    <TableHeaderCell>시장</TableHeaderCell>
                    <TableHeaderCell>섹터</TableHeaderCell>
                    <TableHeaderCell className="text-right">퀀트 점수</TableHeaderCell>
                    <TableHeaderCell className="text-right">기준가</TableHeaderCell>
                    <TableHeaderCell className="text-right">교훈</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.ticker}>
                      <TableCell className="text-right tabular-nums">
                        {candidate.quantRank}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-dl-mono">{candidate.ticker}</span>
                        {candidate.stockName ? (
                          <span className="ml-1 text-dl-fg-muted">{candidate.stockName}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {candidate.marketType ?? '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {candidate.sectorName ?? candidate.sectorCode ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatFixed(candidate.quantScore, 3)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {candidate.refRawClose !== null && candidate.refRawClose !== undefined
                          ? Number(candidate.refRawClose).toLocaleString('ko-KR')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {candidate.appliedLessonIds?.length ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DashboardTable>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}
