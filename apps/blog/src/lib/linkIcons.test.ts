import { describe, expect, it } from 'vitest';
import { filterIconGroups, LINK_ICON_GROUPS, LINK_ICON_NAMES, resolveLinkIcon } from './linkIcons';

describe('LINK_ICON_GROUPS', () => {
  it('아이콘 이름이 중복되지 않는다 — 조회표가 조용히 덮어써지면 안 된다', () => {
    expect(new Set(LINK_ICON_NAMES).size).toBe(LINK_ICON_NAMES.length);
  });

  it('모든 항목이 이름·컴포넌트·검색어를 갖춘다', () => {
    for (const group of LINK_ICON_GROUPS) {
      expect(group.icons.length).toBeGreaterThan(0);
      for (const entry of group.icons) {
        expect(entry.name).toMatch(/^[A-Z][A-Za-z0-9]*$/);
        expect(entry.icon).toBeTruthy();
        // 한글 검색어가 없으면 "어떤 아이콘이 있는지 모르는 사람"이 찾을 수 없다.
        expect(entry.keywords).toMatch(/[가-힣]/);
      }
    }
  });
});

describe('resolveLinkIcon', () => {
  it('값이 없으면 null — 호출부가 아이콘 자리를 생략한다', () => {
    expect(resolveLinkIcon(undefined)).toBeNull();
    expect(resolveLinkIcon(null)).toBeNull();
    expect(resolveLinkIcon('')).toBeNull();
  });

  it('등록된 이름은 해당 컴포넌트를 준다', () => {
    expect(resolveLinkIcon('Rocket')).toBe(
      LINK_ICON_GROUPS.flatMap((g) => g.icons).find((e) => e.name === 'Rocket')?.icon,
    );
  });

  it('알 수 없는 이름은 폴백을 준다 — null 이 아니다(값 없음과 구분된다)', () => {
    const fallback = resolveLinkIcon('NoSuchIcon');
    expect(fallback).not.toBeNull();
    expect(fallback).toBe(resolveLinkIcon('Link2'));
  });
});

describe('filterIconGroups', () => {
  it('빈 검색어는 전체를 그대로 돌려준다', () => {
    expect(filterIconGroups('')).toBe(LINK_ICON_GROUPS);
    expect(filterIconGroups('   ')).toBe(LINK_ICON_GROUPS);
  });

  it('영어 이름으로 찾는다 (대소문자 무시)', () => {
    const names = filterIconGroups('rocket').flatMap((g) => g.icons.map((e) => e.name));
    expect(names).toContain('Rocket');
  });

  it('한글 검색어로 찾는다 — 이 목록의 존재 이유다', () => {
    const names = filterIconGroups('배포').flatMap((g) => g.icons.map((e) => e.name));
    expect(names).toContain('Rocket');
    expect(names).toContain('Ship');
  });

  it('결과가 없는 그룹은 빼고, 아무것도 없으면 빈 배열', () => {
    expect(filterIconGroups('존재하지않는검색어')).toEqual([]);
    for (const group of filterIconGroups('차트')) {
      expect(group.icons.length).toBeGreaterThan(0);
    }
  });
});
