'use client';

import { isAdvisorDisabled } from '@/hooks/useQuant';
import { AdvisorDisabledPanel } from './AdvisorDisabledPanel';
import { useWeightSets } from './advisorQueries';
import { ChatsGrid } from './ChatsGrid';
import { LessonsGrid } from './LessonsGrid';
import { WeightSetsPanel } from './WeightSetsPanel';

/**
 * 가중치·교훈 탭 — 세트 패널(react-query) → 교훈 그리드 → 채팅 그리드 세로 스택. 스크롤은 `admin-fill` 이 맡는다.
 *
 * advisor 404 판정은 세트 쿼리 하나가 대표한다 — 컨트롤러가 없으면 세 엔드포인트가 함께 404 라 셋을 따로 볼 이유가 없다.
 * 판정 전(pending)에도 그리드를 그려 첫 조회를 세트 응답 RTT 만큼 늦추지 않는다(disabled 로 판명되면 언마운트).
 */
export function WeightsLessonsTab() {
  const weightSets = useWeightSets();

  if (isAdvisorDisabled(weightSets.data)) {
    return <AdvisorDisabledPanel />;
  }

  return (
    <div className="admin-fill flex flex-1 flex-col gap-4 pb-2">
      <WeightSetsPanel query={weightSets} />
      <LessonsGrid />
      <ChatsGrid />
    </div>
  );
}
