import { Badge } from '@hvy/ui';
import type { AdviceHeader, RegimePolicy } from '@/types/quant';
import { trendLabel, trendTone, volRegimeLabel, volRegimeTone } from './advisorLabels';
import { formatRate } from './kpiFormat';

/** 정책 표 한도 한 줄 — "LONG ≤ 5 · 확신 ≤ 70% · AVOID ≤ 2". 확신 상한이 없으면 그 조각을 뺀다. */
function policyText(policy: RegimePolicy): string {
  const parts = [`LONG ≤ ${policy.longMax}`];
  if (policy.convictionCap !== null) parts.push(`확신 ≤ ${formatRate(policy.convictionCap, 0)}`);
  parts.push(`AVOID ≤ ${policy.avoidMax}`);
  return parts.join(' · ');
}

/**
 * 판단 상세 공통 국면 칩 — 합성 국면(`header.regime`)의 추세 · 변동성 · 정책 표 한도. 서브탭 위에 두어 어느 탭에서도 보인다.
 *
 * regime 이 null 인 두 경우를 구분해 말한다: MORNING 은 저녁 판단의 국면을 읽기만 하고 저장하지 않는다(원 판단에서 확인),
 * 그 밖은 M6(advice-v8) 이전 판단이다. LLM 이 판단한 5일 위험 선호(regimeCode)와는 다른 축이라 라벨에 "합성" 을 붙인다.
 */
export function AdviceRegimeChips({ header }: { header: AdviceHeader }) {
  const regime = header.regime;

  if (!regime) {
    return (
      <p className="m-0 text-dl-xs text-dl-fg-muted">
        합성 국면 —{' '}
        {header.adviceKind === 'MORNING'
          ? `아침 재판정은 저장하지 않습니다(원 판단${header.parentAdviceId ? ` #${header.parentAdviceId}` : ''} 의 국면을 씀)`
          : '스냅샷 없음(advice-v8 이전 판단)'}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-dl-xs text-dl-fg-muted">합성 국면</span>
      <span title={`지수 ${regime.indexCode}`}>
        <Badge tone={trendTone(regime.trend)} size="xs">
          {trendLabel(regime.trend)}
          {regime.trendScore !== null
            ? ` ${regime.trendScore > 0 ? '+' : ''}${regime.trendScore}`
            : ''}
        </Badge>
      </span>
      <span
        title={
          regime.sigma20 !== null
            ? `σ20 ${formatRate(regime.sigma20, 2)} · 표본 ${regime.volHistoryDays ?? '—'}일`
            : undefined
        }
      >
        <Badge tone={volRegimeTone(regime.vol)} size="xs">
          {volRegimeLabel(regime.vol)}
          {regime.volPct !== null ? ` · 백분위 ${formatRate(regime.volPct, 0)}` : ''}
        </Badge>
      </span>
      <span title={regime.policy ? regime.policy.version : '추세가 없어 기존 가드만 적용'}>
        <Badge tone="neutral" size="xs">
          {regime.policy ? `정책 ${policyText(regime.policy)}` : '정책 없음'}
        </Badge>
      </span>
    </div>
  );
}
