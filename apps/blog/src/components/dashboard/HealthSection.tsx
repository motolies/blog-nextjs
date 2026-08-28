'use client';

import { Badge, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@hvy/ui';
import type { UseQueryResult } from '@tanstack/react-query';
import Link from 'next/link';
import { BarList } from '@/components/common/chart/BarList';
import { formatCompact, formatRelativeTime, truncateMiddle } from '@/lib/statFormat';
import type { HealthStats, SchedulerHealthState, SchedulerStatus } from '@/types/stats';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import { DashboardTable } from './DashboardTable';
import { DashboardWidget } from './DashboardWidget';

interface HealthSectionProps {
  query: UseQueryResult<HealthStats>;
}

export function HealthSection({ query }: HealthSectionProps) {
  return (
    <>
      <DashboardWidget
        title="최근 오류"
        caption="24시간 · 클릭하면 시스템 로그로"
        query={query}
        isEmpty={(data) => data.recentErrors.length === 0}
        empty={{ message: '지난 24시간 오류가 없습니다' }}
        errorMessage="오류 목록을 불러오지 못했습니다."
      >
        {(data) => (
          /*
            table-fixed 인 이유: 자유텍스트가 2열(경로·예외)이라 auto 레이아웃은 여유 폭을
            max-content 비율로 나눈다. stackTraceHead 는 최대 수백 자라 여유의 대부분을
            가져가고 경로가 몇 글자/줄로 짜부라진다 — 레이아웃이 "오늘 어떤 예외가 터졌는가"에
            따라 매번 달라진다. fixed 는 그 결정권을 콘텐츠에서 빼앗는다.
            ⚠️ 컬럼 폭 합은 반드시 12/12 를 유지할 것 — 넘으면 표가 다시 컨테이너를 넘는다.
          */
          <DashboardTable className="table-fixed">
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-3/12">시각</TableHeaderCell>
                <TableHeaderCell className="w-4/12">경로</TableHeaderCell>
                <TableHeaderCell className="w-5/12">예외</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recentErrors.map((error) => (
                <TableRow key={error.id}>
                  {/*
                    날짜와 시각을 명시적으로 두 줄로 나눈다. "MM-dd HH:mm" 한 덩어리면
                    nowrap 일 때 컬럼 하한 89px 을 박아 옆 칸을 짜부라뜨리고, nowrap 을 풀면
                    폭에 따라 갈라지는 자리가 달라져 지저분하다. 쪼개 두면 어느 폭에서나 같은
                    자리에서 갈라지고 요구 폭이 36px 로 줄어든다 — 예외 셀이 line-clamp-2 로
                    이미 두 줄 높이를 쓰므로 행 높이도 늘지 않는다. 절대 시각은 title 에 남긴다.
                  */}
                  <TableCell title={formatUtcToLocal(error.createdAt)}>
                    <span className="block">{formatUtcToLocal(error.createdAt, 'MM-dd')}</span>
                    <span className="block">{formatUtcToLocal(error.createdAt, 'HH:mm')}</span>
                  </TableCell>
                  <TableCell>
                    {/* traceId 로 시스템 로그를 바로 필터링한다 — 토스트의 traceId 복사 흐름과 같은 목적지 */}
                    {error.traceId ? (
                      <Link
                        href={`/admin/system-log?traceId=${error.traceId}`}
                        className="line-clamp-2 wrap-anywhere text-dl-primary-ink hover:underline"
                        title={error.requestUri ?? undefined}
                      >
                        {error.requestUri ?? error.methodName ?? '-'}
                      </Link>
                    ) : (
                      <span
                        className="line-clamp-2 wrap-anywhere"
                        title={error.requestUri ?? undefined}
                      >
                        {error.requestUri ?? '-'}
                      </span>
                    )}
                  </TableCell>
                  {/*
                    truncateMiddle(…, 40) 을 걷어냈다: head 20 + tail 19 라 FQCN 꼬리의
                    예외 클래스명이 항상 지워졌다("kr.hvy.blog.modules.…글을 찾을 수 없습니다").
                    가운데 접기는 앞뒤가 모두 의미를 갖는 URI 용 설계인데 FQCN 은 의미가 꼬리에 몰린 값이다.
                    line-clamp 는 컬럼 폭에 반응하고 접근성 트리에는 전문이 남아 스크린리더가 전체를 읽는다.
                    line-clamp 는 display:-webkit-box 를 설정하므로 <td> 가 아니라 안쪽 <span> 에 건다.
                  */}
                  <TableCell title={error.stackTraceHead ?? undefined}>
                    <span className="line-clamp-2 wrap-anywhere">
                      {error.stackTraceHead ?? '-'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DashboardTable>
        )}
      </DashboardWidget>

      <DashboardWidget
        title="느린 엔드포인트"
        caption="24시간 p95 · 5회 이상 호출"
        query={query}
        isEmpty={(data) => data.slowEndpoints.length === 0}
        empty={{ message: '집계할 만큼의 호출이 없습니다' }}
        errorMessage="응답시간 통계를 불러오지 못했습니다."
      >
        {(data) => (
          <BarList
            ariaLabel="느린 엔드포인트 p95"
            formatValue={(value) => `${formatCompact(value)}ms`}
            items={data.slowEndpoints.map((endpoint) => ({
              id: `${endpoint.httpMethodType}-${endpoint.uriPattern}`,
              label: truncateMiddle(endpoint.uriPattern, 32),
              labelText: endpoint.uriPattern,
              value: endpoint.p95ProcessTime,
              hint: `${endpoint.requestCount}회`,
              tone: 'warning' as const,
            }))}
          />
        )}
      </DashboardWidget>

      <DashboardWidget
        title="스케줄러 마지막 실행"
        // 라벨이 "정상"이 아니라 "마지막 실행"인 것은 정직성 문제다 — 아래 주석 참고
        caption="성공 여부는 알 수 없음"
        query={query}
        isEmpty={(data) => data.schedulers.length === 0}
        empty={{ message: '등록된 스케줄러가 없습니다' }}
        errorMessage="스케줄러 상태를 불러오지 못했습니다."
      >
        {(data) => (
          /*
            여기는 table-fixed 를 쓰지 않는다 — 자유텍스트가 "잡" 한 열뿐이라 auto 가 더 낫고,
            무엇보다 fixed 에서는 셀이 열보다 넓으면 옆 칸으로 삐져나온다.
            "실행 기록 없음" 배지는 nowrap + 고정 높이라 접히지도 줄지도 못하는데 3/12 폭보다 넓다.
            auto 레이아웃은 배지에 필요한 만큼을 정확히 준다.
          */
          <DashboardTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>잡</TableHeaderCell>
                {/* TableHeaderCell 기본값이 whitespace-nowrap 이라 헤더가 컬럼 하한을 박는다 */}
                <TableHeaderCell className="whitespace-normal">마지막 실행</TableHeaderCell>
                <TableHeaderCell>상태</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.schedulers.map((job) => (
                <TableRow key={job.lockName}>
                  {/* displayName 은 백엔드 문자열이라 길이 계약이 없다 — 카멜케이스 락 이름이 오면
                      줄바꿈 기회가 0 이라 wrap-anywhere 로 min-content 를 낮춰 둔다 */}
                  <TableCell className="wrap-anywhere" title={job.cronExpression ?? undefined}>
                    {job.displayName}
                  </TableCell>
                  {/* whitespace-nowrap 제거 — "3시간 전" 의 공백이 접힘점이다. 절대 시각은 title 유지 */}
                  <TableCell title={job.lockedAt ? formatUtcToLocal(job.lockedAt) : undefined}>
                    {formatRelativeTime(job.lockedAt)}
                  </TableCell>
                  <TableCell>
                    <Badge tone={stateTone(job)} size="xs">
                      {STATE_LABEL[job.state]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DashboardTable>
        )}
      </DashboardWidget>

      <DashboardWidget
        title="외부 API 실패"
        caption="24시간 · Jira · Claude · Slack 등"
        query={query}
        isEmpty={(data) => data.externalApiFailures.length === 0}
        empty={{ message: '외부 호출 실패가 없습니다' }}
        errorMessage="외부 API 통계를 불러오지 못했습니다."
      >
        {(data) => (
          <BarList
            ariaLabel="외부 API 실패 건수"
            items={data.externalApiFailures.map((api) => ({
              id: `${api.httpMethodType}-${api.uriPattern}`,
              label: truncateMiddle(api.uriPattern, 32),
              labelText: api.uriPattern,
              value: api.failureCount,
              hint: `/ ${api.callCount}회`,
              tone: 'danger' as const,
            }))}
          />
        )}
      </DashboardWidget>
    </>
  );
}

/**
 * shedlock 은 "실행했다"만 증언하고 "성공했다"는 말하지 않는다.
 * AbstractScheduler.proceedScheduler() 가 예외를 삼키고 로그만 남기는데,
 * 실패해도 ShedLock 은 정상 해제되어 locked_at 이 갱신되기 때문이다.
 * 그래서 배지 문구도 "정상"이 아니라 지연 여부만 말한다.
 */
const STATE_LABEL: Record<SchedulerHealthState, string> = {
  RUNNING: '실행 중',
  OK: '주기 내',
  STALE: '지연',
  NEVER_RUN: '실행 기록 없음',
  DISABLED: '사용 안 함',
};

function stateTone(job: SchedulerStatus): 'success' | 'warning' | 'danger' | 'neutral' | 'primary' {
  switch (job.state) {
    case 'RUNNING':
      return 'primary';
    case 'OK':
      return 'success';
    case 'STALE':
      return 'danger';
    case 'NEVER_RUN':
      return 'warning';
    default:
      return 'neutral';
  }
}
