import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Tailwind v4 `--text-*` 네임스페이스에 우리가 선언한 **폰트 크기 토큰 전부.**
 * 정본은 `theme/default.css` 타이포 섹션이고, 동일성은 `pnpm verify:tokens` 가 강제한다.
 *
 * 이 목록이 twMerge 에게 "`text-dl-ctl-md` 는 색이 아니라 크기"라고 알려주는 유일한 근거다.
 * tailwind-merge 의 기본 `theme.color` 는 `isAny` 라 **아무 `text-*` 나 색으로 삼킨다** —
 * 목록에서 하나라도 빠지면 그 크기 토큰이 같은 요소의 진짜 글자색을 지운다.
 * 실제 사고였다: Primary 버튼 라벨이 `text-dl-ctl-md` 에 먹혀 사라지고 body 상속색(검정)이
 * 나왔는데, 유틸리티도 변수도 멀쩡해 화면 말고는 아무것도 잡지 못했다(`cn.test.ts` 가 고정한다).
 */
export const DL_FONT_SIZE_TOKENS = [
  'dl-xs',
  'dl-sm',
  'dl-md',
  'dl-base',
  'dl-lg',
  'dl-xl',
  'dl-subtitle',
  'dl-title',
  'dl-heading',
  'dl-ctl-xs',
  'dl-ctl-sm',
  'dl-ctl-md',
  'dl-ctl-lg',
  'dl-ctl-xl',
] as const;

/**
 * `--spacing-dl-*` · `--radius-dl-*` 는 이름으로 판별한다 — 개수가 많고 계속 늘며,
 * 접두사(spacing/radius)가 색과 겹치지 않아 열거할 이유가 없다.
 */
const isDlToken = (value: string): boolean => value.startsWith('dl-');

/**
 * 조건부 클래스 병합. shadcn 의 표준 유틸이다.
 *
 * `twMerge` 가 필요한 이유: `clsx` 만 쓰면 `"px-2"` 와 `"px-4"` 가 둘 다 남아
 * CSS 우선순위(선언 순서)에 따라 결과가 달라진다. `twMerge` 는 뒤에 온 것만 남긴다 —
 * 그래야 컴포넌트 기본 클래스를 호출부의 `className` 으로 덮어쓸 수 있다.
 *
 * 확장은 `classGroups` 가 아니라 **`theme`** 을 쓴다 — tailwind-merge 의 theme 키는
 * Tailwind v4 의 `@theme` 네임스페이스와 1:1 대응이라, 우리 토큰을 그 자리에 넣는 것이
 * 곧 "이 토큰은 크기다 / 치수다"를 정확히 선언하는 것이 된다. 그룹을 직접 건드리면
 * 같은 접두사를 공유하는 다른 축까지 휩쓸린다.
 *
 * ⚠️ 알려진 과잉 하나 — tailwind-merge 기본 설정의 `conflictingClassGroups` 때문에
 * `cn('leading-relaxed', 'text-dl-xs')` 는 `leading-*` 을 지운다. 우리 `--text-dl-*` 에는
 * 짝 line-height 가 없어 실제로는 불필요한 충돌이지만, 끄면 stock `text-sm` 의 정상
 * 동작까지 깨진다. 그래서 끄지 않고 테스트로 고정만 해 둔다.
 */
const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: [...DL_FONT_SIZE_TOKENS],
      spacing: [isDlToken],
      radius: [isDlToken],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
