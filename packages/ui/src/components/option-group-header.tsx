import { cn } from '../lib/cn';

/**
 * 옵션 그룹 헤더 — Select · MultiSelect 가 공유한다(어디에 그릴지는 `optionGroups.ts`,
 * 어떻게 보일지는 이 파일).
 *
 * 옵션(14px · regular · fg)보다 **작지만 더 진하고 굵게**(12px · semibold · fg-strong).
 * 이전의 muted 회색은 옵션보다 연해서 상위 항목인 헤더가 오히려 약하게 읽혔다 —
 * 크기로 위계를 낮추되 색·굵기로 "제목"임을 세운다. primary-ink 는 쓰지 않는다 —
 * 선택된 옵션 배색(primary-ink · semibold)과 겹쳐 헤더가 고른 항목처럼 보인다.
 *
 * `divided` — 앞에 다른 행이 있으면 위에 구분선을 그어 그룹 경계를 세운다. 첫 헤더와
 * MultiSelect 의 전체 토글 행 바로 뒤(그 행이 이미 border-b 를 가진다)에는 긋지 않아
 * 선이 겹치지 않는다.
 *
 * `aria-hidden` — 헤더는 시각 전용이다(옵션 인덱스·activedescendant 에 끼지 않는다).
 */
export function OptionGroupHeader({
  label,
  divided,
}: {
  readonly label: string;
  readonly divided: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'px-4 pt-2 pb-1 font-semibold text-dl-fg-strong text-dl-xs',
        divided && 'mt-1 border-dl-divider border-t pt-2.5',
      )}
    >
      {label}
    </div>
  );
}
