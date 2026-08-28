import { cn } from '@hvy/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CHART_LINE, seriesColor } from './chartPalette';

/**
 * 가로 막대 목록 — SVG 가 아니라 DOM 으로 그린다.
 *
 * 가로 막대를 SVG 로 그리면 텍스트 선택·폰트 스케일·라벨 넘침 처리를 전부 잃는데 얻는 것이 없다.
 * <ul>/<li> 로 두면 라벨과 값이 진짜 텍스트라 스크린리더가 "…/api/post, 5" 를 그대로 읽는다 —
 * 별도의 visually-hidden 표가 필요 없다. 막대 자체는 aria-hidden 장식이다.
 *
 * 폭은 % 라 "px 는 보더에만" 규칙과 충돌하지 않고, 컨테이너 크기를 재지 않아도 반응형이다.
 */

export interface BarItem {
  id: string;
  label: ReactNode;
  /** 라벨의 텍스트 표현 — title 속성과 접근성 이름에 쓴다. */
  labelText?: string;
  value: number;
  hint?: ReactNode;
  href?: string;
  /** 지정하면 계열 색 대신 이 톤의 선 색을 쓴다. */
  tone?: 'primary' | 'danger' | 'warning' | 'neutral';
  seriesIndex?: number;
}

interface BarListProps {
  items: readonly BarItem[];
  ariaLabel: string;
  /** 두 목록의 막대 길이를 맞추려면 공통 최댓값을 넘긴다. */
  max?: number;
  formatValue?: (value: number) => string;
  emptyMessage?: ReactNode;
}

/**
 * 라벨 클래스 — `block` 이 전제다.
 *
 * overflow·text-overflow 는 block container 에만 적용되는데, 라벨은 인라인 <span>/<a> 라
 * grid 아이템이 아니어서 blockify 되지 않는다. 그래서 truncate 중 살아남는 선언이
 * white-space:nowrap 하나뿐이었고, 말줄임 대신 "한 줄 강제"만 걸려 라벨이 값 칸 위로
 * 덮여 두 글자가 겹쳤다(375px 실측 58~99px 겹침).
 *
 * sm 미만에서는 아예 접는다 — URI 는 공백이 없어 wrap-anywhere 없이는 줄바꿈 지점이 없고,
 * 터치 기기에는 title 을 띄울 hover 가 없어 잘린 정보를 되찾을 길이 없다.
 */
const LABEL_CLASS = 'block truncate max-sm:whitespace-normal max-sm:wrap-anywhere';

export function BarList({
  items,
  ariaLabel,
  max,
  formatValue = (value) => value.toLocaleString('ko-KR'),
  emptyMessage,
}: BarListProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-dl-sm text-[color:var(--admin-text-faint)]">
        {emptyMessage ?? '표시할 데이터가 없습니다'}
      </p>
    );
  }

  // 최댓값이 0이면(전부 0) 모든 막대를 0%로 — 0으로 나누지 않는다
  const ceiling = max ?? Math.max(...items.map((item) => item.value));

  return (
    <ul aria-label={ariaLabel} className="flex flex-col gap-2">
      {items.map((item, index) => {
        const percent = ceiling > 0 ? Math.max(2, (item.value / ceiling) * 100) : 0;
        const color = item.tone ? CHART_LINE[item.tone] : seriesColor(item.seriesIndex ?? index);
        const label = item.href ? (
          <Link
            href={item.href}
            className={cn(LABEL_CLASS, 'text-dl-primary-ink hover:underline')}
            title={item.labelText}
          >
            {item.label}
          </Link>
        ) : (
          <span className={LABEL_CLASS} title={item.labelText}>
            {item.label}
          </span>
        );

        return (
          <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
            <div className="min-w-0 text-dl-sm text-[color:var(--admin-text)]">{label}</div>
            <div className="text-right text-dl-sm tabular-nums text-[color:var(--admin-text-secondary)]">
              {formatValue(item.value)}
              {item.hint ? (
                <span className="ml-1 text-dl-xs text-[color:var(--admin-text-faint)]">
                  {item.hint}
                </span>
              ) : null}
            </div>
            {/* 막대는 값의 시각화일 뿐 — 같은 정보가 위에 텍스트로 있으므로 보조기기에서 숨긴다 */}
            <span aria-hidden className={cn('chart-bar-track', 'col-span-2')}>
              <span
                className="chart-bar-fill"
                style={{ inlineSize: `${percent}%`, background: color }}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
