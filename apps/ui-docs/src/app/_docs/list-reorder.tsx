import type { useListReorder } from '@hvy/ui';
import { ListReorderAxisXDemo } from '../../client/ui-test/docs/demos/list-reorder/axis-x';
import { ListReorderBasicDemo } from '../../client/ui-test/docs/demos/list-reorder/basic';
import { ListReorderGroupsDemo } from '../../client/ui-test/docs/demos/list-reorder/groups';
import { ListReorderKeyboardDemo } from '../../client/ui-test/docs/demos/list-reorder/keyboard';
import { ListReorderPureFnsDemo } from '../../client/ui-test/docs/demos/list-reorder/pure-fns';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { useListReorder, shiftFor } from '@hvy/ui';

const listRef = useRef<HTMLUListElement>(null);
const reorder = useListReorder({
  items,
  onReorder: setItems,
  groupOf: (item) => item.pinned,   // 그룹 구분이 없으면 () => true
  listRef,                          // 자식 순서가 items 와 1:1 이어야 한다
  onAnnounce: (from, to) => setLive(\`\${items[from].name}, \${to + 1}번째로 이동\`),
});

// 잡은 항목은 손을 따라 offsetY 로, 나머지는 shiftFor 로 비켜난다.
<li style={{ transform: \`translateY(\${dragging ? reorder.offsetY : shift}px)\` }}>
  <button onPointerDown={(e) => reorder.handlePointerDown(e, index)} … />
</li>`;

/** 반환 타입·옵션 타입을 훅에서 직접 유도한다 — 개명되면 typecheck 가 표를 깨뜨린다. */
type ReorderOptions = Parameters<typeof useListReorder<{ pinned: boolean }>>[0];
type ReorderResult = ReturnType<typeof useListReorder<{ pinned: boolean }>>;
type HvyUiModule = typeof import('@hvy/ui');

/** useListReorder 문서 — 그리드 전용이 아닌 동작 원시(behavior primitive). */
export const listReorderDoc: DocEntry = {
  slug: 'list-reorder',
  category: 'foundations',
  title: 'useListReorder',
  description:
    '포인터·키보드로 목록 순서를 바꾸는 훅 — **그리드 개념이 들어 있지 않아** 컬럼 설정 모달과 작업 탭 바가 같은 것을 쓴다. 핵심 계약은 하나다: **드래그 중에는 배열을 건드리지 않는다.** 잡은 항목은 transform 으로 손에 1:1 붙고 다른 항목만 비켜나며, 배열은 놓을 때 한 번 바뀐다. 처음에는 pointermove 마다 실제 배열을 바꿨는데 판정 기준이 포인터 y 라 스왑되는 순간 잡은 항목이 포인터 자리로 순간이동하고 다시 스왑돼 떨렸다 — 지금은 기준이 잡은 항목의 중심이라 half-row 히스테리시스가 공짜로 생긴다. 라이브러리를 쓰지 않는 근거는 그쪽이 강한 지점(여러 컨테이너 간 이동·중첩 트리)이 우리에게 없고, 우리 요구(그룹 경계 가두기)는 clampToGroup 한 줄로 끝나기 때문이다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '드래그 재정렬 — 배열은 놓을 때 한 번만 바뀐다',
      note: '검증 포인트 — ① 끄는 동안 항목이 떨리지 않는다: 판정 기준이 포인터 좌표가 아니라 잡은 항목의 중심이라 다른 항목의 중심을 지나야 자리가 바뀐다 ② 잡은 항목은 손에 1:1 로 붙고 transition 이 없다 — 주면 손보다 늦게 따라와 고무줄처럼 늘어진다 ③ 비켜나는 항목만 부드럽게 움직인다 ④ 목록에 스크롤이 생기면 가장자리에서 자동 스크롤이 걸리고 손을 떼면 반드시 멈춘다 ⑤ 잡은 항목은 목록 첫/마지막 슬롯 밖으로 나가지 못한다 — 안 가두면 transform 이 scrollHeight 를 늘려 자동 스크롤이 폭주한다(실제 사고) ⑥ 놓는 순간 배열 변경과 transform 제거가 한 렌더에 반영되어 깜빡임이 없다 ⑦ 아주 빠르게 끌었다 놓아도 이동이 사라지지 않는다 ⑧ 컨테이너 자식 순서가 items 와 1:1 이어야 한다 — 목록 안에 장식용 노드를 하나 끼우면 좌표 배열이 통째로 어긋난다.',
      file: 'src/client/ui-test/docs/demos/list-reorder/basic.tsx',
      Component: ListReorderBasicDemo,
    },
    {
      id: 'keyboard',
      title: '키보드 이동 — 포커스 복원은 호출부 책임',
      note: '검증 포인트 — ① 손잡이가 button 이라 Tab 으로 닿고 ↑↓ 로 한 칸씩 움직인다 ② 왼쪽 목록은 포커스 복원을 일부러 빼 두었다: ↑ 를 두 번 누르면 두 번째가 먹지 않는다(배열이 바뀌며 DOM 이 새로 그려져 포커스가 body 로 떨어진다). 오른쪽 목록은 복원이 있어 연타가 된다 ③ 훅은 옮겨진 인덱스를 돌려줄 뿐 포커스를 직접 옮기지 않는다 — 왜 그 배선이 호출부에 필요한지 두 목록을 나란히 두고 본다 ④ 이동마다 onAnnounce 가 불려 아래 안내 줄이 갱신된다(드래그와 키보드가 공유하는 지점이다) ⑤ 키보드 이동도 그룹 경계를 지킨다.',
      file: 'src/client/ui-test/docs/demos/list-reorder/keyboard.tsx',
      Component: ListReorderKeyboardDemo,
    },
    {
      id: 'groups',
      title: 'groupOf — 그룹 경계에서 멈춘다',
      note: '검증 포인트 — ① 고정(자물쇠) 항목은 앞쪽 구간, 일반 항목은 뒤쪽 구간 안에서만 움직인다 ② 경계를 넘겨 끌어도 **아무 일도 안 일어나는 게 아니라 경계까지 따라오다 멈춘다** — 드래그는 여러 칸을 한 번에 건너뛰므로 "다르면 무시" 로 처리하면 고장난 것처럼 보인다 ③ 키보드도 같은 규칙이다(clampToGroup 을 드래그와 공유한다) ④ 그룹 구분이 필요 없으면 () => true 를 넘긴다(기본 예제가 그 경우다) ⑤ 실제 소비처 둘이 이 표식을 어떻게 쓰는지: 컬럼 설정은 pinned, 작업 탭 바는 tab.pinned 다 ⑥ 아래 배지가 고정 구간이 앞쪽 연속임을 계속 확인한다.',
      file: 'src/client/ui-test/docs/demos/list-reorder/groups.tsx',
      Component: ListReorderGroupsDemo,
    },
    {
      id: 'axis-x',
      title: 'axis="x" — 가로 목록',
      note: '작업 탭 바가 쓰는 축이다. 검증 포인트 — ① 좌우로 끌어 순서가 바뀐다 ② 반환 필드 이름은 그대로 offsetY·rowHeight 지만 x 축에서는 각각 **가로 이동량과 항목 폭**을 담는다(첫 소비자인 세로 목록 기준 이름이다 — 화면의 값 표시로 확인) ③ 순수 계산 쪽은 좌표 배열만 다뤄 축을 모른다 — 축을 타는 것은 측정뿐이다 ④ **항목 사이에 gap 을 준 목록에서는 비켜나는 거리가 rowHeight + gap 이어야 한다**: 「gap 8px 주기」를 켜고 「shiftFor 에 gap 보정」을 끄면 화면은 멀쩡한 채 드래그할 때만 어긋나는 것을 직접 만들어 볼 수 있다. WorkTabsBar 의 CHIP_GAP_PX 가 이 짝이고, 지금 0 인 이유도 그 때문이다 ⑤ 가로 자동 스크롤도 세로와 같은 코드다(scrollLeft 로 갈릴 뿐).',
      file: 'src/client/ui-test/docs/demos/list-reorder/axis-x.tsx',
      Component: ListReorderAxisXDemo,
    },
    {
      id: 'pure-fns',
      title: '순수 함수 4종 — 계산만 본다',
      note: 'DOM 없이 계산만 본다 — 이 레포의 vitest 환경이 node 라 이 함수들에만 단위 테스트가 붙어 있는 것과 같은 이유다(틀려도 에러가 안 나고 항목만 엉뚱한 곳에 놓인다). 검증 포인트 — ① moveItem 은 원본을 건드리지 않고 from === to 면 같은 참조를 돌려준다 ② clampToGroup 은 목표를 자기 그룹의 [시작, 끝] 안으로 자른다 ③ findDropIndex 는 항목 높이가 균일하지 않아도 실제 중심 좌표로 판정한다 — 슬라이더로 포인터 y 를 훑어 간격이 50·80·50·50 으로 들쭉날쭉한 목록에서도 맞는지 본다 ④ shiftFor 는 잡은 항목(index === from)에 0 을 주고 지나온 구간만 한 칸 당기거나 민다 — 그래서 떠난 자리가 목표 지점으로 따라 이동하며 빈칸이 된다.',
      file: 'src/client/ui-test/docs/demos/list-reorder/pure-fns.tsx',
      Component: ListReorderPureFnsDemo,
    },
  ],
  propsTables: [
    {
      title: 'useListReorder(options)',
      rows: definePropRows<ReorderOptions>()([
        {
          name: 'items',
          type: 'readonly T[]',
          required: true,
          description: '현재 목록. 드래그 중에는 이 배열이 바뀌지 않는다 — 놓을 때 한 번만 바뀐다.',
        },
        {
          name: 'onReorder',
          type: '(next: readonly T[]) => void',
          required: true,
          description: '확정된 새 배열 — 드래그를 놓거나 키보드로 옮길 때 불린다.',
        },
        {
          name: 'groupOf',
          type: '(item: T) => boolean',
          required: true,
          description:
            '항목이 속한 그룹 표식. 같은 그룹 안에서만 움직인다 — 컬럼 설정은 pinned, 작업 탭 바는 tab.pinned 를 넘긴다. **그룹 구분이 필요 없으면 `() => true`.**',
        },
        {
          name: 'listRef',
          type: 'RefObject<HTMLElement | null>',
          required: true,
          description:
            '스크롤되는 목록 컨테이너. **자식 순서가 items 와 1:1 이어야 한다** — 장식용 노드를 하나 끼우면 좌표 배열이 통째로 어긋난다.',
        },
        {
          name: 'onAnnounce',
          type: '(from: number, to: number) => void',
          description:
            '이동 확정 시 호출(드래그·키보드 공통) — 스크린리더 안내를 붙이는 자리다. 드래그는 순전히 시각적 조작이라 이게 없으면 화면을 못 보는 사용자에게는 아무 일도 없던 것과 같다.',
        },
        {
          name: 'axis',
          type: "'x' | 'y'",
          defaultValue: "'y'",
          description:
            '주축. 가로 목록(작업 탭 바)은 x 를 넘긴다 — **축을 타는 것은 측정뿐**이고 순수 계산은 좌표 배열만 다룬다.',
        },
      ]),
    },
    {
      title: 'useListReorder — 반환',
      rows: definePropRows<ReorderResult>()([
        {
          name: 'draggingIndex',
          type: 'number | null',
          description: '지금 끌고 있는 항목의 인덱스.',
        },
        { name: 'dropIndex', type: 'number | null', description: '지금 놓으면 갈 자리.' },
        {
          name: 'offsetY',
          type: 'number',
          description:
            '잡은 항목의 이동량(px). **axis="x" 에서는 가로 이동량**이다 — 이름은 첫 소비자(세로 목록) 기준이라 그대로 두었다.',
        },
        {
          name: 'rowHeight',
          type: 'number',
          description:
            '비켜나는 거리 계산용(shiftFor 의 마지막 인자). **axis="x" 에서는 항목 폭**이다. 목록에 gap 이 있으면 `rowHeight + gap` 을 넘겨야 한다 — 안 맞추면 화면은 멀쩡한 채 드래그할 때만 어긋난다.',
        },
        {
          name: 'handlePointerDown',
          type: '(event, index) => void',
          description: '손잡이의 onPointerDown 에 배선한다.',
        },
        { name: 'handlePointerMove', type: '(event) => void', description: '' },
        { name: 'handlePointerUp', type: '(event) => void', description: '' },
        {
          name: 'moveByKeyboard',
          type: '(index: number, direction: -1 | 1) => number',
          description:
            '키보드 한 칸 이동 — **옮겨진 인덱스를 돌려준다.** 포커스를 따라 보내는 것은 호출부 몫이다(배열이 바뀌면 DOM 이 새로 그려져 포커스가 떨어진다).',
        },
      ]),
    },
    {
      title: '순수 함수 (dnd/listReorder)',
      rows: definePropRows<HvyUiModule>()([
        {
          name: 'moveItem',
          type: '(list, from, to) => readonly T[]',
          description:
            'from 의 항목을 빼내 to 자리에 끼운다. 원본을 건드리지 않고, from === to 면 같은 참조.',
        },
        {
          name: 'clampToGroup',
          type: '(groups, from, to) => number',
          description:
            '목표 인덱스를 자기 그룹 안으로 **가둔다**. 막는 게 아닌 이유: 드래그는 여러 칸을 건너뛰므로 "다르면 무시" 면 아무 일도 안 일어나 고장처럼 보인다.',
        },
        {
          name: 'findDropIndex',
          type: '(centers, y) => number',
          description:
            '중심 좌표들 중 y 에 가장 가까운 슬롯. **높이가 균일하다고 가정하지 않는다** — 줄바꿈된 행이 섞여도 동작한다.',
        },
        {
          name: 'shiftFor',
          type: '(index, from, to, rowHeight) => number',
          description:
            '드래그 중 각 항목이 비켜날 거리. 잡은 항목은 0 이고 지나온 구간만 한 칸 당기거나 민다 — 그래서 떠난 자리가 목표 지점으로 따라 이동하며 빈칸이 된다.',
        },
      ]),
    },
  ],
};
