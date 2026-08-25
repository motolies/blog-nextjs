'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { normalizeTheme } from '../../../../../shared/theme';

/**
 * 토큰 섹션 — **CSS 에 실제로 존재하는 값**을 보여준다.
 *
 * 소스(`theme/default.css`)를 읽어 표시하면 이 화면의 존재 의미가 없다.
 * 선언과 실제가 갈라지는 경로가 둘 있기 때문이다:
 *   1. Tailwind 가 미사용 토큰을 출력에서 떨어뜨린다(`@theme static` 이 아니면)
 *   2. 앱의 `theme.css` 나 런타임 주입이 값을 덮어쓴다
 * 둘 다 에러 없이 일어나므로 브라우저에서만 드러난다. 그래서 여기서는
 * `document.styleSheets` 로 **선언된 이름**을, `getComputedStyle` 로 **계산된 값**을
 * 각각 읽어 나란히 놓는다.
 *
 * 목록을 하드코딩하지 않는 것도 같은 이유다 — 토큰을 추가하면 여기 자동으로 나타나고,
 * 지우면 사라진다. 이중 관리가 생기는 순간 이 화면도 믿을 수 없게 된다.
 */

type TokenGroup = 'raw' | 'color' | 'text' | 'font' | 'radius' | 'shadow' | 'spacing' | 'z';

type Token = {
  readonly name: string;
  readonly group: TokenGroup;
  /** getComputedStyle 결과. 빈 문자열이면 **CSS 에 방출되지 않은 것**이다. */
  readonly value: string;
};

const GROUP_LABEL: Record<TokenGroup, string> = {
  raw: 'Tier 1 · 원색 팔레트',
  color: 'Tier 2 · 색',
  text: '타이포',
  font: '폰트',
  radius: '모양(radius)',
  shadow: '그림자',
  spacing: '치수',
  z: 'z-index',
};

const GROUP_NOTE: Partial<Record<TokenGroup, string>> = {
  raw: '유틸리티를 만들지 않는다. Tier 2 가 var() 로 참조하는 값의 원본이다.',
  color: 'bg-* / text-* / border-* 유틸리티가 된다.',
  spacing: 'h-* / w-* / p-* / gap-* 이 되고, 일부는 useTokenPx 가 숫자로 읽는다.',
  z: 'Tailwind v4 에 z-index 네임스페이스가 없어 z-[var(--dl-z-modal)] 로 쓴다.',
};

const GROUP_ORDER: readonly TokenGroup[] = [
  'color',
  'raw',
  'text',
  'font',
  'radius',
  'shadow',
  'spacing',
  'z',
];

function groupOf(name: string): TokenGroup {
  if (name.startsWith('--color-dl-')) return 'color';
  if (name.startsWith('--text-dl-')) return 'text';
  if (name.startsWith('--font-dl-')) return 'font';
  if (name.startsWith('--radius-dl-')) return 'radius';
  if (name.startsWith('--shadow-dl-')) return 'shadow';
  if (name.startsWith('--spacing-dl-')) return 'spacing';
  if (name.startsWith('--dl-z-')) return 'z';
  return 'raw';
}

/**
 * 스타일시트에서 `--*dl-*` 선언 이름을 **선언 순서대로** 모은다.
 *
 * 정렬하지 않는 이유: 선언 순서가 곧 `default.css` 의 그룹 구조라, 그대로 두면
 * 파일을 읽는 것과 같은 순서로 화면에 나온다.
 */
function collectDeclaredNames(): string[] {
  const names = new Set<string>();

  const walk = (rule: CSSRule): void => {
    /**
     * 선언을 **먼저** 읽고, 그 다음 중첩을 본다. 순서를 바꾸면 안 된다 —
     * CSS Nesting 이 표준이 되면서 `CSSStyleRule` 이 `CSSGroupingRule` 을 상속하게 되어
     * 중첩이 없어도 **길이 0 짜리 CSSRuleList** 를 반환한다. `if (cssRules) { …; return; }`
     * 로 쓰면 빈 리스트도 truthy 라 모든 선언을 건너뛰고, 에러 없이 결과만 0건이 된다.
     */
    const style = (rule as CSSStyleRule).style;
    if (style) {
      for (let i = 0; i < style.length; i += 1) {
        const property = style.item(i);
        // `--_` 는 컴포넌트 로컬 변수다(dl-size-* 가 세팅하는 --_dl-ctl-h 등) —
        // :root 토큰이 아니라서 실측하면 "CSS 에 없음" 오탐이 된다.
        if (property.startsWith('--_')) continue;
        if (property.startsWith('--') && property.includes('dl-')) names.add(property);
      }
    }

    // 토큰은 `@layer theme { :root { … } }` 안에 있다 — 재귀가 없으면 하나도 못 찾는다.
    const nested = (rule as CSSGroupingRule).cssRules;
    if (nested) {
      for (const child of Array.from(nested)) walk(child);
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // cross-origin 스타일시트는 읽을 수 없다. 우리 토큰은 여기 없다.
      continue;
    }
    for (const rule of Array.from(rules)) walk(rule);
  }

  return Array.from(names);
}

export function TokensSection() {
  const [tokens, setTokens] = useState<readonly Token[]>([]);
  // 테마 전환(?theme=)마다 재실측한다 — 이 표가 곧 테마 전환의 검증 도구다.
  // 단, 테마 파일의 키 누락은 base :root 폴백 탓에 여기서 안 드러난다(verify:tokens 가 잡는다).
  const theme = normalizeTheme(useSearchParams().get('theme'));

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    setTokens(
      collectDeclaredNames().map((name) => ({
        name,
        group: groupOf(name),
        value: root.getPropertyValue(name).trim(),
      })),
    );
  }, [theme]);

  const missing = tokens.filter((token) => token.value === '');

  return (
    <div className="flex flex-col gap-dl-gutter">
      <Summary total={tokens.length} missing={missing.length} />

      {GROUP_ORDER.map((group) => {
        const items = tokens.filter((token) => token.group === group);
        if (items.length === 0) return null;

        return (
          <section
            key={group}
            className="rounded-dl-container border border-dl-border bg-dl-surface"
          >
            <header className="flex items-baseline gap-2 border-b border-dl-divider px-4 py-3">
              <h3 className="text-dl-xl font-bold text-dl-fg-strong">{GROUP_LABEL[group]}</h3>
              <span className="text-dl-xs text-dl-fg-subtle">{items.length}개</span>
              {GROUP_NOTE[group] ? (
                <span className="text-dl-xs text-dl-fg-muted">— {GROUP_NOTE[group]}</span>
              ) : null}
            </header>

            <div className="flex flex-col">
              {items.map((token) => (
                <TokenRow key={token.name} token={token} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Summary({ total, missing }: { total: number; missing: number }) {
  if (total === 0) {
    return (
      <p className="text-dl-sm text-dl-fg-muted">스타일시트를 읽는 중… (하이드레이션 후 표시)</p>
    );
  }

  return (
    <div
      className={
        missing > 0
          ? 'rounded-dl-control border border-dl-error bg-dl-error-bg px-4 py-3'
          : 'rounded-dl-control bg-dl-success-bg px-4 py-3'
      }
    >
      <p className={missing > 0 ? 'text-dl-sm text-dl-error' : 'text-dl-sm text-dl-success'}>
        토큰 <strong>{total}</strong>개 중 <strong>{missing}</strong>개가 CSS 에 없습니다.
        {missing > 0
          ? ' — @theme static 이 풀렸거나 이름이 바뀐 것입니다. useTokenPx 가 조용히 fallback 으로 떨어집니다.'
          : ' 선언과 실제가 일치합니다.'}
      </p>
    </div>
  );
}

function TokenRow({ token }: { token: Token }) {
  return (
    <div className="flex items-center gap-3 border-b border-dl-divider px-4 py-2 last:border-b-0">
      <div className="w-[300px] shrink-0">
        <code className="font-dl-mono text-dl-sm text-dl-fg">{token.name}</code>
      </div>

      <div className="w-[220px] shrink-0">
        {token.value === '' ? (
          <span className="text-dl-xs font-semibold text-dl-error">CSS 에 없음</span>
        ) : (
          <code className="font-dl-mono text-dl-xs text-dl-fg-muted">{token.value}</code>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <TokenPreview token={token} />
      </div>
    </div>
  );
}

/** 그룹마다 "무엇을 보면 맞는지 아는가"가 달라서 미리보기도 갈린다. */
function TokenPreview({ token }: { token: Token }) {
  if (token.value === '') return null;
  const reference = `var(${token.name})`;

  if (token.group === 'color' || token.group === 'raw') {
    return (
      <span
        className="inline-block h-6 w-24 rounded-dl-badge border border-dl-border align-middle"
        style={{ background: reference }}
      />
    );
  }

  if (token.group === 'text') {
    return (
      <span style={{ fontSize: reference }} className="text-dl-fg">
        게시글 ID POST-100001 · 다람쥐 헌 쳇바퀴
      </span>
    );
  }

  if (token.group === 'font') {
    return (
      <span style={{ fontFamily: reference }} className="text-dl-sm text-dl-fg">
        블로그 관리 Blog Management 0123456789
      </span>
    );
  }

  if (token.group === 'radius') {
    return (
      <span
        className="inline-block h-8 w-16 border border-dl-field-border bg-dl-tonal align-middle"
        style={{ borderRadius: reference }}
      />
    );
  }

  if (token.group === 'shadow') {
    return (
      <span
        className="ml-2 inline-block h-8 w-24 rounded-dl-control bg-dl-surface align-middle"
        style={{ boxShadow: reference }}
      />
    );
  }

  if (token.group === 'spacing') {
    // 사이드바·모달 폭처럼 큰 값은 막대가 화면을 넘는다. 값은 옆 열에 이미 있으므로 잘라 보여준다.
    return (
      <span
        className="inline-block h-3 max-w-full rounded-dl-badge bg-dl-primary align-middle"
        style={{ width: reference }}
      />
    );
  }

  return null;
}
