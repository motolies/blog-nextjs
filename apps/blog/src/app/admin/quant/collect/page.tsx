'use client';

import { Tab, TabList, TabPanel, Tabs } from '@hvy/ui';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import { CheckpointTab } from '@/components/quant/collect/CheckpointTab';
import { CollectRunsTab } from '@/components/quant/collect/CollectRunsTab';
import { ManualTriggerTab } from '@/components/quant/collect/ManualTriggerTab';
import { useSearchParamsPatch } from '@/hooks/useSearchParamState';
import { COLLECT_TABS, type CollectTab, resolveTab } from '@/lib/quant/routes';

/**
 * 주식 수집 관리(/admin/quant/collect) — 탭 3개: 실행 이력(M2) · 수동 실행(M3) · 체크포인트(M3).
 *
 * `@hvy/ui` Tabs 는 URL 을 모르는 controlled 전용이라 `?tab=` 을 여기서 배선한다(즐겨찾기의 로컬 state 와 다르다 —
 * 409 토스트·Slack 딥링크가 `?tab=runs&run=` 으로 들어온다). 모르는 값은 `resolveTab` 이 `runs` 로 되돌린다.
 *
 * 높이 사슬: admin-page-frame--fixed → admin-workspace → Tabs(flex col, min-h-0) → TabPanel(flex min-h-0 flex-1 flex-col)
 * → admin-table-shell → DataGrid maxHeight="fill". 어느 한 칸이 빠지면 조용히 auto 가 된다(DataGrid 헤더 주석).
 * TabList 는 overflow 처리가 없어 `overflow-x-auto` 를 직접 준다 — 375px 에서 탭 3개가 넘치면 스크롤로도 못 본다(즐겨찾기 선례).
 */
export default function CollectAdminPage() {
  // useSearchParams 는 Suspense 경계를 요구한다 — 빌드 타임 CSR bailout 오류를 미리 막는다
  return (
    <Suspense fallback={null}>
      <CollectAdmin />
    </Suspense>
  );
}

function CollectAdmin() {
  const tabParam = useSearchParams().get('tab');
  const patchParams = useSearchParamsPatch();
  const tab = resolveTab<CollectTab>(tabParam, COLLECT_TABS, 'runs');

  return (
    <AdminPageFrame className="admin-page-frame--fixed">
      <Tabs
        value={tab}
        // 탭을 떠나면 열린 상세(`?run=`)도 닫는다 — 돌아왔을 때 다이얼로그가 다시 튀어 오르면 안 된다
        onValueChange={(value) => patchParams({ tab: value, run: null })}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabList label="주식 수집 관리 탭" size="sm" className="shrink-0 overflow-x-auto">
          <Tab value="runs">실행 이력</Tab>
          <Tab value="trigger">수동 실행</Tab>
          <Tab value="checkpoints">체크포인트</Tab>
        </TabList>

        <TabPanel value="runs" className="flex min-h-0 flex-1 flex-col pt-3">
          <CollectRunsTab />
        </TabPanel>
        <TabPanel value="trigger" className="flex min-h-0 flex-1 flex-col pt-3">
          <ManualTriggerTab />
        </TabPanel>
        <TabPanel value="checkpoints" className="flex min-h-0 flex-1 flex-col pt-3">
          <CheckpointTab />
        </TabPanel>
      </Tabs>
    </AdminPageFrame>
  );
}
