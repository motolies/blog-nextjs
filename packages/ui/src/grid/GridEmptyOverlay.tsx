'use client';

import type { LucideIcon } from 'lucide-react';
import { CircleAlert, Inbox, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../components/button';
import { Spinner } from '../components/feedback';
import { Icon } from '../icons';
import { cn } from '../lib/cn';

/**
 * 그리드가 "행이 없다" 를 그리는 방법 — `DataGrid`(오버레이)·`TreeGrid`(흐름) 공용.
 *
 * `components/feedback.tsx` 의 `EmptyState` 와 나누는 이유: 저쪽은 앱 조합물이 쓰는
 * **문구 2줄짜리 단순형**이고, 여기는 (a) 왜 비었는지의 상태 의미(idle·empty·error)를
 * 갖고 (b) 헤더 아래에 위치를 잡아야 한다. 합치면 둘 중 하나가 반드시 남의 규격을 진다.
 */
export type GridEmptyState =
  /** 아직 조회하지 않았다 — 검색 조건을 넣고 조회를 눌러야 하는 화면의 첫 상태. */
  | 'idle'
  /** 조회했고 0건. 생략 시 기본값이다. */
  | 'empty'
  /** 조회가 실패했다 — 0건과 **다른 사실**이라 문구·색·액션이 달라야 한다. */
  | 'error';

export type GridEmpty = {
  /** 왜 비었는가. 생략하면 `'empty'`(조회했고 0건). */
  readonly state?: GridEmptyState;
  readonly title: ReactNode;
  readonly hint?: ReactNode;
  /** 생략하면 state 별 기본 아이콘. `null` 이면 아이콘을 그리지 않는다. */
  readonly icon?: LucideIcon | null;
  /** 한 개짜리 탈출구 — error 의 "다시 시도", idle 의 "조회" 등. `ui` 는 사전을 모른다. */
  readonly action?: { readonly label: string; readonly onAction: () => void };
};

const DEFAULT_ICON: Readonly<Record<GridEmptyState, LucideIcon>> = {
  idle: Search,
  empty: Inbox,
  error: CircleAlert,
};

/**
 * 흐름 배치형 — `TreeGrid` 처럼 헤더도 가상 스크롤도 없는 렌더러가 그대로 쓴다.
 * 자리(높이)는 호출부가 `className` 으로 준다 — 여기서 정하면 담기는 곳마다 어긋난다.
 */
export function GridEmptyContent({
  empty,
  loading = false,
  loadingLabel,
  className,
}: {
  readonly empty: GridEmpty;
  /** 첫 조회 중 — 문구를 `loadingLabel` 로 덮고 아이콘 자리에 Spinner 를 둔다. */
  readonly loading?: boolean;
  readonly loadingLabel?: ReactNode;
  readonly className?: string;
}) {
  const state = empty.state ?? 'empty';
  // `undefined`(미지정)와 `null`(그리지 않음)을 가른다 — 후자가 명시적 opt-out 이다.
  const icon = empty.icon === undefined ? DEFAULT_ICON[state] : empty.icon;

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-2 px-4 text-center', className)}
    >
      {loading ? (
        <Spinner className="size-5" />
      ) : icon ? (
        <Icon
          icon={icon}
          size="lg"
          className={state === 'error' ? 'text-dl-error' : 'text-dl-fg-subtle'}
        />
      ) : null}

      <p
        className={cn(
          'text-dl-base font-semibold',
          state === 'error' ? 'text-dl-error' : 'text-dl-fg-muted',
        )}
      >
        {loading ? loadingLabel : empty.title}
      </p>

      {/* 로딩 중에는 힌트·액션을 감춘다 — 아직 결과가 아니므로 "조건을 바꿔 보라" 가 거짓말이 된다 */}
      {!loading && empty.hint ? <p className="text-dl-sm text-dl-fg-subtle">{empty.hint}</p> : null}
      {!loading && empty.action ? (
        <Button size="sm" variant="outline-gray" onClick={empty.action.onAction} className="mt-1">
          {empty.action.label}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * `DataGrid` 전용 오버레이 — **스크롤 컨테이너 밖**에 절대배치된다.
 *
 * ⚠️ 스크롤 컨테이너 **안**에 두면 안 되는 이유 둘(실측):
 *  1. containing block 이 `minWidth: totalWidth` div 가 되어 가운데정렬이 뷰포트가
 *     아니라 **컬럼 총폭**의 중앙으로 간다 — 컬럼 14개(총폭 2000) 를 뷰포트 900 에서
 *     보면 문구가 x≈1000 에 그려져 가로로 끝까지 밀어야 보인다.
 *  2. 절대배치가 스크롤 오버플로를 만들어 **행이 0인데 세로 스크롤바가 생긴다.**
 *
 * 헤더는 스크롤 컨테이너 안의 sticky 지만 높이를 숫자로 알고 있으므로 `top` 으로 피해 간다.
 */
export function GridEmptyOverlay({
  top,
  ...rest
}: { readonly top: number } & Parameters<typeof GridEmptyContent>[0]) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[var(--dl-z-grid-empty)] flex items-center justify-center bg-dl-surface"
      style={{ top }}
    >
      <GridEmptyContent {...rest} />
    </div>
  );
}
