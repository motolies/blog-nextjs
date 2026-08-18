/**
 * 옵션 그룹 헤더 판정 — Select · MultiSelect 가 공유한다.
 *
 * 그룹 헤더는 **시각 전용**이다: 옵션 배열의 인덱스(activeIndex·aria-activedescendant)에
 * 끼어들지 않고, 렌더 시점에 "앞 옵션과 그룹이 갈리는 자리"에만 끼워 넣는다 —
 * 키보드 로직이 헤더의 존재를 몰라도 되는 구조라 두 컴포넌트의 이동·검색 코드가
 * 그대로 성립한다. **같은 그룹은 연속 배치가 전제다** — 흩어져 있으면 헤더가 반복된다
 * (정렬은 호출부 몫 — `ui` 는 순서를 바꾸지 않는다).
 *
 * React 에 의존하지 않는다 — vitest 환경이 node(DOM 없음)라 순수 모듈만
 * 단위 테스트가 가능하다(`rangeOrder.ts` 와 같은 이유).
 */

/** 현재 옵션 앞에 그룹 헤더를 그려야 하면 그 라벨, 아니면 null. */
export function groupHeaderBefore(
  current: { readonly group?: string },
  previous: { readonly group?: string } | undefined,
): string | null {
  if (current.group === undefined) return null;
  return current.group === previous?.group ? null : current.group;
}
