import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * 카드 — QA modal-card·card: 흰 배경 · 보더 `#E6E6E6` · radius 8.
 *
 * **안쪽 여백이 담는 것에 따라 둘로 갈린다**(어느 화면에서든 같은 값을 쓴다):
 *   폼 카드    QA 리듬 `10 20`
 *   그리드 패널 카드 자체는 `0` · **제목 줄만** 여백을 갖는다
 *     — 표가 카드 끝까지 닿아야 컬럼 폭을 다 쓴다.
 */
export function Card({
  children,
  className,
  variant = 'form',
}: {
  readonly children: ReactNode;
  readonly className?: string;
  /** `form` 라벨·입력 칸 · `grid` 표를 담는 패널 · `plain` 여백을 직접 정함 */
  readonly variant?: 'form' | 'grid' | 'plain';
}) {
  return (
    <div
      className={cn(
        'rounded-dl-container border border-dl-border bg-dl-surface',
        variant === 'form' && 'px-5 py-2.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * 카드 머리 — 제목(왼쪽) + 액션(오른쪽).
 *
 * 배치 규칙: **오른쪽 끝이 주 실행 자리**이고 파괴적 액션(삭제)은 왼쪽 끝으로
 * 분리한다 — 가장 자주 누르는 버튼 옆에 붙이면 오클릭 자리가 된다.
 * 그래서 `destructive` 를 `actions` 와 따로 받는다.
 */
export function CardHeader({
  title,
  /** 제목 옆 보조 표시. 그리드 오류 문구가 여기 온다(표 아래는 빈 행에 묻힌다). */
  aside,
  destructive,
  actions,
  className,
  variant = 'form',
}: {
  readonly title: ReactNode;
  readonly aside?: ReactNode;
  readonly destructive?: ReactNode;
  readonly actions?: ReactNode;
  readonly className?: string;
  readonly variant?: 'form' | 'grid';
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3',
        variant === 'form' ? 'mb-3' : 'px-3.5 py-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <h2 className="text-dl-xl font-bold text-dl-fg">{title}</h2>
        {aside}
      </div>
      {destructive || actions ? (
        <div className="flex items-center gap-1.5">
          {destructive}
          {destructive && actions ? <span className="flex-1" /> : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}
