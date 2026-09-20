'use client';

import { Tab, TabList, TabPanel, Tabs } from '@hvy/ui';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import { AdvicesTab } from '@/components/quant/advisor/AdvicesTab';
import { AdvisorRunsTab } from '@/components/quant/advisor/AdvisorRunsTab';
import { KpiTab } from '@/components/quant/advisor/KpiTab';
import { WeightsLessonsTab } from '@/components/quant/advisor/WeightsLessonsTab';
import { useSearchParamsPatch } from '@/hooks/useSearchParamState';
import { ADVISOR_TABS, type AdvisorTab, resolveTab } from '@/lib/quant/routes';

/**
 * AI 판단 관리(/admin/quant/advisor) — 탭 4개: 실행 이력(M2) · 판단 이력 · KPI · 가중치·교훈(M4).
 * 배선 규칙은 collect 페이지와 같다(`?tab=` controlled · 높이 사슬 · TabList overflow-x-auto — 탭 4개라 375px 넘침이 확실하다).
 * 각 탭이 advisor 404(`isAdvisorDisabled`)를 스스로 판정해 "AI 어드바이저가 비활성입니다" 빈 상태로 바꾼다 — 페이지는 깨지지 않는다.
 */
export default function AdvisorAdminPage() {
  return (
    <Suspense fallback={null}>
      <AdvisorAdmin />
    </Suspense>
  );
}

function AdvisorAdmin() {
  const tabParam = useSearchParams().get('tab');
  const patchParams = useSearchParamsPatch();
  const tab = resolveTab<AdvisorTab>(tabParam, ADVISOR_TABS, 'runs');

  return (
    <AdminPageFrame className="admin-page-frame--fixed">
      <Tabs
        value={tab}
        // 탭을 떠나면 열린 상세(`?run=`·`?advice=`)도 닫는다 — 돌아왔을 때 다이얼로그가 다시 튀어 오르면 안 된다
        onValueChange={(value) => patchParams({ tab: value, run: null, advice: null })}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabList label="AI 판단 관리 탭" size="sm" className="shrink-0 overflow-x-auto">
          <Tab value="runs">실행 이력</Tab>
          <Tab value="advices">판단 이력</Tab>
          <Tab value="kpi">KPI</Tab>
          <Tab value="weights">가중치·교훈</Tab>
        </TabList>

        <TabPanel value="runs" className="flex min-h-0 flex-1 flex-col pt-3">
          <AdvisorRunsTab />
        </TabPanel>
        <TabPanel value="advices" className="flex min-h-0 flex-1 flex-col pt-3">
          <AdvicesTab />
        </TabPanel>
        <TabPanel value="kpi" className="flex min-h-0 flex-1 flex-col pt-3">
          <KpiTab />
        </TabPanel>
        <TabPanel value="weights" className="flex min-h-0 flex-1 flex-col pt-3">
          <WeightsLessonsTab />
        </TabPanel>
      </Tabs>
    </AdminPageFrame>
  );
}
