import { describe, expect, it } from 'vitest';
import {
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
} from './workTabsState';

/** 탭 픽스처 — pinned 는 항상 앞쪽 연속 구간이라는 불변식대로 만든다. */
function tab(id: string, options: Partial<Omit<WorkTab, 'id'>> = {}): WorkTab {
  return {
    id,
    href: options.href ?? id,
    title: options.title ?? id,
    pinned: options.pinned ?? false,
    lastActivatedAt: options.lastActivatedAt ?? 0,
  };
}

function ids(tabs: readonly WorkTab[]): readonly string[] {
  return tabs.map((item) => item.id);
}

describe('upsertTab', () => {
  it('없는 탭은 뒤에 추가한다', () => {
    const next = upsertTab([tab('/a')], { id: '/b', href: '/b?x=1', title: 'B' }, 10);
    expect(ids(next)).toEqual(['/a', '/b']);
    expect(next[1]).toMatchObject({ href: '/b?x=1', title: 'B', pinned: false });
  });

  it('href·title 이 그대로면 같은 참조를 반환한다 — 자가 복구 effect 의 수렴 조건', () => {
    const tabs = [tab('/a', { href: '/a?x=1', title: 'A' })];
    expect(upsertTab(tabs, { id: '/a', href: '/a?x=1', title: 'A' }, 99)).toBe(tabs);
  });

  it('같은 id 재방문은 자리를 지키고 href·title·활성 시각만 갱신한다(중복 방지)', () => {
    const next = upsertTab(
      [tab('/a'), tab('/b', { lastActivatedAt: 1 })],
      { id: '/a', href: '/a/123', title: 'A2' },
      99,
    );
    expect(ids(next)).toEqual(['/a', '/b']);
    expect(next[0]).toMatchObject({ href: '/a/123', title: 'A2', lastActivatedAt: 99 });
  });

  it('상한 도달 시 신규 탭은 거부한다 — 원본 참조를 그대로 반환', () => {
    const full = Array.from({ length: WORK_TABS_MAX }, (_, i) =>
      tab(`/t${i}`, { lastActivatedAt: i + 1 }),
    );
    const next = upsertTab(full, { id: '/new', href: '/new', title: 'N' }, 100);
    expect(next).toBe(full); // 아무 탭도 닫히지 않고, 아무 탭도 추가되지 않는다
  });

  it('상한 상태에서도 기존 id 갱신(재방문)은 정상 동작한다', () => {
    const full = Array.from({ length: WORK_TABS_MAX }, (_, i) =>
      tab(`/t${i}`, { lastActivatedAt: i + 1 }),
    );
    const next = upsertTab(full, { id: '/t0', href: '/t0/detail', title: 'T0' }, 100);
    expect(next).toHaveLength(WORK_TABS_MAX);
    expect(next[0]).toMatchObject({ href: '/t0/detail', lastActivatedAt: 100 });
  });
});

describe('canOpenTab — upsertTab 거부 판정과 같은 식', () => {
  const full = Array.from({ length: WORK_TABS_MAX }, (_, i) => tab(`/t${i}`));

  it('이미 열린 탭은 상한 상태에서도 열 수 있다(갱신)', () => {
    expect(canOpenTab(full, '/t0')).toBe(true);
  });

  it('상한 미만이면 신규 탭을 열 수 있다', () => {
    expect(canOpenTab(full.slice(0, WORK_TABS_MAX - 1), '/new')).toBe(true);
  });

  it('상한 도달 시 신규 탭은 열 수 없다', () => {
    expect(canOpenTab(full, '/new')).toBe(false);
  });
});

describe('닫기 3종 — 전부 핀 탭을 보존한다', () => {
  const tabs = [
    tab('/p1', { pinned: true }),
    tab('/p2', { pinned: true }),
    tab('/a'),
    tab('/b'),
    tab('/c'),
  ];

  it('closeOthers 는 지목 탭 + 핀만 남긴다', () => {
    expect(ids(closeOthers(tabs, '/b'))).toEqual(['/p1', '/p2', '/b']);
  });

  it('closeRightOf 는 오른쪽 비핀만 닫는다', () => {
    expect(ids(closeRightOf(tabs, '/a'))).toEqual(['/p1', '/p2', '/a']);
  });

  it('closeRightOf 의 기준이 핀 탭이면 나머지 핀도 남는다', () => {
    expect(ids(closeRightOf(tabs, '/p1'))).toEqual(['/p1', '/p2']);
  });

  it('closeUnpinned 는 핀만 남긴다(핀 제외 전체 닫기)', () => {
    expect(ids(closeUnpinned(tabs))).toEqual(['/p1', '/p2']);
  });

  it('closeTab 은 명시적 의도라 핀도 닫는다', () => {
    expect(ids(closeTab(tabs, '/p1'))).toEqual(['/p2', '/a', '/b', '/c']);
  });
});

describe('togglePin — 핀 그룹이 앞쪽 연속 구간이라는 불변식을 유지한다', () => {
  it('고정하면 핀 그룹 끝으로 이동한다', () => {
    const tabs = [tab('/p1', { pinned: true }), tab('/a'), tab('/b')];
    const next = togglePin(tabs, '/b');
    expect(ids(next)).toEqual(['/p1', '/b', '/a']);
    expect(next[1]?.pinned).toBe(true);
  });

  it('해제하면 비핀 그룹 앞으로 이동한다', () => {
    const tabs = [tab('/p1', { pinned: true }), tab('/p2', { pinned: true }), tab('/a')];
    const next = togglePin(tabs, '/p1');
    expect(ids(next)).toEqual(['/p2', '/p1', '/a']);
    expect(next[1]?.pinned).toBe(false);
  });

  it('없는 id 는 무시한다', () => {
    const tabs = [tab('/a')];
    expect(togglePin(tabs, '/ghost')).toBe(tabs);
  });
});

describe('nextActiveAfterClose', () => {
  const tabs = [tab('/a'), tab('/b'), tab('/c')];

  it('오른쪽 이웃을 우선한다', () => {
    expect(nextActiveAfterClose(tabs, '/b')?.id).toBe('/c');
  });

  it('오른쪽이 없으면 왼쪽이다', () => {
    expect(nextActiveAfterClose(tabs, '/c')?.id).toBe('/b');
  });

  it('남는 탭이 없으면 null', () => {
    expect(nextActiveAfterClose([tab('/only')], '/only')).toBeNull();
  });
});
