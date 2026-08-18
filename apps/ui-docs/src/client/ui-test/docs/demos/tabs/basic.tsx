'use client';

import { Tab, TabList, TabPanel, Tabs } from '@hvy/ui';
import { Box, Package } from 'lucide-react';

/**
 * Tabs — QA filter-tab-menu. 활성 탭은 검정 글자 + primary 아이콘 + 하단 3px primary 라인.
 * URL 을 모르는 controlled 컴포넌트라 URL 연동은 앱이 useSearchParams 로 배선한다.
 */
export function TabsBasicDemo() {
  return (
    <Tabs defaultValue="pane-1">
      <TabList label="탭 데모">
        <Tab value="pane-1" icon={Box}>
          탭메뉴1
        </Tab>
        <Tab value="pane-2" icon={Package}>
          탭메뉴2
        </Tab>
        <Tab value="pane-3" icon={Package} disabled>
          비활성 탭
        </Tab>
      </TabList>
      <TabPanel value="pane-1" className="p-4 text-dl-sm text-dl-fg-muted">
        판넬1 컨텐츠
      </TabPanel>
      <TabPanel value="pane-2" className="p-4 text-dl-sm text-dl-fg-muted">
        판넬2 컨텐츠
      </TabPanel>
      <TabPanel value="pane-3" className="p-4 text-dl-sm text-dl-fg-muted">
        판넬3 컨텐츠
      </TabPanel>
    </Tabs>
  );
}
