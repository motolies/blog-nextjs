import type { ComponentType } from 'react';

/**
 * 문서 시스템의 타입 정의.
 *
 * 이 폴더(`_docs`)는 App Router private folder 다 — 라우팅에서 제외되고,
 * 문서 정의(메타 문자열 + 데모 참조)를 라우트 옆에 colocation 한다.
 * 정의 파일에는 `'use client'` 를 붙이지 않는다 — 붙이면 모든 export 가
 * client reference 가 되어 RSC(doc-page)가 메타 문자열을 읽을 수 없다.
 */

/** 문서 카테고리 — 이 배열 순서가 사이드바 그룹 순서다. */
export const DOC_CATEGORIES = ['components', 'layout', 'foundations', 'examples'] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export type DocExample = {
  /** 섹션 anchor + 목차 링크. 문서 안에서 유일해야 한다. */
  readonly id: string;
  readonly title: string;
  /** QA 근거·검증 포인트 서술 — 구 갤러리의 Playground note 를 승계하는 자리. */
  readonly note?: string;
  /**
   * 데모 파일 경로(apps/ui-docs 기준 상대) — Code 탭이 이 파일 **원문**을 읽는다.
   * 코드 문자열을 손으로 복제하지 않는 이유는 demo-source.ts 주석 참조.
   */
  readonly file: string;
  /** `'use client'` 데모 컴포넌트 — RSC 가 client reference 로 렌더한다. */
  readonly Component: ComponentType;
};

export type PropRow = {
  readonly name: string;
  readonly type: string;
  readonly defaultValue?: string;
  readonly required?: boolean;
  readonly description: string;
};

export type PropsTableDef = {
  /** 표 제목 — 보통 컴포넌트 이름(`Button` 등). */
  readonly title: string;
  readonly rows: readonly PropRow[];
};

export type DocEntry = {
  readonly slug: string;
  readonly category: DocCategory;
  readonly title: string;
  readonly description: string;
  /** import + 기본 JSX 사용법 — 있으면 문서 상단에 코드블록으로 나온다. */
  readonly usage?: string;
  readonly examples: readonly DocExample[];
  readonly propsTables?: readonly PropsTableDef[];
  /**
   * 가이드형 문서(레이아웃 규격 등)의 자유 본문 — RSC 가능.
   * 예제·Props 표가 어울리지 않는 문서(12-컬럼 그리드 가이드 등)가 쓰는 자리다.
   */
  readonly Body?: ComponentType;
};

/**
 * prop 이름을 실제 Props 타입의 `keyof` 로 강제한다 — 컴포넌트에서 prop 이
 * 개명·삭제되면 typecheck 가 표의 부패를 잡는다. (타입 자동 추출은 불가 —
 * TypeScript 7 은 JS 컴파일러 API 를 제공하지 않는다. 기술스택-결정.md 참조)
 */
export function definePropRows<P>() {
  return (rows: ReadonlyArray<PropRow & { readonly name: keyof P & string }>): readonly PropRow[] =>
    rows;
}
