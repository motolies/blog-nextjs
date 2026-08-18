import type { Tab, TabList, Tabs } from '@hvy/ui';
import { Box } from 'lucide-react';
import type { ComponentProps } from 'react';
import { TabsBadgeDemo } from '../../client/ui-test/docs/demos/tabs/badge';
import { TabsBasicDemo } from '../../client/ui-test/docs/demos/tabs/basic';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Tab, TabList, TabPanel, Tabs } from '@hvy/ui';

<Tabs value={tab} onValueChange={setTab}>   // URL 연동은 useSearchParams 로 앱이 배선
  <TabList label="주문 상세 탭">
    <Tab value="summary" icon={Box}>요약</Tab>
    <Tab value="history">이력</Tab>
  </TabList>
  <TabPanel value="summary">…</TabPanel>
  <TabPanel value="history">…</TabPanel>
</Tabs>`;

/** Tabs 문서 — QA filter-tab-menu, URL 을 모르는 controlled 컴포넌트. */
export const tabsDoc: DocEntry = {
  slug: 'tabs',
  category: 'components',
  title: 'Tabs',
  description:
    'Radix Tabs 기반 — 키보드(화살표 이동·roving tabindex)와 aria 배선이 붙어 있다. URL 을 모르는 controlled 컴포넌트라 "URL 이 진실 소스" 규칙의 URL 연동은 앱이 useSearchParams 로 배선한다. 이 문서 페이지의 Preview/Code 전환도 이 컴포넌트다(도그푸딩).',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: 'Tabs',
      note: 'QA filter-tab-menu — 활성 탭은 검정 글자 + primary 아이콘 + 하단 3px primary 라인. 화살표 키로 탭 사이를 이동한다.',
      file: 'src/client/ui-test/docs/demos/tabs/basic.tsx',
      Component: TabsBasicDemo,
    },
    {
      id: 'badge',
      title: '탭 뱃지 — 건수 표시',
      note: '「목록 (32)」 관례. 톤얼 칩이라 활성/비활성에서 폭이 변하지 않는다(활성이어도 weight 를 올리지 않는 규칙과 같은 이유 — 옆 탭이 밀리면 안 된다). 숫자 포맷(천단위 등)은 앱 몫이다. 닫기 버튼은 여기 없다 — 닫히는 탭은 WorkTabsBar 소관(시각 언어가 다르다).',
      file: 'src/client/ui-test/docs/demos/tabs/badge.tsx',
      Component: TabsBadgeDemo,
    },
  ],
  propsTables: [
    {
      title: 'Tabs',
      rows: definePropRows<ComponentProps<typeof Tabs>>()([
        {
          name: 'value',
          type: 'string',
          description: 'controlled 값 — URL 연동 시 이걸 쓴다.',
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: 'uncontrolled 시작 값.',
        },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          description: '탭 전환 콜백.',
        },
      ]),
    },
    {
      title: 'TabList',
      rows: definePropRows<ComponentProps<typeof TabList>>()([
        {
          name: 'label',
          type: 'string',
          description: '탭 묶음의 이름 — 스크린리더가 "무슨 탭들인지" 먼저 읽는다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '묶음의 모든 Tab 에 내려간다 — 기본 md 가 QA h48 이다.',
        },
      ]),
    },
    {
      title: 'Tab',
      rows: definePropRows<ComponentProps<typeof Tab>>()([
        {
          name: 'value',
          type: 'string',
          required: true,
          description: '이 탭이 활성일 때의 Tabs 값.',
        },
        {
          name: 'icon',
          type: 'IconName',
          description: '라벨 왼쪽 아이콘 — 활성이면 primary 색.',
        },
        {
          name: 'badge',
          type: 'ReactNode',
          description:
            '라벨 뒤 건수 칩 — 「목록 (32)」 관례. 숫자 포맷은 앱 몫이고, 닫기 버튼은 WorkTabsBar 소관이라 여기 없다.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: '비활성 탭.',
        },
      ]),
    },
  ],
};
