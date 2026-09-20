'use client';

import { InlineNotice } from '@hvy/ui';
import Link from 'next/link';
import { type AdvisorDisabled, isAdvisorDisabled } from '@/hooks/useQuant';
import type {
  AdvisorGateResponse,
  AdvisorRunResponse,
  CollectRunResponse,
  KisTokenStatus,
} from '@/types/quant';
import type { HealthStats } from '@/types/stats';
import { pickActiveRows } from './ActiveRunsWidget';
import { TOKEN_EXPIRING_MINUTES } from './KisTokenWidget';

/**
 * Quant 이상 징후 배너 — `HealthBanner` 형. **정상일 때는 렌더 0.**
 * 메시지마다 해당 위젯 앵커로 보낸다 — 대시보드 배너가 "로그 보기" 로 보내는 것과 같은 규칙.
 */
export function QuantBanner({
  collect,
  advisor,
  health,
  gate,
  token,
}: {
  collect: CollectRunResponse[] | undefined;
  advisor: AdvisorRunResponse[] | AdvisorDisabled | undefined;
  health: HealthStats | undefined;
  gate: AdvisorGateResponse | AdvisorDisabled | undefined;
  token: KisTokenStatus | undefined;
}) {
  const messages: { text: string; href: string }[] = [];

  const failed = pickActiveRows(collect, advisor).filter((row) => row.run.status !== 'RUNNING');
  if (failed.length > 0) {
    messages.push({
      text: `24시간 내 실패·부분·취소 run ${failed.length}건`,
      href: '#quant-active',
    });
  }

  const staleQuant = health?.schedulers.filter(
    (s) => s.manualTrigger && (s.state === 'STALE' || s.state === 'NEVER_RUN'),
  );
  if (staleQuant && staleQuant.length > 0) {
    messages.push({
      text: `스케줄러 지연 — ${staleQuant.map((s) => s.displayName).join(', ')}`,
      href: '#quant-schedulers',
    });
  }

  if (
    gate &&
    !isAdvisorDisabled(gate) &&
    gate.tradingDay &&
    !gate.alreadyDone &&
    gate.pastDeadline
  ) {
    messages.push({ text: `오늘 AI 판단 마감 지남 — ${gate.reason}`, href: '#quant-gate' });
  }

  if (token?.configured) {
    if (!token.present) messages.push({ text: 'KIS 토큰 없음', href: '#quant-token' });
    else if (token.remainingMinutes !== null && token.remainingMinutes <= TOKEN_EXPIRING_MINUTES) {
      messages.push({
        text: `KIS 토큰 만료 임박 (${Math.max(0, token.remainingMinutes)}분)`,
        href: '#quant-token',
      });
    }
  }

  if (messages.length === 0) return null;

  const severe = failed.length > 0 || (token?.configured && !token.present);

  return (
    <InlineNotice live tone={severe ? 'error' : 'warning'}>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 wrap-anywhere">
        {messages.map((message) => (
          <Link
            key={message.href + message.text}
            href={message.href}
            className="underline underline-offset-2"
          >
            {message.text}
          </Link>
        ))}
      </span>
    </InlineNotice>
  );
}
