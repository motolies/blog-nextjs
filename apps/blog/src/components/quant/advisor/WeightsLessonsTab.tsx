'use client';

import { isAdvisorDisabled } from '@/hooks/useQuant';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import { DAILY_HORIZON, isMonitoringHorizon, resolveIcHorizon } from '@/lib/quant/advisorHorizon';
import { IC_HORIZONS } from '@/types/quant';
import { AdvisorDisabledPanel } from './AdvisorDisabledPanel';
import { useWeightSets } from './advisorQueries';
import { ChatsGrid } from './ChatsGrid';
import { FilterSelect } from './FilterSelect';
import { LessonsGrid } from './LessonsGrid';
import { WeightSetsPanel } from './WeightSetsPanel';

/** 가중치 호라이즌 select — 5·20 은 학습, 60·180 은 모니터링(세트가 생기지 않는다는 것을 옵션에서 먼저 알린다). */
const HORIZON_OPTIONS = IC_HORIZONS.map((horizon) => ({
  value: String(horizon),
  label: `${horizon}일${isMonitoringHorizon(horizon) ? ' (모니터링 · 학습 안 함)' : ''}`,
}));

/**
 * 가중치·교훈 탭 — 호라이즌 select → 세트 패널(react-query) → 교훈 그리드 → 채팅 그리드 세로 스택. 스크롤은 `admin-fill` 이 맡는다.
 *
 * 호라이즌은 `?wH=`(기본 5, 기본값은 URL 에서 지운다) — 활성 세트가 호라이즌마다 1개라(M5) 섞어 보이면 어느 세트가 어느 판단에
 * 쓰이는지 알 수 없다. 교훈·채팅은 호라이즌과 무관하다(교훈은 DAILY 만 만든다).
 *
 * advisor 404 판정은 세트 쿼리 하나가 대표한다 — 컨트롤러가 없으면 세 엔드포인트가 함께 404 라 셋을 따로 볼 이유가 없다.
 * 판정 전(pending)에도 그리드를 그려 첫 조회를 세트 응답 RTT 만큼 늦추지 않는다(disabled 로 판명되면 언마운트).
 */
export function WeightsLessonsTab() {
  const [horizonParam, setHorizonParam] = useSearchParamState('wH');
  const horizon = resolveIcHorizon(horizonParam);
  const weightSets = useWeightSets(horizon);

  if (isAdvisorDisabled(weightSets.data)) {
    return <AdvisorDisabledPanel />;
  }

  return (
    <div className="admin-fill flex flex-1 flex-col gap-4 pb-2">
      <div className="flex flex-wrap items-end gap-2">
        <FilterSelect
          id="weights-horizon"
          label="가중치 호라이즌"
          value={String(horizon)}
          options={HORIZON_OPTIONS}
          onValueChange={(value) => setHorizonParam(value === String(DAILY_HORIZON) ? null : value)}
        />
      </div>
      <WeightSetsPanel query={weightSets} horizon={horizon} />
      <LessonsGrid />
      <ChatsGrid />
    </div>
  );
}
