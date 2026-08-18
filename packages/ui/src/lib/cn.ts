import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * 조건부 클래스 병합. shadcn 의 표준 유틸이다.
 *
 * `twMerge` 가 필요한 이유: `clsx` 만 쓰면 `"px-2"` 와 `"px-4"` 가 둘 다 남아
 * CSS 우선순위(선언 순서)에 따라 결과가 달라진다. `twMerge` 는 뒤에 온 것만 남긴다 —
 * 그래야 컴포넌트 기본 클래스를 호출부의 `className` 으로 덮어쓸 수 있다.
 *
 * 기본 설정은 커스텀 토큰 유틸리티를 그룹으로 인식하지 못한다 — Icon 기본
 * `size-dl-ic-sm` 위에 `size-dl-ctl-ic-md` 를 얹었더니 둘 다 남아 CSS 출력 순서가
 * 이긴 실측 사례(버튼 아이콘 스케일링)가 있어, `size-dl-*` 값 전체를 코어 size
 * 그룹에 등록한다. size- 접두사는 치수 전용이라 안전하다.
 * ⚠️ `text-` 는 등록하지 않는다 — 색(text-dl-fg)과 크기(text-dl-ctl-md)가 접두사를
 * 공유해 같은 그룹이 되는 순간 서로를 지운다.
 */
const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      size: [{ size: [(value: string) => value.startsWith('dl-')] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}
