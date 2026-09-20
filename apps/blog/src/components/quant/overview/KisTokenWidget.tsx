'use client';

import { Badge, Button, showToast } from '@hvy/ui';
import { type UseQueryResult, useQueryClient } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { quantKeys } from '@/hooks/useQuant';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import { formatRelativeTime } from '@/lib/statFormat';
import service from '@/service';
import type { KisTokenStatus } from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';

/** 만료 임박 기준(분) — 배너와 같은 값. DAILY 가 20~25분 걸리므로 그 전에 재발급돼야 한다. */
export const TOKEN_EXPIRING_MINUTES = 30;

export function tokenTone(token: KisTokenStatus): {
  tone: 'success' | 'warning' | 'danger' | 'neutral';
  label: string;
} {
  if (!token.configured) return { tone: 'neutral', label: '미설정' };
  if (!token.present) return { tone: 'danger', label: '토큰 없음' };
  if (token.remainingMinutes !== null && token.remainingMinutes <= 0)
    return { tone: 'danger', label: '만료' };
  if (token.remainingMinutes !== null && token.remainingMinutes <= TOKEN_EXPIRING_MINUTES) {
    return { tone: 'warning', label: '만료 임박' };
  }
  return { tone: 'success', label: '유효' };
}

export function KisTokenWidget({ query }: { query: UseQueryResult<KisTokenStatus> }) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    const before = query.data?.issuedAt ?? null;
    try {
      const after = await service.stockCollect.refreshToken();
      if (after.issuedAt === before) {
        showToast('60초 게이트 안 — 기존 토큰을 유지합니다.', 'info');
      } else {
        showToast('KIS 토큰을 재발급했습니다.');
      }
      queryClient.setQueryData(quantKeys.kisToken(), after);
    } catch (error) {
      showApiErrorToast('토큰 재발급에 실패했습니다.', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <DashboardWidget
      id="quant-token"
      title="KIS 토큰"
      caption="값은 노출되지 않음 · 재발급 60초 게이트"
      query={query}
      errorMessage="토큰 상태를 불러오지 못했습니다."
    >
      {(token) => {
        const chip = tokenTone(token);
        return (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={chip.tone} size="md">
                {chip.label}
              </Badge>
              {token.remainingMinutes !== null ? (
                <span className="text-dl-sm text-[color:var(--admin-text)]">
                  남은 시간 {Math.max(0, token.remainingMinutes)}분
                </span>
              ) : null}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-dl-sm">
              <Figure
                label="발급"
                value={formatRelativeTime(token.issuedAt)}
                title={token.issuedAt ? formatUtcToLocal(token.issuedAt) : undefined}
              />
              <Figure
                label="만료"
                value={token.expiresAt ? formatUtcToLocal(token.expiresAt, 'MM-dd HH:mm') : '—'}
              />
            </dl>
            <div>
              <Button
                size="xs"
                variant="outline-gray"
                icon={KeyRound}
                busy={refreshing}
                onClick={handleRefresh}
              >
                강제 재발급
              </Button>
            </div>
          </div>
        );
      }}
    </DashboardWidget>
  );
}

/** dl 항목 — 직계 자식은 `<div>` 여야 한다(dt/dd 그룹 래퍼로 허용되는 유일한 요소, HTML 명세). */
function Figure({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1" title={title}>
      <dt className="text-dl-xs text-[color:var(--admin-text-faint)]">{label}</dt>
      <dd className="font-semibold text-[color:var(--admin-text)] wrap-anywhere">{value}</dd>
    </div>
  );
}
