import type { WorkTabsBar } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { WorkTabsBasicDemo } from '../../client/ui-test/docs/demos/work-tabs/basic';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { WorkTabsBar, upsertTab } from '@hvy/ui';

// 내비게이션이 곧 탭 열기다 — 앱이 pathname 변화를 관찰해 upsert 한다.
// (실제 배선: apps/oms/src/client/orders/orders-local-tabs.tsx — 메뉴 스코프 로컬 탭)
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

/** WorkTabsBar 문서 — QA 헤더 탭 메뉴(칩형), URL 을 모르는 controlled 컴포넌트. */
export const workTabsDoc: DocEntry = {
  slug: 'work-tabs',
  category: 'components',
  title: 'WorkTabs',
  description:
    'QA 헤더 탭 메뉴(.tab-menu-*) 규격의 칩형 탭 바 — 전역 크롬이 아니라 **메뉴 내 로컬 상세 탭** 용도다(「목록 | 상세1 | 상세2」, 한 화면 = 한 메뉴 = 공유 가능한 GET URL 원칙과 정합). 「목록」 앵커는 pinned + closable:false 로 고정한다. 그리드 탭(Tabs, filter-tab-menu 밑줄형)과 QA 가 따로 설계한 다른 규격이며, Radix Tabs 를 쓰지 않는 이유: 트리거가 button 이라 닫기 버튼 중첩이 HTML 불법이고 "활성 = 현재 URL" 인 내비게이션 모델이라 근본이 다르다. 탭은 URL 라우트의 별칭일 뿐이며(iframe 아님) 라우터 배선은 앱이 한다. 탭 목록은 세션 휘발 — 영속하지 않는다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: 'WorkTabsBar',
      note: '검증 포인트 — ① 「목록」 앵커 탭(closable:false)에는 닫기 버튼·핀 메뉴·자물쇠가 없다 ② 상세 탭을 여러 개 열고 닫기 — 활성 탭을 닫으면 오른쪽 이웃(없으면 목록)으로 이동한다 ③ 탭이 넘치면 좌우 스크롤 + prev/next 버튼 ④ 우클릭 컨텍스트 메뉴(닫기·다른 탭·오른쪽·핀) ⑤ 드래그 순서 변경 — 핀 탭은 핀 구간 안에서만 움직인다 ⑥ 로컬 상한(10) 도달 시 새 탭이 열리지 않고 토스트로 안내한다 ⑦ 핀 제외 전체 닫기는 확인 모달(useConfirm, 파괴적 Danger 버튼)을 거친다 — 상위 ConfirmProvider 필수.',
      file: 'src/client/ui-test/docs/demos/work-tabs/basic.tsx',
      Component: WorkTabsBasicDemo,
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
          name: 'onCloseUnpinned',
          type: '() => void',
          required: true,
          description: '핀 제외 전체 닫기 — 우측 컨트롤 버튼. closeUnpinned 순수 함수와 짝이다.',
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
      ]),
    },
  ],
};
