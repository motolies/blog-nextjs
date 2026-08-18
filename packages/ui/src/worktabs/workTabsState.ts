/**
 * 작업 탭 컬렉션 계산 — **순수 함수만 둔다.**
 *
 * `listReorder.ts` 와 같은 이유다: 이 레포의 vitest 환경은 `node` 라 DOM 이 없고,
 * 탭 퇴출·핀 경계는 **틀려도 에러가 안 나고 탭만 조용히 사라지는** 종류라 테스트가 붙어야 한다.
 *
 * 불변식: **핀 탭이 항상 배열 앞쪽 연속 구간이다.** `togglePin` 이 경계를 유지하고,
 * 드래그 재정렬은 `clampToGroup`(dnd/listReorder)이 같은 표식(`pinned`)으로 가둔다.
 *
 * 탭은 URL 라우트의 별칭일 뿐이다 — iframe 도 상태 컨테이너도 아니다.
 * 활성 탭 판정은 이 모듈이 하지 않는다(진실은 현재 pathname, 앱이 안다).
 */

export type WorkTab = {
  /** 메뉴 라우트(예: `/client/orders`). 탭의 정체성이자 중복 판정 키. */
  readonly id: string;
  /** 마지막으로 방문한 URL(pathname+query). 탭 복귀 시 여기로 이동한다. */
  readonly href: string;
  /** 이미 해석된 표시 문자열 — 이 패키지는 사전을 모른다. */
  readonly title: string;
  readonly pinned: boolean;
  /**
   * 닫을 수 있는가(기본 true). `false` 는 「목록」처럼 **바 자체의 앵커**인 탭이다 —
   * 닫기 버튼·닫기 메뉴·핀 UI 를 모두 숨긴다(핀의 자물쇠는 "사용자가 고정했다"는
   * 뜻이라 앵커 탭에는 거짓말이 된다). 일괄 닫기(closeOthers 등)로부터의 보호는
   * `pinned` 가 맡으므로 앵커 탭은 `pinned: true` 와 함께 쓴다.
   */
  readonly closable?: boolean;
  /** 마지막 활성화 시각(epoch ms). 상한 도달 시 LRU 퇴출 기준. */
  readonly lastActivatedAt: number;
};

/**
 * 탭 개수 상한. 도달하면 새 탭이 **열리지 않는다**(자동 퇴출 아님 — 거부).
 * 사용자가 열어 둔 탭을 시스템이 마음대로 닫으면 작업 맥락이 조용히 사라지기 때문이다.
 */
export const WORK_TABS_MAX = 20;

/**
 * 이 id 로 탭을 열 수 있는가 — 이미 열려 있으면(갱신) 언제나 가능, 신규는 상한 미만일 때만.
 * `upsertTab` 의 거부 판정과 같은 식이다. 호출부는 이걸로 거부를 감지해 안내(토스트)를 띄운다 —
 * 순수 계산 계층이라 알림은 여기서 내지 않는다.
 */
export function canOpenTab(
  tabs: readonly WorkTab[],
  id: string,
  max: number = WORK_TABS_MAX,
): boolean {
  return tabs.some((tab) => tab.id === id) || tabs.length < max;
}

/**
 * 탭을 열거나(없으면 추가) 갱신한다(있으면 href·title·활성 시각만).
 *
 * **내비게이션이 곧 탭 열기다** — 같은 메뉴 재방문은 기존 탭의 자리를 지키며 href 만
 * 따라오므로 중복 방지가 별도 검사 없이 성립한다.
 * 신규 탭이 상한(`WORK_TABS_MAX`)을 넘으면 **원본을 그대로 반환**한다(거부) —
 * 거부 안내는 호출부가 `canOpenTab` 으로 판정해 띄운다.
 */
export function upsertTab(
  tabs: readonly WorkTab[],
  entry: { readonly id: string; readonly href: string; readonly title: string },
  now: number,
  max: number = WORK_TABS_MAX,
): readonly WorkTab[] {
  const existing = tabs.find((tab) => tab.id === entry.id);
  if (existing) {
    /**
     * 내용 변화가 없으면 **같은 참조**를 돌려준다 — 호출부가 이 함수를 `tabs` 의존
     * effect 안에서 불러도 참조 동일성으로 수렴한다(자가 복구 패턴, oms orders-local-tabs 참조).
     * 그 대가로 lastActivatedAt 은 href·title 이 실제로 바뀔 때만 갱신된다 —
     * LRU 퇴출이 사라진 지금 이 값을 판정에 쓰는 곳은 없다.
     */
    if (existing.href === entry.href && existing.title === entry.title) return tabs;
    return tabs.map((tab) =>
      tab.id === entry.id
        ? { ...tab, href: entry.href, title: entry.title, lastActivatedAt: now }
        : tab,
    );
  }

  if (tabs.length >= max) return tabs;
  return [
    ...tabs,
    { id: entry.id, href: entry.href, title: entry.title, pinned: false, lastActivatedAt: now },
  ];
}

/** 탭 하나를 닫는다. 명시적 의도이므로 핀 여부와 무관하다(핀 탭은 UI 가 닫기 버튼을 숨긴다). */
export function closeTab(tabs: readonly WorkTab[], id: string): readonly WorkTab[] {
  return tabs.filter((tab) => tab.id !== id);
}

/** 지목한 탭과 핀 탭만 남긴다. */
export function closeOthers(tabs: readonly WorkTab[], id: string): readonly WorkTab[] {
  return tabs.filter((tab) => tab.pinned || tab.id === id);
}

/** 지목한 탭의 오른쪽에 있는 비핀 탭을 닫는다. */
export function closeRightOf(tabs: readonly WorkTab[], id: string): readonly WorkTab[] {
  const anchor = tabs.findIndex((tab) => tab.id === id);
  if (anchor < 0) return tabs;
  return tabs.filter((tab, index) => tab.pinned || index <= anchor);
}

/** 핀 제외 전체 닫기. 활성 탭이 닫혔다면 이동은 앱 책임이다(`nextActiveAfterClose` 참조). */
export function closeUnpinned(tabs: readonly WorkTab[]): readonly WorkTab[] {
  return tabs.filter((tab) => tab.pinned);
}

/**
 * 핀 고정/해제. **핀 그룹이 앞쪽 연속 구간**이라는 불변식을 지키기 위해
 * 고정은 핀 그룹의 끝으로, 해제는 비핀 그룹의 앞으로 이동한다 —
 * 둘 다 경계에 붙으므로 탭이 화면에서 멀리 점프하지 않는다.
 */
export function togglePin(tabs: readonly WorkTab[], id: string): readonly WorkTab[] {
  const target = tabs.find((tab) => tab.id === id);
  if (!target) return tabs;

  const rest = tabs.filter((tab) => tab.id !== id);
  const boundary = rest.filter((tab) => tab.pinned).length;
  const moved: WorkTab = { ...target, pinned: !target.pinned };

  // 고정·해제 모두 "핀 그룹 끝 = 비핀 그룹 앞" 인 같은 슬롯에 끼운다.
  return [...rest.slice(0, boundary), moved, ...rest.slice(boundary)];
}

/**
 * 활성 탭을 닫은 뒤 이동할 이웃 — 오른쪽 우선, 없으면 왼쪽, 남은 탭이 없으면 null.
 * 브라우저 탭과 같은 규칙이라 손에 익은 대로 움직인다.
 */
export function nextActiveAfterClose(tabs: readonly WorkTab[], closedId: string): WorkTab | null {
  const index = tabs.findIndex((tab) => tab.id === closedId);
  if (index < 0) return null;
  return tabs[index + 1] ?? tabs[index - 1] ?? null;
}
