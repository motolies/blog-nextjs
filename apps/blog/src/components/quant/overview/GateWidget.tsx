'use client';

import { Badge, Button, InlineNotice, useConfirm } from '@hvy/ui';
import type { UseQueryResult } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import Link from 'next/link';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import type { RunActions } from '@/components/quant/useRunActions';
import { type AdvisorDisabled, isAdvisorDisabled } from '@/hooks/useQuant';
import { adviceHref } from '@/lib/quant/routes';
import type { BadgeTone } from '@/lib/quant/runStatus';
import type { AdviceHeader, AdvisorGateResponse } from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';

/**
 * 게이트 단일 칩 — 우선순위(PLAN Badge tone 표):
 * !tradingDay neutral "휴장일" > alreadyDone success "판단 완료" > pastDeadline danger "마감 지남" >
 * !dataReady warning "DAILY 대기" > ready primary "실행 가능".
 * 순수 함수라 여기서만 판정하고 화면은 결과만 그린다.
 */
export function gateChip(gate: AdvisorGateResponse): { tone: BadgeTone; label: string } {
  if (!gate.tradingDay) return { tone: 'neutral', label: '휴장일' };
  if (gate.alreadyDone) return { tone: 'success', label: '판단 완료' };
  if (gate.pastDeadline) return { tone: 'danger', label: '마감 지남' };
  if (!gate.dataReady) return { tone: 'warning', label: 'DAILY 대기' };
  return { tone: 'primary', label: '실행 가능' };
}

/** confirm 문구 — ready 가 아니면 사유·SKIPPED 예고, 마감 뒤면 #hvy-error 알림 발송을 명시한다. */
export function adviseConfirmMessage(gate: AdvisorGateResponse | null): string {
  if (!gate)
    return 'ADVISE 를 지금 실행합니다. 게이트 판정을 조회할 수 없어 사유를 미리 보여줄 수 없습니다.';
  if (gate.ready) {
    return `ADVISE 를 지금 실행합니다 — 게이트 통과(${gate.reason}). 백그라운드에서 돌고 완료 시 Slack #hvy-advisor 에 발행됩니다.`;
  }
  const parts = [
    `게이트가 열려 있지 않습니다: ${gate.reason}.`,
    '실행하면 run 이 SKIPPED 로 닫힙니다.',
  ];
  if (gate.alreadyDone) parts.push('재판단은 판단 삭제 뒤에 가능합니다.');
  if (gate.pastDeadline) parts.push('마감 이후라 #hvy-error 알림이 발송됩니다.');
  return parts.join(' ');
}

export function GateWidget({
  gate,
  advices,
  actions,
}: {
  gate: UseQueryResult<AdvisorGateResponse | AdvisorDisabled>;
  advices: UseQueryResult<AdviceHeader[] | AdvisorDisabled>;
  actions: RunActions;
}) {
  const askConfirm = useConfirm();
  const busy = actions.isBusy('trigger:ADVISOR:ADVISE');

  const handleTrigger = async (current: AdvisorGateResponse | null) => {
    const ok = await askConfirm({
      message: adviseConfirmMessage(current),
      confirmLabel: '지금 판단 실행',
    });
    if (ok) await actions.triggerAdvisor('ADVISE');
  };

  return (
    <DashboardWidget
      id="quant-gate"
      title="AI 판단 게이트"
      caption="오늘 ADVISE 조건 · 스케줄러와 같은 판정"
      query={gate}
      isEmpty={(data) => isAdvisorDisabled(data) && isAdvisorDisabled(advices.data)}
      empty={{
        message: 'AI 어드바이저가 비활성입니다',
        hint: 'advisor.enabled=false 환경 — 판단·게이트를 조회할 수 없습니다',
      }}
      errorMessage="게이트 판정을 불러오지 못했습니다."
    >
      {(data) => {
        // 게이트만 404(M1 미배포 백엔드)인데 판단 목록은 되는 경우 — 판단 상태만 보이고 사유는 배포 후.
        const current = isAdvisorDisabled(data) ? null : data;
        const chip = current ? gateChip(current) : null;
        const todayLive = isAdvisorDisabled(advices.data) ? [] : (advices.data ?? []);
        const live = todayLive[0];
        return (
          <div className="flex flex-col gap-3">
            {current === null ? (
              <InlineNotice tone="muted">
                백엔드 구버전 — 게이트 판정은 배포 후 표시됩니다.
              </InlineNotice>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {chip ? (
                <Badge tone={chip.tone} size="md">
                  {chip.label}
                </Badge>
              ) : null}
              {/* 게이트 칩이 이미 "판단 완료" 를 말하면(alreadyDone) 같은 배지를 두 번 두지 않는다 — 게이트 API 가 없을 때만 판단 목록으로 대신 말한다 */}
              {live && !current?.alreadyDone ? (
                <Badge tone="success" size="md">
                  판단 완료
                </Badge>
              ) : null}
              {current?.quality === 'DEGRADED' ? (
                <Badge tone="warning" size="xs">
                  품질 DEGRADED
                </Badge>
              ) : null}
            </div>
            {current ? (
              <p className="text-dl-sm text-[color:var(--admin-text)] wrap-anywhere">
                {current.reason}
              </p>
            ) : null}
            {live ? (
              <p className="text-dl-xs text-[color:var(--admin-text-muted)]">
                <Link
                  href={adviceHref(live.adviceId)}
                  className="text-dl-primary-ink hover:underline"
                >
                  오늘 LIVE 판단 #{live.adviceId}
                </Link>
                {live.publishedAt
                  ? ` · 발행 ${formatUtcToLocal(live.publishedAt, 'HH:mm')}`
                  : ' · 미발행'}
                {live.regimeCode ? ` · 국면 ${live.regimeCode}` : ''}
              </p>
            ) : (
              <p className="text-dl-xs text-[color:var(--admin-text-muted)]">
                오늘 LIVE 판단이 없습니다{current ? ` — ${current.reason}` : ''}
              </p>
            )}
            <div>
              <Button
                size="sm"
                variant="primary"
                icon={Play}
                busy={busy}
                onClick={() => handleTrigger(current)}
              >
                지금 판단 실행
              </Button>
            </div>
          </div>
        );
      }}
    </DashboardWidget>
  );
}
