/**
 * 목록 재배열 계산 — **순수 함수만 둔다.**
 *
 * `columnLayout.ts` 와 같은 이유다: 이 레포의 vitest 환경은 `node` 라 DOM 이 없고,
 * 재배열은 **틀려도 에러가 안 나고 항목만 엉뚱한 곳에 놓이는** 종류라 테스트가 붙어 있어야 한다.
 *
 * 그리드 개념이 들어 있지 않다 — `dnd/` 에 두는 이유이자, 정렬 기준 모달처럼
 * 다른 목록도 그대로 쓸 수 있는 이유다.
 */

/** `from` 의 항목을 빼내 `to` 자리에 끼운다. 원본은 건드리지 않는다. */
export function moveItem<T>(list: readonly T[], from: number, to: number): readonly T[] {
  if (from === to || from < 0 || from >= list.length) return list;

  const target = Math.min(Math.max(to, 0), list.length - 1);
  const next = [...list];
  const [picked] = next.splice(from, 1);
  if (picked === undefined) return list;
  next.splice(target, 0, picked);
  return next;
}

/**
 * 목표 인덱스를 **자기 그룹 안으로 가둔다**(고정열은 고정열 구간, 일반열은 일반열 구간).
 *
 * ⚠️ 막는 게 아니라 **가두는** 이유: 드래그는 여러 칸을 한 번에 건너뛴다.
 *    "그룹이 다르면 이동 무시"로 처리하면 고정열 위로 끌었을 때 **아무 일도 일어나지 않아**
 *    고장난 것처럼 보인다. 경계까지는 따라오고 거기서 멈춰야 한다.
 *
 * @param groups 인덱스별 그룹 표식(여기서는 `pinned` 여부)
 */
export function clampToGroup(groups: readonly boolean[], from: number, to: number): number {
  const [start, end] = groupRange(groups, from);
  return Math.min(Math.max(to, start), end);
}

/** `index` 가 속한 그룹의 `[시작, 끝]` 인덱스(둘 다 포함). */
export function groupRange(
  groups: readonly boolean[],
  index: number,
): readonly [start: number, end: number] {
  const group = groups[index];
  if (group === undefined) return [index, index];

  let start = index;
  while (start > 0 && groups[start - 1] === group) start -= 1;

  let end = index;
  while (end < groups.length - 1 && groups[end + 1] === group) end += 1;

  return [start, end];
}

/**
 * 잡은 항목이 **자기 그룹의 첫/마지막 슬롯 밖으로 나가지 못하게** 이동량을 가둔다.
 *
 * ⚠️ 이게 없으면 자동 스크롤이 폭주한다. CSS 의 스크롤 가능 영역은 자손 박스를
 * **transform 적용 후** 합집합한 것이라, `translateY` 로 내려간 항목이 컨테이너의
 * `scrollHeight` 를 **늘린다**. 그러면
 *   스크롤 → `offsetY` 증가 → 항목이 더 내려감 → `scrollHeight` 증가 → 다시 스크롤
 * 이라는 고리가 닫혀 손을 떼기 전까지 끝없이 스크롤된다(실제 사고).
 *
 * 조작감에도 이쪽이 맞다 — 가두지 않으면 경계를 넘겨도 항목은 계속 손을 따라가는데
 * 놓일 자리는 안 바뀌어서 **손과 결과가 어긋나 보인다.**
 */
export function clampOffset(
  centers: readonly number[],
  groups: readonly boolean[],
  from: number,
  offsetY: number,
): number {
  const origin = centers[from];
  if (origin === undefined) return offsetY;

  const [start, end] = groupRange(groups, from);
  const min = (centers[start] ?? origin) - origin;
  const max = (centers[end] ?? origin) - origin;
  return Math.min(Math.max(offsetY, min), max);
}

/**
 * 드래그 중 각 항목이 **비켜나야 할 거리**(px). 잡은 항목은 여기서 다루지 않는다
 * (그건 손을 따라 `translateY(offsetY)` 로 움직인다).
 *
 * 잡은 항목이 아래로 갈 때 지나온 구간은 위로 한 칸 당겨지고, 위로 갈 때는 아래로 밀린다.
 * 그 결과 잡은 항목이 떠난 자리가 목표 지점으로 따라 이동하며 **빈칸**이 된다.
 *
 * 높이가 균일하다고 본다 — 이 목록의 이름 칸은 `truncate` 라 항상 한 줄이다.
 */
export function shiftFor(index: number, from: number, to: number, rowHeight: number): number {
  if (index === from) return 0;
  if (from < to && index > from && index <= to) return -rowHeight;
  if (to < from && index >= to && index < from) return rowHeight;
  return 0;
}

/**
 * 항목 중앙 y 좌표들 중 주어진 y 에 가장 가까운 슬롯의 인덱스.
 *
 * 항목 높이가 균일하다고 가정하지 않는다 — 실제 좌표를 재서 비교하므로,
 * 문구가 길어 줄바꿈된 행이 섞여도 그대로 동작한다.
 * 목록 위/아래로 벗어나면 자연히 첫/끝 슬롯이 나온다.
 */
export function findDropIndex(centers: readonly number[], y: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  centers.forEach((center, index) => {
    const distance = Math.abs(center - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });

  return best;
}
