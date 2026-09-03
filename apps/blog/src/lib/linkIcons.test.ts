import { describe, expect, it } from 'vitest';
import { loadLinkIcon } from './lazyLinkIcon';
import {
  filterIconGroups,
  LINK_ICON_FALLBACK,
  LINK_ICON_GROUPS,
  LINK_ICON_NAMES,
  resolveLinkIcon,
} from './linkIcons';

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

  it('큐레이션 이름은 정적 컴포넌트를 그대로 준다', () => {
    expect(resolveLinkIcon('Rocket')).toBe(
      LINK_ICON_GROUPS.flatMap((g) => g.icons).find((e) => e.name === 'Rocket')?.icon,
    );
    expect(resolveLinkIcon('Link2')).toBe(LINK_ICON_FALLBACK);
  });

  it('큐레이션 밖 이름은 null 이 아닌 lazy 래퍼이고, 같은 이름은 같은 참조다(렌더마다 새로 만들면 깜빡인다)', () => {
    const Lazy = resolveLinkIcon('Camera');
    expect(Lazy).not.toBeNull();
    expect(Lazy).not.toBe(LINK_ICON_FALLBACK);
    expect(resolveLinkIcon('Camera')).toBe(Lazy);
    expect(resolveLinkIcon('Anchor')).not.toBe(Lazy);
    expect(Lazy?.displayName).toBe('LazyLinkIcon(Camera)');
  });
});

describe('loadLinkIcon', () => {
  it('lucide 에 있는 이름은 그 아이콘 컴포넌트로 풀린다', async () => {
    expect((await loadLinkIcon('Camera', LINK_ICON_FALLBACK)).displayName).toBe('Camera');
    // 별칭이 합류하는 이름도 같은 아이콘으로 풀린다.
    expect((await loadLinkIcon('ArrowDown01', LINK_ICON_FALLBACK)).displayName).toBe('ArrowDown01');
  });

  it('알 수 없는 이름은 폴백 — 값 없음(null)과 구분된다', async () => {
    expect(await loadLinkIcon('NoSuchIcon', LINK_ICON_FALLBACK)).toBe(LINK_ICON_FALLBACK);
  });

  it('프로토타입 키와 겹치는 이름도 폴백이다 — `in` 으로 조회하면 Object() 가 튀어나온다', async () => {
    for (const name of ['Constructor', 'ToString', 'HasOwnProperty', '__proto__']) {
      expect(await loadLinkIcon(name, LINK_ICON_FALLBACK), name).toBe(LINK_ICON_FALLBACK);
    }
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

  it('keywords 의 대문자 약어도 소문자 검색어로 찾는다 — 안내문의 예시 "db" 가 실제로 되어야 한다', () => {
    const names = filterIconGroups('db').flatMap((g) => g.icons.map((e) => e.name));
    expect(names).toContain('Database');
  });

  it('결과가 없는 그룹은 빼고, 아무것도 없으면 빈 배열', () => {
    expect(filterIconGroups('존재하지않는검색어')).toEqual([]);
    for (const group of filterIconGroups('차트')) {
      expect(group.icons.length).toBeGreaterThan(0);
    }
  });
});
