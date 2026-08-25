import type { WorkTab, WorkTabsBar, WorkTabsLabels } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { WorkTabsBasicDemo } from '../../client/ui-test/docs/demos/work-tabs/basic';
import { WorkTabsContextMenuDemo } from '../../client/ui-test/docs/demos/work-tabs/context-menu';
import { WorkTabsOverflowDemo } from '../../client/ui-test/docs/demos/work-tabs/overflow';
import { WorkTabsPinReorderDemo } from '../../client/ui-test/docs/demos/work-tabs/pin-reorder';
import { WorkTabsStateFnsDemo } from '../../client/ui-test/docs/demos/work-tabs/state-fns';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { WorkTabsBar, upsertTab } from '@hvy/ui';

// 내비게이션이 곧 탭 열기다 — 앱이 pathname 변화를 관찰해 upsert 한다.
// 「목록」 앵커 탭은 pinned + closable:false 로 만든다.
useEffect(() => {
  if (!activeId) return;
  setTabs((cur) => upsertTab(cur, { id: activeId, href, title }, Date.now(), LOCAL_TABS_MAX));
}, [activeId, href, title]);

<WorkTabsBar
  tabs={tabs}
  activeId={activeId}          // 진실은 현재 pathname — 앱이 판정
  labels={LABELS}
  onSelect={(tab) => router.push(tab.href)}
  onClose={...} onCloseOthers={...} onCloseRight={...} onCloseUnpinned={...}
  onTogglePin={...} onReorder={setTabs}
/>`;

/**
 * 상태 순수 함수 표의 행 이름을 barrel export 이름으로 강제한다.
 *
 * `definePropRows<P>()` 는 `keyof P & string` 만 요구하므로 P 에 **모듈 타입**을 줄 수 있다 —
 * 함수가 개명·삭제되면 typecheck 가 표의 부패를 잡는다. `typeof import(...)` 는 타입 위치의
 * 표현식이라 런타임 import 가 생기지 않는다(문서 정의 파일의 'use client' 금지와 무관하다).
 */
type HvyUiModule = typeof import('@hvy/ui');

/** WorkTabsBar 문서 — QA 헤더 탭 메뉴(칩형), URL 을 모르는 controlled 컴포넌트. */
export const workTabsDoc: DocEntry = {
  slug: 'work-tabs',
  category: 'components',
  title: 'WorkTabs',
  description:
    'QA 헤더 탭 메뉴(.tab-menu-*) 규격의 칩형 탭 바 — 전역 크롬이 아니라 **메뉴 내 로컬 상세 탭** 용도다(「목록 | 상세1 | 상세2」, 한 화면 = 한 메뉴 = 공유 가능한 GET URL 원칙과 정합). 「목록」 앵커는 pinned + closable:false 로 고정한다. 그리드 탭(Tabs, filter-tab-menu 밑줄형)과 QA 가 따로 설계한 다른 규격이며, Radix Tabs 를 쓰지 않는 이유: 트리거가 button 이라 닫기 버튼 중첩이 HTML 불법이고 "활성 = 현재 URL" 인 내비게이션 모델이라 근본이 다르다. 탭은 URL 라우트의 별칭일 뿐이며(iframe 아님) 라우터 배선은 앱이 한다. 탭 목록은 세션 휘발 — 영속하지 않는다. 바는 그리기만 하고 **계산은 전부 순수 함수 9종**에 있다(맨 아래 예제).',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '기본 — 앵커 탭과 열고 닫기',
      note: '검증 포인트 — ① 「목록」 앵커 탭(pinned + closable:false)에는 닫기 버튼도 자물쇠도 없고, 우클릭 메뉴에서도 "닫기"·"핀 고정"이 빠진다 — 자물쇠는 "사용자가 고정했다"는 뜻이라 시스템 앵커에는 거짓말이 된다 ② 상세를 열면 앵커 오른쪽에 탭이 생기고, 같은 글을 다시 열면 새 탭이 생기지 않고 기존 탭의 href·title 만 갱신된다(upsertTab — 내비게이션이 곧 탭 열기라 중복 방지가 별도 검사 없이 성립한다) ③ 활성 탭을 닫으면 오른쪽 이웃으로, 없으면 왼쪽으로 이동한다(브라우저 탭과 같은 규칙 — 이 이동은 컴포넌트가 아니라 앱 책임이다) ④ 상한(10)에 도달하면 새 탭이 열리지 않고 토스트만 뜬다 — 열어 둔 탭을 시스템이 대신 닫지 않는다(퇴출이 아니라 거부다).',
      file: 'src/client/ui-test/docs/demos/work-tabs/basic.tsx',
      Component: WorkTabsBasicDemo,
    },
    {
      id: 'overflow',
      title: '오버플로 — 스크롤 컨트롤과 전체 목록',
      note: '좁은 컨테이너에 탭 12개를 미리 채워 둔 데모다. 검증 포인트 — ① 넘칠 때만 좌우 화살표가 나타나고, 우하단 핸들로 상자를 넓혀 넘치지 않게 만들면 사라진다 ② 스크롤바는 숨겨져 있고 화살표·휠로만 움직인다 ③ 전체 목록(≡)에서 화면 밖 탭을 고르면 그 탭이 보이는 곳까지 자동으로 스크롤된다 — 이게 없으면 드롭다운으로 고른 탭이 화면 밖에 남아 아무 일도 안 한 것처럼 보인다 ④ 활성 칩은 굵은 글자 + 하단 3px primary 라인이다. 데모를 캔버스 배경 위에 놓은 이유가 여기 있다 — 흰 배경에서는 "칩이 배경과 구별되는가"를 대조할 수 없어 거짓말이 된다.',
      file: 'src/client/ui-test/docs/demos/work-tabs/overflow.tsx',
      Component: WorkTabsOverflowDemo,
    },
    {
      id: 'pin-reorder',
      title: '핀 고정과 드래그 재정렬 — 핀 구간을 넘지 않는다',
      note: '검증 포인트 — ① 우클릭 → 핀 고정하면 탭이 핀 그룹의 끝으로, 해제하면 비핀 그룹의 앞으로 이동한다(둘 다 경계에 붙으므로 탭이 화면에서 멀리 점프하지 않는다) ② 비핀 탭을 핀 구간 왼쪽으로 끌어도 경계에서 멈춘다 — 아무 일도 안 일어나는 게 아니라 경계까지 따라오다 멈춘다(드래그는 여러 칸을 한 번에 건너뛰므로 "다르면 무시"로 처리하면 고장난 것처럼 보인다) ③ 드래그 중에는 배열이 바뀌지 않는다: 잡은 칩만 손을 따라오고 나머지는 칩 폭만큼 비켜나며, 배열은 놓을 때 한 번 바뀐다 ④ 4px 을 움직이기 전에는 드래그가 시작되지 않는다 — 여기가 깨지면 포인터 캡처가 click 을 li 로 재타게팅해 탭 클릭이 통째로 죽는다(실측 버그). 살짝 눌렀다 떼면 활성 전환이, 끌면 재정렬이 되는지 둘 다 확인할 것 ⑤ 아래 핀 표식 줄이 앞쪽 연속 구간을 유지하는지 본다 — 중간에 끊기면 불변식이 깨진 것이다.',
      file: 'src/client/ui-test/docs/demos/work-tabs/pin-reorder.tsx',
      Component: WorkTabsPinReorderDemo,
    },
    {
      id: 'context-menu',
      title: '컨텍스트 메뉴와 일괄 닫기 — 확인 모달을 거치는 것',
      note: '검증 포인트 — ① 탭 우클릭 메뉴 4항목(닫기 · 다른 탭 모두 닫기 · 오른쪽 탭 닫기 · 핀 고정/해제) ② 앵커 탭에서는 자기 닫기·핀이 빠지고 다른 탭을 닫는 항목은 그대로 남는다 ③ closeOthers·closeRightOf 는 핀 탭을 남긴다 — 지목한 탭이 사라지지 않는 것과 핀이 보호되는 것을 각각 확인 ④ 우측 ×(핀 제외 전체 닫기)는 되돌릴 수 없어 확인 모달을 거치고 확인 버튼이 danger 다. 상위에 ConfirmProvider 가 없으면 경고만 뜨고 취소로 처리되어 버튼이 고장난 것처럼 보인다(문서 셸이 감싸고 있다) ⑤ 일괄 닫기로 활성 탭이 사라지면 앵커로 되돌아간다.',
      file: 'src/client/ui-test/docs/demos/work-tabs/context-menu.tsx',
      Component: WorkTabsContextMenuDemo,
    },
    {
      id: 'state-fns',
      title: '상태 순수 함수 9종 — 화면 없이 계산만 본다',
      note: 'WorkTabsBar 는 계산을 전혀 하지 않는다 — 탭 배열을 만드는 것은 이 함수들이고, 그래서 vitest(환경 node, DOM 없음)로 단위 테스트가 붙는 유일한 계층이다. 검증 포인트 — ① upsertTab 은 내용이 그대로면 같은 참조를 돌려준다(참조 배지로 확인 — tabs 의존 effect 안에서 불러도 무한 루프가 없는 근거다) ② 상한에 걸린 upsertTab 은 원본을 그대로 돌려주고(거부), canOpenTab 이 그 판정을 미리 노출한다 — 알림은 순수 계층이 내지 않으므로 토스트는 호출부 몫이다 ③ 「입력에 togglePin 적용」을 눌러 핀 표식이 앞쪽 연속 구간을 유지하는지 본다(위반하면 붉게 표시) ④ closeOthers·closeRightOf·closeUnpinned 는 전부 핀 탭을 남긴다 ⑤ nextActiveAfterClose 는 오른쪽 → 왼쪽 → null 순이다 ⑥ WORK_TABS_MAX 는 전역 상한이고 메뉴 스코프 로컬 탭은 더 좁은 값을 인자로 넘겨 쓴다.',
      file: 'src/client/ui-test/docs/demos/work-tabs/state-fns.tsx',
      Component: WorkTabsStateFnsDemo,
    },
  ],
  propsTables: [
    {
      title: 'WorkTabsBar',
      rows: definePropRows<ComponentProps<typeof WorkTabsBar>>()([
        {
          name: 'tabs',
          type: 'readonly WorkTab[]',
          required: true,
          description:
            '탭 컬렉션 — 순수 함수(upsertTab·closeTab·togglePin 등)로 계산해 넘긴다. 핀 탭이 앞쪽 연속 구간이라는 불변식을 유지한다.',
        },
        {
          name: 'activeId',
          type: 'string | null',
          required: true,
          description: '활성 탭 id — 진실은 현재 pathname 이고 앱이 판정해 내려준다.',
        },
        {
          name: 'labels',
          type: 'WorkTabsLabels',
          required: true,
          description:
            '전 문구 주입 — ui 는 사전을 모른다. reorderDone 은 드래그 결과 스크린리더 안내.',
        },
        {
          name: 'onSelect',
          type: '(tab: WorkTab) => void',
          required: true,
          description: '탭 선택 — 앱이 router.push(tab.href) 로 배선한다.',
        },
        {
          name: 'onClose',
          type: '(id: string) => void',
          required: true,
          description:
            '탭 닫기 — 활성 탭이 닫힌 뒤의 이동은 앱 책임(nextActiveAfterClose 로 이웃을 구한다).',
        },
        {
          name: 'onCloseOthers',
          type: '(id: string) => void',
          required: true,
          description: '지목한 탭과 핀 탭만 남긴다 — closeOthers 순수 함수와 짝이다.',
        },
        {
          name: 'onCloseRight',
          type: '(id: string) => void',
          required: true,
          description: '오른쪽 비핀 탭을 닫는다 — closeRightOf 와 짝이다.',
        },
        {
          name: 'onCloseUnpinned',
          type: '() => void',
          required: true,
          description:
            '핀 제외 전체 닫기 — 우측 컨트롤 버튼. 되돌릴 수 없어 확인 모달을 거치므로 상위에 ConfirmProvider 가 필요하다.',
        },
        {
          name: 'onTogglePin',
          type: '(id: string) => void',
          required: true,
          description: '핀 고정/해제 — togglePin 이 핀 그룹 경계(앞쪽 연속 구간)를 유지한다.',
        },
        {
          name: 'onReorder',
          type: '(next: readonly WorkTab[]) => void',
          required: true,
          description: '드래그 순서 변경 확정 — 핀 탭은 clampToGroup 이 핀 구간에 가둔다.',
        },
        {
          name: 'className',
          type: 'string',
          description:
            '바 바깥 여백·배경. 실제 앱에서 바는 캔버스(회색) 위에 놓이므로 문서 데모도 같은 배경을 준다 — 흰 배경이면 "칩이 배경과 구별되는가"를 대조할 수 없다.',
        },
      ]),
    },
    {
      title: 'WorkTab',
      rows: definePropRows<WorkTab>()([
        {
          name: 'id',
          type: 'string',
          required: true,
          description: '메뉴 라우트 — 탭의 정체성이자 중복 판정 키다.',
        },
        {
          name: 'href',
          type: 'string',
          required: true,
          description: '마지막으로 방문한 URL(pathname+query) — 탭 복귀 시 여기로 이동한다.',
        },
        {
          name: 'title',
          type: 'string',
          required: true,
          description: '이미 해석된 표시 문자열 — 이 패키지는 사전을 모른다.',
        },
        {
          name: 'pinned',
          type: 'boolean',
          required: true,
          description: '핀 고정 — 일괄 닫기로부터 보호된다.',
        },
        {
          name: 'closable',
          type: 'boolean',
          defaultValue: 'true',
          description:
            'false 는 「목록」처럼 바 자체의 앵커다 — 닫기 버튼·닫기 메뉴·핀 UI 를 모두 숨긴다. 일괄 닫기로부터의 보호는 pinned 가 맡으므로 앵커는 pinned: true 와 함께 쓴다.',
        },
        {
          name: 'lastActivatedAt',
          type: 'number',
          required: true,
          description:
            '마지막 활성화 시각(epoch ms). upsertTab 이 href·title 이 실제로 바뀔 때만 갱신한다 — 내용이 같으면 같은 참조를 돌려주는 성질의 대가다.',
        },
      ]),
    },
    {
      title: 'WorkTabsLabels — 전 문구 주입',
      rows: definePropRows<WorkTabsLabels>()([
        {
          name: 'tabBar',
          type: 'string',
          required: true,
          description: 'nav aria-label — 스크린리더가 "무슨 영역인지" 먼저 읽는다.',
        },
        { name: 'close', type: 'string', required: true, description: '닫기 버튼·메뉴 항목.' },
        { name: 'closeOthers', type: 'string', required: true, description: '컨텍스트 메뉴 항목.' },
        { name: 'closeRight', type: 'string', required: true, description: '컨텍스트 메뉴 항목.' },
        {
          name: 'closeUnpinned',
          type: 'string',
          required: true,
          description: '우측 × 컨트롤 버튼.',
        },
        {
          name: 'closeUnpinnedConfirm',
          type: 'string',
          required: true,
          description:
            '핀 제외 전체 닫기의 확인 모달 메시지 — 되돌릴 수 없는 일괄 동작이라 한 번 묻는다. useConfirm() 으로 띄우므로 **상위에 ConfirmProvider 가 있어야 한다**(없으면 경고 후 취소로 처리되어 버튼이 동작하지 않는 것처럼 보인다).',
        },
        { name: 'pin', type: 'string', required: true, description: '핀 고정 메뉴 항목.' },
        { name: 'unpin', type: 'string', required: true, description: '핀 해제 메뉴 항목.' },
        {
          name: 'listMenu',
          type: 'string',
          required: true,
          description: '전체 탭 목록(≡) 드롭다운 트리거.',
        },
        { name: 'scrollPrev', type: 'string', required: true, description: '왼쪽 스크롤 버튼.' },
        { name: 'scrollNext', type: 'string', required: true, description: '오른쪽 스크롤 버튼.' },
        {
          name: 'reorderDone',
          type: '(title, position, total) => string',
          description:
            '드래그·키보드 재정렬 결과의 sr-only aria-live 안내 — 주지 않으면 안내를 생략한다.',
        },
      ]),
    },
    {
      title: '상태 순수 함수 (workTabsState)',
      rows: definePropRows<HvyUiModule>()([
        {
          name: 'WORK_TABS_MAX',
          type: 'number',
          defaultValue: '20',
          description:
            '전역 탭 개수 상한. 도달하면 새 탭이 열리지 않는다 — 자동 퇴출이 아니라 거부다(열어 둔 탭을 시스템이 닫으면 작업 맥락이 조용히 사라진다). 메뉴 스코프 로컬 탭은 더 좁은 값을 인자로 넘긴다.',
        },
        {
          name: 'canOpenTab',
          type: '(tabs, id, max?) => boolean',
          description:
            '이 id 로 탭을 열 수 있는가 — 이미 열려 있으면 언제나 true, 신규는 상한 미만일 때만. 호출부가 이걸로 거부를 감지해 토스트를 띄운다(순수 계층은 알림을 내지 않는다).',
        },
        {
          name: 'upsertTab',
          type: '(tabs, entry, now, max?) => readonly WorkTab[]',
          description:
            '열거나(없으면 추가) 갱신한다(있으면 href·title·시각). **내용 변화가 없으면 같은 참조를 돌려준다** — tabs 의존 effect 안에서 불러도 참조 동일성으로 수렴한다. 상한을 넘으면 원본을 그대로 반환(거부).',
        },
        {
          name: 'closeTab',
          type: '(tabs, id) => readonly WorkTab[]',
          description: '명시적 의도이므로 핀 여부와 무관하다(핀 탭은 UI 가 닫기 버튼을 숨긴다).',
        },
        {
          name: 'closeOthers',
          type: '(tabs, id) => readonly WorkTab[]',
          description: '지목한 탭과 핀 탭만 남긴다.',
        },
        {
          name: 'closeRightOf',
          type: '(tabs, id) => readonly WorkTab[]',
          description: '지목한 탭의 오른쪽 비핀 탭을 닫는다.',
        },
        {
          name: 'closeUnpinned',
          type: '(tabs) => readonly WorkTab[]',
          description: '핀 제외 전체 닫기. 활성 탭이 닫혔다면 이동은 앱 책임이다.',
        },
        {
          name: 'togglePin',
          type: '(tabs, id) => readonly WorkTab[]',
          description:
            '**핀 그룹이 앞쪽 연속 구간**이라는 불변식을 지킨다 — 고정은 핀 그룹 끝으로, 해제는 비핀 그룹 앞으로. 둘 다 경계에 붙으므로 탭이 멀리 점프하지 않는다.',
        },
        {
          name: 'nextActiveAfterClose',
          type: '(tabs, closedId) => WorkTab | null',
          description:
            '오른쪽 우선, 없으면 왼쪽, 남은 탭이 없으면 null — 브라우저 탭과 같은 규칙이다.',
        },
      ]),
    },
  ],
};
