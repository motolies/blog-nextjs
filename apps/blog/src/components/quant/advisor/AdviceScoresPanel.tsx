import {
  Badge,
  EmptyState,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@hvy/ui';
import { DashboardTable } from '@/components/dashboard/DashboardTable';
import type { CallScoreRow, CandidateScoreRow } from '@/types/quant';
import {
  callSubjectLabel,
  directionLabel,
  scoreStageLabel,
  scoreStatusLabel,
  scoreStatusTone,
} from './advisorLabels';
import { formatFixed, formatRate, formatSignedPct, signTone } from './kpiFormat';

const SIGN_CLASS: Record<ReturnType<typeof signTone>, string> = {
  success: 'text-dl-success-ink',
  danger: 'text-dl-danger-ink',
  neutral: 'text-dl-fg',
};

/**
 * 판단 상세 "채점" 서브탭 — 종목 채점(candidateScores)·시장 콜 채점(callScores) 두 표.
 * 채점은 T+5 청산 뒤에 생기므로 최근 판단은 비어 있는 것이 정상이다 — 빈 상태 문구가 그 사정을 말한다.
 */
export function AdviceScoresPanel({
  candidateScores,
  callScores,
}: {
  candidateScores: readonly CandidateScoreRow[];
  callScores: readonly CallScoreRow[];
}) {
  if (candidateScores.length === 0 && callScores.length === 0) {
    return (
      <EmptyState
        message="채점이 아직 없습니다"
        hint="청산일(T+5) 다음 SCORE 실행 뒤 잠정 채점, 확정은 그 뒤 — 판정 시점 전에는 비어 있는 것이 정상입니다"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-1">
        <h3 className="text-dl-sm font-semibold text-dl-fg">
          종목 채점 ({candidateScores.length})
        </h3>
        {candidateScores.length === 0 ? (
          <p className="text-dl-xs text-dl-fg-muted">없음</p>
        ) : (
          <DashboardTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>종목</TableHeaderCell>
                <TableHeaderCell>단계</TableHeaderCell>
                <TableHeaderCell>상태</TableHeaderCell>
                <TableHeaderCell>진입 → 청산</TableHeaderCell>
                <TableHeaderCell className="text-right">수익</TableHeaderCell>
                <TableHeaderCell className="text-right">벤치</TableHeaderCell>
                <TableHeaderCell className="text-right">초과</TableHeaderCell>
                <TableHeaderCell className="text-right">비용 조정</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidateScores.map((score) => (
                <TableRow key={`${score.ticker}-${score.stage}`}>
                  <TableCell className="font-dl-mono whitespace-nowrap">{score.ticker}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {scoreStageLabel(score.stage)}
                  </TableCell>
                  <TableCell>
                    <Badge tone={scoreStatusTone(score.status)} size="xs">
                      {scoreStatusLabel(score.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {score.entryDate ?? '—'} {formatFixed(score.entryPrice, 0)} →{' '}
                    {score.exitDate ?? '—'} {formatFixed(score.exitPrice, 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatSignedPct(score.ret)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatSignedPct(score.benchRet)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold tabular-nums ${SIGN_CLASS[signTone(score.excessRet)]}`}
                  >
                    {formatSignedPct(score.excessRet)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatSignedPct(score.costAdjExcess)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DashboardTable>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <h3 className="text-dl-sm font-semibold text-dl-fg">시장 콜 채점 ({callScores.length})</h3>
        {callScores.length === 0 ? (
          <p className="text-dl-xs text-dl-fg-muted">없음</p>
        ) : (
          <DashboardTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>대상</TableHeaderCell>
                <TableHeaderCell>단계</TableHeaderCell>
                <TableHeaderCell>상태</TableHeaderCell>
                <TableHeaderCell>예측 → 실제</TableHeaderCell>
                <TableHeaderCell className="text-right">p(상승)</TableHeaderCell>
                <TableHeaderCell className="text-right">실제 수익</TableHeaderCell>
                <TableHeaderCell>적중</TableHeaderCell>
                <TableHeaderCell className="text-right">Brier</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {callScores.map((score) => (
                <TableRow key={`${score.subjectType}-${score.subjectCode}-${score.stage}`}>
                  <TableCell className="whitespace-nowrap">
                    {callSubjectLabel(score.subjectType)}
                    <span className="ml-1 font-dl-mono text-dl-fg-muted">{score.subjectCode}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {scoreStageLabel(score.stage)}
                  </TableCell>
                  <TableCell>
                    <Badge tone={scoreStatusTone(score.status)} size="xs">
                      {scoreStatusLabel(score.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {directionLabel(score.predicted)} → {directionLabel(score.actualDir)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRate(score.pUp, 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatSignedPct(score.actualRet)}
                  </TableCell>
                  <TableCell>
                    {score.hit === null ? (
                      '—'
                    ) : (
                      <Badge tone={score.hit ? 'success' : 'danger'} size="xs">
                        {score.hit ? '적중' : '빗나감'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatFixed(score.brier, 3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DashboardTable>
        )}
      </section>
    </div>
  );
}
