'use client';

import { useEffect, useState } from 'react';

/**
 * CSS 토큰(`--spacing-dl-row` 등)의 px 값을 읽는다.
 *
 * **왜 필요한가**: 가상 스크롤은 행 높이를 **숫자로** 알아야 하는데, 테마는 CSS 변수로 정의된다.
 * 그냥 숫자를 하드코딩하면 테마를 바꿔도 그리드가 안 바뀌고 토큰이 죽은 값이 된다 —
 * 실제로 `--spacing-dl-row: 32px` 가 정의만 되어 있고 코드는 `32` 를 박아둔 상태였다.
 *
 * **왜 프로브인가**: 스케일 유도 토큰(`--spacing-dl-grid-row: calc(30px + var(--dl-scale-md)*4px)`)의
 * computed value 는 **미등록 커스텀 프로퍼티라 calc/var 가 해소되지 않은 토큰 스트림**이다 —
 * `parseFloat` 는 정적 px 토큰에서만 성립한다. 실제 프로퍼티(`height`)에 대입해야 브라우저가
 * 길이로 해소하므로, 파싱이 실패하면 숨은 프로브 엘리먼트로 실측한다.
 * `@property` 등록으로도 해결되지만, 등록 목록과 소비처가 갈라지는 순간(새 토큰을 읽는데
 * 등록을 잊으면) NaN → fallback 으로 조용히 죽는 함정이 **하나 더** 생겨서 쓰지 않는다.
 *
 * **왜 data-theme 을 구독하는가**: 스케일(`--dl-scale-*`)이 테마 계약에 들어오면서 치수도
 * 테마 대상이 되었다. ui-docs 의 `?theme=` 런타임 전환에서 마운트 1회 측정은 stale 이 되므로,
 * `<html data-theme>` 변경을 관찰해 재측정한다. 비용은 전환당 토큰 5개 실측뿐이다.
 *
 * SSR 에서는 `fallback` 을 쓰고 하이드레이션 후 실제 토큰 값으로 교체된다.
 * 가상 스크롤 자체가 클라이언트 전용이라 이 지연은 문제가 되지 않는다.
 */
export function useTokenPx(tokenName: string, fallback: number): number {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    const measure = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(tokenName);
      let parsed = Number.parseFloat(raw);

      if (!Number.isFinite(parsed) && raw.trim() !== '') {
        // calc/var 유도 토큰 — 실프로퍼티에 대입해야 길이로 해소된다. 유효하지 않은
        // 값이면 height 가 auto 로 남아 빈 div 의 높이 0 → 아래 경고 경로로 떨어진다.
        const probe = document.createElement('div');
        probe.style.cssText = `position:absolute;visibility:hidden;height:var(${tokenName})`;
        document.body.appendChild(probe);
        parsed = probe.getBoundingClientRect().height;
        probe.remove();
      }

      if (Number.isFinite(parsed) && parsed > 0) {
        setValue(parsed);
        return;
      }

      /**
       * 토큰을 못 읽으면 **반드시 알린다.**
       *
       * 이 함수의 실패는 에러가 아니라 "화면이 조용히 예전 수치로 그려짐"이라 아무도 모른다.
       * 토큰 이름 오타는 `scripts/verify-tokens.mjs` 가 빌드 전에 잡지만,
       * **선언은 되어 있는데 Tailwind 가 출력에서 떨어뜨린 경우**는 정적 검사로 잡을 수 없다
       * (`@theme` 는 미사용 변수를 방출하지 않는다 — `@theme static` 이 필요한 이유).
       * 그건 브라우저에서만 드러나므로 여기가 유일한 관측 지점이다.
       *
       * `process.env.NODE_ENV` 로 감싸지 않는 이유: 프로덕션에서도 이 경고는 0건이어야 정상이고,
       * 0건이 아니라면 그때야말로 알아야 한다. (그리고 이 패키지는 process.env 를 쓰지 않는다.)
       */
      console.warn(
        `[@hvy/ui] CSS 토큰 ${tokenName} 을 읽지 못해 fallback ${fallback}px 로 그립니다. ` +
          `packages/ui/src/theme 에 선언되어 있는지, 빌드 결과 CSS 에 실제로 방출되었는지 확인하세요.`,
      );
    };

    measure();

    const observer = new MutationObserver(measure);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, [tokenName, fallback]);

  return value;
}
