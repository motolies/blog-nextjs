'use client';

import { CardHeader, cn, EmptyState, ErrorState, Spinner } from '@hvy/ui';
import type { ReactNode } from 'react';

/**
 * 대시보드 위젯의 껍데기 + 상태 머신을 <b>단일 소유</b>하는 컴포넌트.
 *
 * 지난번 /admin/stats 가 삭제된 구조적 원인은 위젯마다 껍데기를 손으로 다시 짠 것이었다
 * (StatCard 자체 구현, raw table). 위젯 수만큼 색이 샐 기회가 생겼고, 그중 하나가
 * 다크 모드 대비 1.1:1 이 되어 화면 전체를 접었다.
 * 헤더·패딩·로딩·에러·빈 상태를 여기 한 파일에 모으면 그런 버그가 생길 자리가 한 곳으로 줄어든다.
 *
 * <b>규칙: 대시보드는 토스트를 띄우지 않는다.</b>
 * 독립된 쿼리 넷이 동시에 실패하면 showApiErrorToast 가 넷 겹쳐 뜬다.
 * 토스트는 사용자가 클릭한 행동(발행 토글·삭제)의 응답으로만 쓰고,
 * 읽기 실패는 위젯 자리에서 재시도 버튼과 함께 조용히 표시한다.
 */

interface QueryLike<T> {
  data: T | undefined;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

interface DashboardWidgetProps<T> {
  title: ReactNode;
  /** 제목 옆 보조 텍스트 — 집계 기준·기간처럼 "이 숫자가 무엇인지" 밝히는 자리. */
  caption?: ReactNode;
  actions?: ReactNode;
  query: QueryLike<T>;
  isEmpty?: (data: T) => boolean;
  empty?: { message: ReactNode; hint?: ReactNode };
  errorMessage?: ReactNode;
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
  className?: string;
  id?: string;
}

export function DashboardWidget<T>({
  title,
  caption,
  actions,
  query,
  isEmpty,
  empty,
  errorMessage = '데이터를 불러오지 못했습니다.',
  skeleton,
  children,
  className,
  id,
}: DashboardWidgetProps<T>) {
  return (
    <section id={id} className={cn('admin-panel admin-panel-pad admin-widget', className)}>
      <CardHeader
        title={
          <span className="flex flex-wrap items-baseline gap-2">
            <span>{title}</span>
            {caption ? (
              <span className="text-dl-xs font-normal text-[color:var(--admin-text-faint)]">
                {caption}
              </span>
            ) : null}
          </span>
        }
        aside={
          // 재조회 중에는 이전 데이터를 화면에 남기고 헤더에만 스피너를 띄운다 —
          // 화면을 비우면 기간 전환이 깜빡임으로 느껴진다.
          // shrink-0 로 감싸는 이유: CardHeader 의 aside 슬롯에는 shrink-0 이 없고 Spinner 는
          // 빈 <span> 이라 min-content 가 0 이다. 좁은 폭에서 제목이 길면 음의 여유를
          // 스피너가 전부 흡수해 사라진다 — 재조회 중이라는 유일한 신호가 없어진다.
          query.isFetching && !query.isPending ? (
            <span className="flex shrink-0">
              <Spinner />
            </span>
          ) : undefined
        }
        actions={actions}
      />
      <div className="mt-3">{renderBody()}</div>
    </section>
  );

  function renderBody() {
    if (query.isPending) {
      return skeleton ?? <DefaultSkeleton />;
    }
    if (query.isError || query.data === undefined) {
      return <ErrorState message={errorMessage} onRetry={query.refetch} />;
    }
    if (isEmpty?.(query.data)) {
      return (
        <EmptyState message={empty?.message ?? '표시할 데이터가 없습니다'} hint={empty?.hint} />
      );
    }
    return children(query.data);
  }
}

function DefaultSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <span className="block h-4 w-1/3 animate-pulse rounded-dl-badge bg-dl-option-hover motion-reduce:animate-none" />
      <span className="block h-16 w-full animate-pulse rounded-dl-container bg-dl-option-hover motion-reduce:animate-none" />
    </div>
  );
}
