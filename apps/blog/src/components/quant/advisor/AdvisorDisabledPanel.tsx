import { EmptyState } from '@hvy/ui';
import { ADVISOR_DISABLED_EMPTY } from './advisorLabels';

/**
 * advisor 404(`advisor.enabled=false`) 빈 상태 — 탭 하나가 통째로 이 패널이 된다.
 * ErrorState(재시도)로 가면 안 되는 이유는 `hooks/useQuant.ts` 의 `AdvisorDisabled` 주석과 같다: 재시도해도 404 다.
 */
export function AdvisorDisabledPanel() {
  return (
    <div className="admin-panel admin-panel-pad">
      <EmptyState message={ADVISOR_DISABLED_EMPTY.message} hint={ADVISOR_DISABLED_EMPTY.hint} />
    </div>
  );
}
