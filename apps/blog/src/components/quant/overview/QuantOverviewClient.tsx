'use client';

import { useState } from 'react';
import { useRunActions } from '@/components/quant/useRunActions';
import { useHealthStats } from '@/hooks/useDashboard';
import {
  useGate,
  useKisToken,
  useRecentAdvisorRuns,
  useRecentCollectRuns,
  useTodayAdvices,
} from '@/hooks/useQuant';
import { todayKst } from '@/lib/quant/kstDate';
import { ActiveRunsWidget } from './ActiveRunsWidget';
import { GateWidget } from './GateWidget';
import { KisTokenWidget } from './KisTokenWidget';
import { QuantBanner } from './QuantBanner';
import { SchedulerTriggerWidget } from './SchedulerTriggerWidget';
import { TodayPipelineWidget } from './TodayPipelineWidget';

/**
 * Quant 운영 현황 루트 — `DashboardClient` 와 같은 구조(클라이언트 컴포넌트·조건부 배너·2열·위젯별 폴링).
 *
 * 클라이언트인 이유도 같다: axiosClient 의 X-Client-Timezone 은 브라우저에서만 실리고, 폴링·위젯별 재시도가 클라이언트 경계를 요구한다.
 * 위젯은 5개로 고정한다(UX 리뷰: 과밀 회피) — LLM 사용량은 advisor KPI 탭, 체크포인트 요약은 collect 체크포인트 탭이 맡는다.
 * 읽기 흐름: 오늘 무슨 일이(파이프라인) → 왜(실행 중/실패·게이트) → 고치기(스케줄러·토큰).
 *
 * "오늘" 은 KST(`MarketClock.today()` 와 같은 기준) — 마운트 시점에 한 번 계산한다(자정 넘김 stale 방지는 새로고침으로).
 */
export function QuantOverviewClient() {
  const [today] = useState(() => todayKst());
  const collect = useRecentCollectRuns();
  const advisor = useRecentAdvisorRuns();
  const health = useHealthStats();
  const gate = useGate(today);
  const advices = useTodayAdvices(today);
  const token = useKisToken();
  const actions = useRunActions();

  return (
    <div className="flex flex-col gap-4">
      <QuantBanner
        collect={collect.data}
        advisor={advisor.data}
        health={health.data}
        gate={gate.data}
        token={token.data}
      />

      <div className="admin-split-layout" data-size="wide">
        <div className="flex min-w-0 flex-col gap-4">
          <TodayPipelineWidget query={collect} today={today} />
          <ActiveRunsWidget collect={collect} advisor={advisor} today={today} actions={actions} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <GateWidget gate={gate} advices={advices} actions={actions} />
          <SchedulerTriggerWidget
            health={health}
            collect={collect}
            advisor={advisor}
            gate={gate}
            actions={actions}
          />
          <KisTokenWidget query={token} />
        </div>
      </div>
    </div>
  );
}
