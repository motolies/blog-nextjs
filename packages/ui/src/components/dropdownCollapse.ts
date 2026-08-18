import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

/**
 * "아이템이 하나뿐인 메뉴는 메뉴가 아니다" — 접힘 판정의 순수 로직.
 *
 * `dropdown-menu.tsx` 에서 떼어 둔 이유는 둘이다.
 *  1. vitest 환경이 node(DOM 없음)라 **렌더 없이 검증되는 것만 테스트가 된다.**
 *     엘리먼트 트리 판정은 렌더가 필요 없으므로 여기로 내리면 전 분기를 못 박을 수 있다.
 *  2. 자식 트리를 훑는 것은 이 레포가 평소 **피하는** 일이다(field.tsx 머리말 —
 *     오류를 cloneElement 로 자식에게 주입하지 않는다). 예외를 두되 **읽기만** 하고,
 *     결과 전달은 컨텍스트 하향으로 한다. 그 예외를 이 파일 하나에 가둔다.
 *
 * 훑기 규칙(React 실측 기준):
 *  - 배열·조건부는 `Children.toArray` 가 평탄화하고 null/undefined/false 를 지운다.
 *    **빈 문자열은 남는다** — 그래서 `isValidElement` 로 한 번 더 거른다.
 *  - Fragment 는 평탄화되지 **않는다**(자식 1개, type === Fragment). 그래서 아는 부품이
 *    아니면 `props.children` 으로 내려간다 — 임의 래퍼(스크롤 `div`)도 같은 경로다.
 *  - 아이템 안쪽은 파지 않고, 트리거 가지는 통째로 건너뛴다.
 *  - **컴포넌트가 렌더해서 만드는 아이템은 보이지 않는다**(`<MyItems/>` 안의 Item).
 *    엘리먼트 트리는 렌더 전이라 원리적으로 알 수 없다. 그때 결과는 "메뉴 유지" =
 *    현행 동작이라, 조용히 틀리는 대신 조용히 안전하다.
 */

/** 판정에 필요한 아이템 prop 만 — 타입 정본은 dropdown-menu.tsx 다. */
type MenuItemLikeProps = {
  readonly onSelect?: () => void;
  readonly disabled?: boolean;
  readonly children?: ReactNode;
};

/** 부품 판별 — 호출부가 `type === DropdownMenuItem` 같은 동일성 비교를 넘긴다. */
export type MenuScan = {
  readonly isItem: (type: unknown) => boolean;
  /** 묶음 제목 — 하나여도 접지 않는 근거가 된다(패널에 읽을 것이 있다). */
  readonly isLabel: (type: unknown) => boolean;
  /** 훑지 않을 가지 — 트리거. 버튼 안쪽은 메뉴가 아니다. */
  readonly isSkipped: (type: unknown) => boolean;
};

/** 아이템이 하나일 때의 발화 정보. 아니면 null. */
export type SoleItem = {
  readonly onSelect: (() => void) | undefined;
  readonly disabled: boolean;
  /** 트리거 라벨은 그대로 두고 **툴팁으로만** 무엇이 실행되는지 알린다(비활성 사유 겸용). */
  readonly title: string | undefined;
} | null;

export type MenuScanResult = {
  readonly itemCount: number;
  readonly hasLabel: boolean;
  readonly sole: SoleItem;
};

/** 트리거 안에 트리거가 있는 트리는 없다 — 병리적 중첩에서 스택을 지키는 상한. */
const MAX_DEPTH = 8;

type Collected = {
  readonly items: ReactElement<MenuItemLikeProps>[];
  hasLabel: boolean;
};

/** 아는 부품이 나올 때까지 내려가며 아이템을 모은다. */
function walk(node: ReactNode, scan: MenuScan, depth: number, out: Collected): void {
  if (depth > MAX_DEPTH) return;
  for (const child of Children.toArray(node)) {
    // 문자열·숫자는 아이템이 아니다 — toArray 는 빈 문자열을 지우지 않는다.
    if (!isValidElement<MenuItemLikeProps>(child)) continue;
    const type: unknown = child.type;
    if (scan.isSkipped(type)) continue;
    if (scan.isLabel(type)) {
      out.hasLabel = true;
      continue;
    }
    if (scan.isItem(type)) {
      out.items.push(child);
      continue;
    }
    walk(child.props.children, scan, depth + 1, out);
  }
}

/** 아이템의 글자만 뽑는다. 못 뽑으면 undefined — `ui` 는 사전을 모르므로 지어내지 않는다. */
export function textOf(node: ReactNode, depth = 0): string | undefined {
  if (depth > MAX_DEPTH) return undefined;
  const parts: string[] = [];
  for (const child of Children.toArray(node)) {
    if (typeof child === 'string' || typeof child === 'number') {
      parts.push(String(child));
      continue;
    }
    if (!isValidElement<{ readonly children?: ReactNode }>(child)) continue;
    const nested = textOf(child.props.children, depth + 1);
    if (nested) parts.push(nested);
  }
  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  return text === '' ? undefined : text;
}

/**
 * 메뉴 children 을 훑어 "지금 버튼으로 접혀야 하는가"를 판정한다.
 *
 * 접지 않는 경우 둘.
 *  - 0개 · 2개 이상 — 접을 것이 없거나 고를 것이 있다(0개 경고는 Root 가 낸다).
 *  - Label 이 있다 — 패널에 아이템 말고 **읽을 것**이 있다는 뜻이라 접으면 글자가 사라진다.
 */
export function scanMenu(children: ReactNode, scan: MenuScan): MenuScanResult {
  const found: Collected = { items: [], hasLabel: false };
  walk(children, scan, 0, found);

  const itemCount = found.items.length;
  const item = found.items[0];

  if (itemCount !== 1 || !item || found.hasLabel) {
    return { itemCount, hasLabel: found.hasLabel, sole: null };
  }

  return {
    itemCount,
    hasLabel: false,
    sole: {
      onSelect: item.props.onSelect,
      disabled: item.props.disabled === true,
      title: textOf(item.props.children),
    },
  };
}
