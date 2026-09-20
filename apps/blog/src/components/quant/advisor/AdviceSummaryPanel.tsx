import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
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
import type { AdviceHeader } from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import {
  dataQualityLabel,
  dataQualityTone,
  directionLabel,
  regimeLabel,
  trendLabel,
  variantLabel,
  variantTone,
} from './advisorLabels';
import { JsonPre } from './JsonPre';
import { formatFixed, formatRate } from './kpiFormat';

/**
 * 판단 상세 "요약" 서브탭 — `AdviceHeader` 를 읽는 순서대로 그린다:
 * 헤더 요약(FormGrid) → summary 문장 → 국면 근거 → 주도 섹터 표 → 추세·전망 표 → dataAsOf → guard(접힘).
 * 순수 표시라 `'use client'` 가 없다.
 */
export function AdviceSummaryPanel({ header }: { header: AdviceHeader }) {
  return (
    <div className="flex flex-col gap-3">
      <FormGrid>
        <FieldValue size="sm" label="기준일">
          {header.baseDate}
          <span className="ml-1 text-dl-fg-muted">h={header.horizonDays}</span>
        </FieldValue>
        <FieldValue size="sm" label="변형">
          <Badge tone={variantTone(header.variant)} size="sm">
            {variantLabel(header.variant)}
          </Badge>
        </FieldValue>
        <FieldValue size="sm" label="국면">
          {regimeLabel(header.regimeCode)}
        </FieldValue>
        <FieldValue size="sm" label="KOSPI / KOSDAQ 방향">
          {directionLabel(header.kospiDir)} / {directionLabel(header.kosdaqDir)}
          <span className="ml-1 text-dl-fg-muted">p(상승) {formatRate(header.pUp, 0)}</span>
        </FieldValue>
        <FieldValue size="sm" label="추세 KOSPI / KOSDAQ">
          {trendLabel(header.trendKospi)} / {trendLabel(header.trendKosdaq)}
        </FieldValue>
        <FieldValue size="sm" label="데이터 품질">
          <Badge tone={dataQualityTone(header.dataQuality)} size="sm">
            {dataQualityLabel(header.dataQuality)}
          </Badge>
        </FieldValue>
        <FieldValue size="sm" label="모델">
          {header.model ?? '—'}
          {header.promptVersion ? (
            <span className="ml-1 text-dl-fg-muted">({header.promptVersion})</span>
          ) : null}
        </FieldValue>
        <FieldValue size="sm" label="가중치 세트 / 교훈">
          {header.weightSetId !== null ? `#${header.weightSetId}` : '—'}
          <span className="ml-1 text-dl-fg-muted">
            교훈 {header.activeLessonIds?.length ?? 0}건 · 뉴스 {header.newsIds?.length ?? 0}건
          </span>
        </FieldValue>
        <FieldValue size="sm" label="진입 / 청산">
          {header.entryDate ?? '—'} / {header.exitDate ?? '—'}
        </FieldValue>
        <FieldValue size="sm" label="발행">
          {header.publishedAt ? formatUtcToLocal(header.publishedAt, 'yyyy-MM-dd HH:mm') : '미발행'}
        </FieldValue>
        <FieldValue size="sm" label="run">
          <Link
            href={runHref('ADVISOR', header.runId)}
            className="text-dl-primary-ink hover:underline"
          >
            #{header.runId}
          </Link>
        </FieldValue>
      </FormGrid>

      {header.summary ? (
        <p className="whitespace-pre-wrap text-dl-sm text-dl-fg wrap-anywhere">{header.summary}</p>
      ) : null}

      {header.regimeRationale ? (
        <section className="flex flex-col gap-1">
          <h3 className="text-dl-sm font-semibold text-dl-fg">국면 근거</h3>
          <p className="whitespace-pre-wrap text-dl-sm text-dl-fg-muted wrap-anywhere">
            {header.regimeRationale}
          </p>
        </section>
      ) : null}

      {header.leadingSectors && header.leadingSectors.length > 0 ? (
        <section className="flex flex-col gap-1">
          <h3 className="text-dl-sm font-semibold text-dl-fg">주도 섹터</h3>
          <DashboardTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>코드</TableHeaderCell>
                <TableHeaderCell>섹터</TableHeaderCell>
                <TableHeaderCell className="whitespace-normal">근거</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {header.leadingSectors.map((sector) => (
                <TableRow key={sector.code}>
                  <TableCell className="font-dl-mono whitespace-nowrap">{sector.code}</TableCell>
                  <TableCell className="whitespace-nowrap">{sector.name}</TableCell>
                  <TableCell className="wrap-anywhere">{sector.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DashboardTable>
        </section>
      ) : null}

      {header.trends && header.trends.length > 0 ? (
        <section className="flex flex-col gap-1">
          <h3 className="text-dl-sm font-semibold text-dl-fg">규칙 추세</h3>
          <DashboardTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>지수</TableHeaderCell>
                <TableHeaderCell>추세</TableHeaderCell>
                <TableHeaderCell className="text-right">점수</TableHeaderCell>
                <TableHeaderCell className="text-right">지속(일)</TableHeaderCell>
                <TableHeaderCell className="text-right">종가</TableHeaderCell>
                <TableHeaderCell className="text-right">MA20 / 60 / 120</TableHeaderCell>
                <TableHeaderCell className="text-right">breadth</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {header.trends.map((trend) => (
                <TableRow key={trend.indexCode}>
                  <TableCell className="font-dl-mono whitespace-nowrap">
                    {trend.indexCode}
                    <span className="ml-1 text-dl-fg-muted">{trend.tradeDate}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {trendLabel(trend.code)}
                    {trend.rawCode !== trend.code ? (
                      <span className="ml-1 text-dl-fg-muted">
                        (원 {trendLabel(trend.rawCode)})
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatFixed(trend.score, 2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{trend.days}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatFixed(trend.close, 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums whitespace-nowrap">
                    {formatFixed(trend.ma20, 0)} / {formatFixed(trend.ma60, 0)} /{' '}
                    {formatFixed(trend.ma120, 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRate(trend.breadth, 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DashboardTable>
        </section>
      ) : null}

      {header.outlooks && header.outlooks.length > 0 ? (
        <section className="flex flex-col gap-1">
          <h3 className="text-dl-sm font-semibold text-dl-fg">추세 전망(LLM)</h3>
          <DashboardTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>지수</TableHeaderCell>
                <TableHeaderCell>지속</TableHeaderCell>
                <TableHeaderCell className="text-right">확신</TableHeaderCell>
                <TableHeaderCell className="whitespace-normal">무효화 조건</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {header.outlooks.map((outlook) => (
                <TableRow key={outlook.indexCode}>
                  <TableCell className="font-dl-mono whitespace-nowrap">
                    {outlook.indexCode}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{outlook.persist}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRate(outlook.confidence, 0)}
                  </TableCell>
                  <TableCell className="wrap-anywhere">{outlook.invalidation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DashboardTable>
        </section>
      ) : null}

      {header.dataAsOf ? (
        <section className="flex flex-col gap-1">
          <h3 className="text-dl-sm font-semibold text-dl-fg">데이터 기준 시점</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-dl-sm sm:grid-cols-3">
            {/* dl 직계 자식은 div 만 허용된다(dt/dd 그룹 래퍼) */}
            {Object.entries(header.dataAsOf).map(([key, value]) => (
              <div key={key} className="flex min-w-0 items-baseline gap-1">
                <dt className="text-dl-xs text-dl-fg-muted">{key}</dt>
                <dd className="font-semibold text-dl-fg wrap-anywhere">
                  {typeof value === 'string' || typeof value === 'number'
                    ? String(value)
                    : JSON.stringify(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {header.guard || header.systemFingerprint ? (
        <Accordion type="single" collapsible>
          <AccordionItem value="guard">
            <AccordionTrigger>
              guard · fingerprint
              {header.systemFingerprint ? (
                <span className="ml-2 font-dl-mono text-dl-fg-muted text-dl-xs">
                  {header.systemFingerprint}
                </span>
              ) : null}
            </AccordionTrigger>
            <AccordionContent>
              <JsonPre value={header.guard} maxHeightClass="max-h-[30vh]" />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}
