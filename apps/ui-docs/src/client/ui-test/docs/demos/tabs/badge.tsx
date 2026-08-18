'use client';

import { Tab, TabList, TabPanel, Tabs } from '@hvy/ui';

/**
 * 탭 뱃지 — 「목록 (32)」 관례의 건수 표시. 톤얼 칩이라 활성/비활성에서 폭이 변하지
 * 않는다(굵기를 올리지 않는 규칙과 같은 이유 — 옆 탭이 밀리면 안 된다).
 */
export function TabsBadgeDemo() {
  return (
    <Tabs defaultValue="all">
      <TabList label="주문 상태별 목록">
        <Tab value="all" badge="128">
          전체
        </Tab>
        <Tab value="pending" badge="32">
          접수
        </Tab>
        <Tab value="shipped" badge="7">
          출고완료
        </Tab>
        <Tab value="canceled" disabled badge="0">
          취소
        </Tab>
      </TabList>
      <TabPanel value="all" className="py-4 text-dl-fg-muted text-dl-sm">
        전체 128건
      </TabPanel>
      <TabPanel value="pending" className="py-4 text-dl-fg-muted text-dl-sm">
        접수 32건
      </TabPanel>
      <TabPanel value="shipped" className="py-4 text-dl-fg-muted text-dl-sm">
        출고완료 7건
      </TabPanel>
      <TabPanel value="canceled" className="py-4 text-dl-fg-muted text-dl-sm">
        취소 0건
      </TabPanel>
    </Tabs>
  );
}
