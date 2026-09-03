import type { LucideIcon, LucideProps } from 'lucide-react';
import { forwardRef, lazy, Suspense } from 'react';
import { toLucideKebab } from './lucideName';

/**
 * 큐레이션 밖 lucide 아이콘을 **이름 하나당 청크 하나**로 지연 로드하는 래퍼.
 *
 * lucide 가 제공하는 `DynamicIcon` 을 쓰지 않는 이유: 그것은 `useEffect` 로 로드해서 SSR HTML 에
 * 아이콘이 없고 하이드레이션 뒤에야 나타난다(공개 홈에서 아이콘이 늦게 툭 뜬다). `React.lazy` 는
 * 서버 컴포넌트(RSC)에서는 서버가 import 를 기다렸다가 완성된 svg 를 HTML 로 내려보내고(클라이언트
 * JS 0), 클라이언트 컴포넌트 SSR 에서는 폴백 뒤 스트리밍으로 교체된다 — `next/dynamic` 도
 * 내부적으로 같은 조합이다.
 *
 * `dynamicIconImports` 맵(1,950 엔트리) 자체도 `import()` 로 늦춘다. 그래야 큐레이션 아이콘만
 * 쓰는 공개 홈은 바이트 하나 늘지 않는다. `lucide-react/dynamic` 이 아니라
 * `lucide-react/dynamicIconImports` 를 쓰는 이유는 전자가 `"use client"` 인 DynamicIcon 도
 * 함께 재export 해 RSC 경계를 건드리기 때문이다.
 *
 * `'use client'` 가 없다 — `LinkRow` 가 홈 서버 컴포넌트에서도 렌더되므로 RSC 에서 정의할 수
 * 있어야 한다(react 서버 빌드도 forwardRef · lazy · Suspense 를 export 한다). 반대로 이 래퍼를
 * 서버 → 클라이언트 **prop 으로 넘기면 안 된다** — 함수는 직렬화되지 않는다. 지금처럼 이름(문자열)을
 * 넘기고 각 레이어가 `resolveLinkIcon` 으로 직접 해석한다.
 *
 * `linkIcons.ts` 를 import 하지 않는다 — 그쪽이 이 파일을 import 하므로 폴백은 인자로 받는다.
 */

type DynamicIconImports = typeof import('lucide-react/dynamicIconImports').default;
type DynamicIconKey = keyof DynamicIconImports;

let importsPromise: Promise<DynamicIconImports> | undefined;

/** 맵 모듈을 한 번만 가져온다(rsc·ssr·browser 레이어가 각자 캐시를 갖는다 — 정확성엔 영향 없다). */
function loadDynamicIconImports(): Promise<DynamicIconImports> {
  importsPromise ??= import('lucide-react/dynamicIconImports').then((module) => module.default);
  return importsPromise;
}

/**
 * PascalCase 이름을 lucide 아이콘 컴포넌트로 해석한다. **절대 reject 하지 않는다** — RSC 에서 reject 는
 * 홈 전체를 에러 바운더리로 떨어뜨리고, `React.lazy` 는 reject 를 영구 캐시해 새로고침 전까지 같은
 * 이름이 계속 실패한다. 맵에 없는 이름(오타·삭제된 아이콘)과 청크 로드 실패는 모두 `fallback` 이다.
 *
 * `Object.hasOwn` 인 이유: `in` 은 `Constructor` 같은 이름을 프로토타입 키 `constructor` 로 통과시켜
 * `.default` 가 없는 값을 돌려준다(lucide 의 DynamicIcon 이 가진 버그다).
 */
export async function loadLinkIcon(name: string, fallback: LucideIcon): Promise<LucideIcon> {
  try {
    const imports = await loadDynamicIconImports();
    const key = toLucideKebab(name);
    if (!Object.hasOwn(imports, key)) return fallback;
    const module = await imports[key as DynamicIconKey]();
    return module.default ?? fallback;
  } catch (error) {
    console.error(`[linkIcons] 아이콘 로드 실패: ${name}`, error);
    return fallback;
  }
}

const wrapperCache = new Map<string, LucideIcon>();

/**
 * 이름별로 **한 번만** 만든 lazy 래퍼를 돌려준다. 렌더마다 `lazy()` 를 새로 만들면 React 가 매번
 * 새 컴포넌트로 보고 다시 suspend 해 깜빡인다. 반환 타입이 `LucideIcon` 이라 `@hvy/ui` 의
 * `<Icon icon={…}>` 과 직접 렌더 `<Comp className=… />` 어디에나 그대로 들어간다.
 *
 * Suspense 경계를 래퍼 안에 두는 이유: 클라이언트 SSR 에서 경계가 없으면 아이콘 청크 하나가
 * 상위 경계(라우트 전체)의 셸과 하이드레이션을 붙잡는다. 폴백은 같은 className·크기의 빈 svg 라
 * 아이콘이 오기 전에도 자리를 잡아 두어 레이아웃이 밀리지 않는다.
 */
export function getLazyLinkIcon(name: string, fallback: LucideIcon): LucideIcon {
  const cached = wrapperCache.get(name);
  if (cached) return cached;

  const Inner = lazy(() =>
    loadLinkIcon(name, fallback).then((component) => ({ default: component })),
  );
  const Wrapper = forwardRef<SVGSVGElement, LucideProps>(function LazyLinkIcon(props, ref) {
    const size = props.size ?? 24;
    return (
      <Suspense
        fallback={<svg className={props.className} width={size} height={size} aria-hidden="true" />}
      >
        <Inner {...props} ref={ref} />
      </Suspense>
    );
  });
  Wrapper.displayName = `LazyLinkIcon(${name})`;

  wrapperCache.set(name, Wrapper);
  return Wrapper;
}
