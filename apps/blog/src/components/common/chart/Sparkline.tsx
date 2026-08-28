import { type SparkPoint, scalePoints, summarize, toAreaPath, toLinePath } from '@/lib/chartScale';
import { CHART_LINE, type ChartTone } from './chartPalette';

/**
 * 인라인 SVG 스파크라인 — 차트 라이브러리 없이 그린다.
 *
 * 왜 echarts 를 다시 설치하지 않는가:
 *  - 번들 다이어트로 제거했던 것이 그대로 돌아온다(로드맵이 이걸 함정으로 명시).
 *  - 캔버스 라이브러리는 색을 JS 로 주입해야 해서 getComputedStyle + data-theme MutationObserver
 *    재렌더 배선이 필요하다. 인라인 SVG 는 var() 가 CSS 캐스케이드를 타므로 테마 전환 비용이 0이다.
 *    지난번 /admin/stats 가 다크에서 묻힌 원인이 정확히 그 배선의 부재였다.
 *
 * 반응형은 viewBox + preserveAspectRatio 로 처리한다 — viewBox 는 픽셀이 아니라 정규화 좌표계라
 * "치수 리터럴 금지" 규칙과 충돌하지 않고, ResizeObserver 도 필요 없다.
 */

interface SparklineProps {
  points: readonly SparkPoint[];
  /** 스크린리더용 설명. 필수 — 데이터 그래픽은 대체 텍스트 없이 두지 않는다. */
  ariaLabel: string;
  tone?: ChartTone;
  showArea?: boolean;
  emphasizeLast?: boolean;
  formatValue?: (value: number) => string;
}

// viewBox 좌표계 — 화면 픽셀이 아니다. 실제 크기는 .chart-spark 의 토큰이 정한다.
const BOX = { w: 100, h: 28, pad: 2 };

export function Sparkline({
  points,
  ariaLabel,
  tone = 'primary',
  showArea = true,
  emphasizeLast = true,
  formatValue = (value) => value.toLocaleString('ko-KR'),
}: SparklineProps) {
  const scaled = scalePoints(
    points.map((point) => point.value),
    BOX,
  );
  const stats = summarize(points);
  const color = CHART_LINE[tone];

  const description =
    points.length === 0
      ? `${ariaLabel} — 데이터 없음`
      : `${ariaLabel} — 최소 ${formatValue(stats.min)}, 최대 ${formatValue(stats.max)}, 마지막 ${formatValue(stats.last)}`;

  const last = scaled.at(-1);

  return (
    <svg
      className="chart-spark"
      viewBox={`0 0 ${BOX.w} ${BOX.h}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={description}
    >
      <title>{description}</title>
      {showArea && scaled.length > 1 ? (
        // 투명도는 숫자 속성으로 준다 — tsx 안의 rgba()/color-mix() 는 verify:tokens 하드 실패다
        <path d={toAreaPath(scaled, BOX.h)} fillOpacity={0.14} style={{ fill: color }} />
      ) : null}
      <path
        d={toLinePath(scaled)}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        // preserveAspectRatio="none" 은 스트로크까지 비균등 스케일해 선을 쐐기로 만든다.
        // 이 속성이 스트로크만 스케일에서 빼준다 — 없으면 안 된다.
        vectorEffect="non-scaling-stroke"
        style={{ stroke: color }}
      />
      {emphasizeLast && last ? (
        <circle
          cx={last.x}
          cy={last.y}
          r={2}
          vectorEffect="non-scaling-stroke"
          style={{ fill: color }}
        />
      ) : null}
    </svg>
  );
}
