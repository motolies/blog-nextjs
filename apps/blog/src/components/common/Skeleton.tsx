import { cn } from '@hvy/ui';

/**
 * 로딩 자리표시자.
 *
 * @hvy/ui 가 아니라 앱 소유인 이유: packages/ui/README 의 Primitive/Composite 원칙은
 * "틀리면 조용히 위험하거나 어려운 것"(포커스 트랩·가상 스크롤)을 패키지의 몫으로 둔다.
 * 맥동하는 div 는 둘 다 아니다.
 *
 * 스피너 8개 대신 이걸 쓰는 이유: 대시보드는 모양이 정해진 상자들의 격자다.
 * 스피너는 상자를 높이 0으로 접었다가 데이터가 오면 펼치므로 레이아웃이 튄다.
 * 골격을 미리 그려두면 화면이 흔들리지 않는다.
 *
 * bg-dl-option-hover / animate-pulse 는 각각 정의된 dl 토큰과 Tailwind 코어 유틸이라
 * verify:tokens 의 팔레트·미정의 토큰 규칙을 통과한다.
 */

interface SkeletonProps {
  variant?: 'text' | 'block';
  className?: string;
}

export function Skeleton({ variant = 'block', className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'block animate-pulse rounded-dl-container bg-dl-option-hover motion-reduce:animate-none',
        variant === 'text' && 'h-4 rounded-dl-badge',
        className,
      )}
    />
  );
}
