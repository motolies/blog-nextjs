import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * lucide 아이콘을 그리는 단일 래퍼.
 *
 * 원본(@deleo/ui)은 자체 스프라이트 42종이었지만, blog 는 lucide-react 를 아이콘
 * 프레임워크로 쓰기로 결정했다(앱이 이미 81종을 직접 import). 래퍼가 남는 이유는
 * 두 가지 규약 때문이다 — **크기 토큰**(size-dl-ic-*)과 **a11y 규약**(title 유무).
 *
 * `'use client'` 가 없다 — 순수 렌더라 RSC 에서도 쓴다.
 *
 * 색을 받지 않는다. **색은 버튼이 정하고 아이콘은 `currentColor` 로 따라간다.**
 * 고정색이 필요하면 부모에 색 유틸리티를 준다.
 */

/**
 * 크기 규칙: is-16 · is-20 · is-24 세 단.
 * 자물쇠(12px)만 상태 표시 예외로 남는다.
 */
export type IconSize =
  | 'sm' // 16 · 본문 · 버튼 안 · 폼 필드 액션
  | 'md' // 20 · 사이드바 메뉴 · 강조 액션
  | 'lg' // 24 · 모달 닫기
  | 'lock'; // 12 · 자물쇠 전용

const SIZE_CLASS: Readonly<Record<IconSize, string>> = {
  sm: 'size-dl-ic-sm',
  md: 'size-dl-ic-md',
  lg: 'size-dl-ic-lg',
  lock: 'size-dl-ic-lock',
};

export type IconProps = {
  /** lucide 아이콘 컴포넌트 참조 — 문자열 레지스트리를 두지 않아 트리셰이킹이 유지된다. */
  readonly icon: LucideIcon;
  readonly size?: IconSize;
  /**
   * 있으면 `role="img"` + `aria-label` 로 이름을 갖는다. 없으면 `aria-hidden`.
   *
   * 라벨 옆 장식 아이콘은 **넣지 않는 것이 맞다** — 넣으면 스크린리더가 라벨을 두 번 읽는다.
   * 아이콘 단독 버튼이라면 여기가 아니라 버튼의 `aria-label` 에 넣는다.
   */
  readonly title?: string;
  readonly className?: string;
};

export function Icon({ icon: IconComponent, size = 'sm', title, className }: IconProps) {
  return (
    <IconComponent
      // flex 컨테이너 안에서 찌그러지지 않게 한다
      className={cn(SIZE_CLASS[size], 'shrink-0', className)}
      strokeWidth={2}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    />
  );
}
