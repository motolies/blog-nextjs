'use client';

import {
  Badge,
  Button,
  canOpenTab,
  closeOthers,
  closeRightOf,
  closeTab,
  closeUnpinned,
  nextActiveAfterClose,
  togglePin,
  upsertTab,
  WORK_TABS_MAX,
  type WorkTab,
} from '@hvy/ui';
import { useState } from 'react';

/**
 * 상태 순수 함수 9종 — **화면 없이 계산만 본다.**
 *
 * `WorkTabsBar` 는 계산을 전혀 하지 않는다. 탭 배열을 만드는 것은 이 함수들이고,
 * 그래서 이 레포의 vitest(환경 node, DOM 없음)로 단위 테스트가 붙는 유일한 계층이다 —
 * 탭 퇴출·핀 경계는 **틀려도 에러가 안 나고 탭만 조용히 사라지는** 종류라 그 방어가 필요하다.
 *
 * 검증 포인트:
 * · upsertTab 은 내용이 그대로면 **같은 참조**를 돌려준다 — 아래 배지로 확인한다.
 *   이 성질이 호출부가 `tabs` 의존 effect 안에서 불러도 무한 루프에 빠지지 않는 근거다
 * · 상한에 걸린 upsertTab 은 원본을 그대로 돌려주고(거부), canOpenTab 이 그 판정을 미리 노출한다 —
 *   알림(토스트)은 순수 계층이 내지 않으므로 호출부 몫이다
 * · togglePin 전후로 **핀 탭이 항상 앞쪽 연속 구간**이라는 불변식이 유지된다(깨지면 붉게 표시)
 * · closeOthers · closeRightOf · closeUnpinned 는 전부 핀 탭을 남긴다
 * · nextActiveAfterClose 는 오른쪽 → 왼쪽 → null 순이다(브라우저 탭과 같은 규칙)
 * · WORK_TABS_MAX 는 전역 상한이지만 메뉴 스코프 로컬 탭은 더 좁은 값을 인자로 넘겨 쓴다
 */

/** 고정 시각 — 화면에 값이 찍히므로 Date.now() 를 쓰면 hydration mismatch 가 난다. */
const NOW = 1_770_000_000_000;

const BASE: readonly WorkTab[] = [
  { id: '/admin/posts', href: '/admin/posts', title: '목록', pinned: true, lastActivatedAt: NOW },
  {
    id: '/admin/tags',
    href: '/admin/tags',
    title: '태그 관리',
    pinned: true,
    lastActivatedAt: NOW,
  },
  { id: '/p/14', href: '/p/14', title: '접근성', pinned: false, lastActivatedAt: NOW },
  { id: '/p/27', href: '/p/27', title: '토큰 설계', pinned: false, lastActivatedAt: NOW },
  { id: '/p/31', href: '/p/31', title: '주간 회고', pinned: false, lastActivatedAt: NOW },
];

/** 로컬 상한 3 — 상한 거부를 두 탭만으로 보여주기 위한 좁은 값이다. */
const SMALL_MAX = 3;

type Case = {
  readonly id: string;
  readonly call: string;
  readonly result: readonly WorkTab[];
  readonly note?: string;
};

/** 핀이 앞쪽 연속 구간인가 — 이 배열의 유일한 불변식이다. */
function pinnedIsPrefix(tabs: readonly WorkTab[]): boolean {
  const firstUnpinned = tabs.findIndex((tab) => !tab.pinned);
  return firstUnpinned < 0 || tabs.slice(firstUnpinned).every((tab) => !tab.pinned);
}

function render(tabs: readonly WorkTab[]): string {
  return tabs.length === 0
    ? '(빈 배열)'
    : tabs.map((tab) => (tab.pinned ? `📌${tab.title}` : tab.title)).join(' · ');
}

export function WorkTabsStateFnsDemo() {
  const [tabs, setTabs] = useState<readonly WorkTab[]>(BASE);

  /** 같은 내용으로 다시 부르면 참조가 유지되는가 — 이 데모의 핵심 성질이다. */
  const sameEntry = { id: '/p/27', href: '/p/27', title: '토큰 설계' };
  const upserted = upsertTab(tabs, sameEntry, NOW);
  const referenceKept = upserted === tabs;

  const overflowTabs = tabs.slice(0, SMALL_MAX);
  const overflowEntry = { id: '/p/99', href: '/p/99', title: '새 글' };
  const overflowResult = upsertTab(overflowTabs, overflowEntry, NOW, SMALL_MAX);

  const cases: readonly Case[] = [
    {
      id: 'togglePin',
      call: "togglePin(tabs, '/p/14')",
      result: togglePin(tabs, '/p/14'),
      note: '고정은 핀 그룹 끝으로 — 경계에 붙으므로 멀리 점프하지 않는다',
    },
    {
      id: 'closeOthers',
      call: "closeOthers(tabs, '/p/27')",
      result: closeOthers(tabs, '/p/27'),
      note: '지목한 탭 + 핀 탭만 남는다',
    },
    {
      id: 'closeRightOf',
      call: "closeRightOf(tabs, '/p/14')",
      result: closeRightOf(tabs, '/p/14'),
      note: '오른쪽을 닫되 핀은 남긴다',
    },
    { id: 'closeUnpinned', call: 'closeUnpinned(tabs)', result: closeUnpinned(tabs) },
    {
      id: 'closeTab',
      call: "closeTab(tabs, '/admin/tags')",
      result: closeTab(tabs, '/admin/tags'),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button size="xs" variant="outline-gray" onClick={() => setTabs(BASE)}>
          입력 되돌리기
        </Button>
        <Button size="xs" variant="outline-gray" onClick={() => setTabs(togglePin(tabs, '/p/14'))}>
          입력에 togglePin 적용
        </Button>
      </div>

      <section className="rounded-dl-control bg-dl-canvas p-3">
        <p className="text-dl-xs text-dl-fg-muted">입력 tabs</p>
        <p className="mt-1 font-dl-mono text-dl-sm text-dl-fg">{render(tabs)}</p>
        <p className="mt-1 text-dl-xs">
          불변식(핀이 앞쪽 연속 구간):{' '}
          {pinnedIsPrefix(tabs) ? (
            <Badge tone="success" size="xs">
              유지
            </Badge>
          ) : (
            <Badge tone="danger" size="xs">
              깨짐
            </Badge>
          )}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="text-dl-xs font-semibold text-dl-fg-strong">참조 동일성 · 상한 거부</h4>
        <dl className="flex flex-col gap-2 text-dl-xs">
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-dl-mono text-dl-fg">upsertTab(tabs, 같은내용) === tabs</dt>
            <dd>
              {referenceKept ? (
                <Badge tone="success" size="xs">
                  같은 참조
                </Badge>
              ) : (
                <Badge tone="danger" size="xs">
                  새 배열
                </Badge>
              )}
              <span className="ml-2 text-dl-fg-muted">
                내용이 그대로면 새 배열을 만들지 않는다 — effect 안에서 불러도 수렴한다
              </span>
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-dl-mono text-dl-fg">canOpenTab(3개, 새 id, max=3)</dt>
            <dd>
              <Badge
                tone={canOpenTab(overflowTabs, '/p/99', SMALL_MAX) ? 'success' : 'warning'}
                size="xs"
              >
                {String(canOpenTab(overflowTabs, '/p/99', SMALL_MAX))}
              </Badge>
              <span className="ml-2 text-dl-fg-muted">
                upsertTab 결과도 {overflowResult === overflowTabs ? '원본 그대로(거부)' : '추가됨'}{' '}
                — 거부 안내는 호출부가 띄운다
              </span>
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-dl-mono text-dl-fg">nextActiveAfterClose(tabs, '/p/27')</dt>
            <dd className="text-dl-fg">
              {nextActiveAfterClose(tabs, '/p/27')?.title ?? '(없음)'}
              <span className="ml-2 text-dl-fg-muted">오른쪽 우선, 없으면 왼쪽</span>
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <dt className="font-dl-mono text-dl-fg">WORK_TABS_MAX</dt>
            <dd className="text-dl-fg">
              {WORK_TABS_MAX}
              <span className="ml-2 text-dl-fg-muted">
                전역 상한 — 메뉴 스코프 로컬 탭은 더 좁은 값을 인자로 넘긴다
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="text-dl-xs font-semibold text-dl-fg-strong">
          닫기·핀 계열 (원본은 안 바뀐다)
        </h4>
        <ul className="flex flex-col gap-2">
          {cases.map((entry) => (
            <li key={entry.id} className="rounded-dl-control bg-dl-canvas px-3 py-2">
              <p className="font-dl-mono text-dl-xs text-dl-fg-muted">{entry.call}</p>
              <p className="mt-0.5 font-dl-mono text-dl-sm text-dl-fg">{render(entry.result)}</p>
              {entry.note ? (
                <p className="mt-0.5 text-dl-xs text-dl-fg-muted">{entry.note}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
