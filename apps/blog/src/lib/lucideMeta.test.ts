import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { describe, expect, it } from 'vitest';
import { LINK_ICON_NAMES } from './linkIcons';
import {
  buildCatalog,
  CATEGORY_TITLE_KO,
  type LucideMeta,
  normalizeQuery,
  searchCatalog,
  toLucideKebab,
  toPascalCase,
} from './lucideMeta';
import rawMeta from './lucideMeta.json';

const require = createRequire(import.meta.url);
const lucideDir = path.dirname(require.resolve('lucide-react/package.json'));
const meta = rawMeta as LucideMeta;
const catalog = buildCatalog(meta);
const dynamicKeys = new Set(Object.keys(dynamicIconImports));

/** d.ts 에서 `@deprecated` 직전의 `declare const X` 를 다시 뽑는다 — 생성 스크립트와 같은 규칙. */
function readDeprecatedFromDts(): string[] {
  const dts = readFileSync(path.join(lucideDir, 'dist/lucide-react.d.ts'), 'utf8');
  const names = new Set<string>();
  for (const m of dts.matchAll(/@deprecated[^\n]*\n\s*\*\/\s*\ndeclare const (\w+):/g))
    names.add(m[1]);
  return [...names].map(toLucideKebab).sort();
}

describe('lucideMeta.json — 설치된 lucide-react 와의 동기', () => {
  it('version 이 설치 버전과 같다 — 다르면 `pnpm -F blog gen:lucide-meta` 로 재생성한다', () => {
    const installed = JSON.parse(
      readFileSync(path.join(lucideDir, 'package.json'), 'utf8'),
    ).version;
    expect(meta.version).toBe(installed);
  });

  it('모든 아이콘·별칭 이름이 dynamicIconImports 의 키다 — 목록에 있는데 못 그리는 이름이 없다', () => {
    for (const [key, icon] of Object.entries(meta.icons)) {
      expect(dynamicKeys.has(key), key).toBe(true);
      for (const alias of icon.a ?? [])
        expect(dynamicKeys.has(alias), `${key} → ${alias}`).toBe(true);
    }
    // 반대 방향: 맵의 키는 정식 이름이거나 어떤 정식 이름의 별칭이다.
    const known = new Set(Object.keys(meta.icons));
    for (const icon of Object.values(meta.icons))
      for (const alias of icon.a ?? []) known.add(alias);
    for (const key of dynamicKeys) expect(known.has(key), key).toBe(true);
  });

  it('deprecated 목록이 d.ts 의 @deprecated 와 일치한다', () => {
    expect([...meta.deprecated].sort()).toEqual(readDeprecatedFromDts());
  });

  it('카테고리 한글 제목이 brands 를 뺀 모든 카테고리를 덮고, 남는 키도 없다', () => {
    const slugs = Object.keys(meta.categories)
      .filter((slug) => slug !== 'brands')
      .sort();
    expect(Object.keys(CATEGORY_TITLE_KO).sort()).toEqual(slugs);
  });
});

describe('이름 변환', () => {
  it('toPascalCase 는 lucide 의 displayName 규칙과 같다', () => {
    expect(toPascalCase('a-arrow-down')).toBe('AArrowDown');
    expect(toPascalCase('grid-2x2')).toBe('Grid2x2');
    expect(toPascalCase('folder-git-2')).toBe('FolderGit2');
    expect(toPascalCase('arrow-down-a-z')).toBe('ArrowDownAZ');
  });

  it('toLucideKebab 은 숫자 세그먼트를 lucide 규칙대로 자른다', () => {
    expect(toLucideKebab('Grid2x2')).toBe('grid-2x2');
    expect(toLucideKebab('FolderGit2')).toBe('folder-git-2');
    expect(toLucideKebab('Rotate3d')).toBe('rotate-3d');
    expect(toLucideKebab('Clock12')).toBe('clock-12');
    expect(toLucideKebab('AArrowDown')).toBe('a-arrow-down');
    expect(toLucideKebab('Link2')).toBe('link-2');
  });

  it('정식 이름 전부가 자기 자신 또는 자기 별칭으로 왕복한다 — 피커가 저장한 값은 반드시 같은 아이콘으로 돌아온다', () => {
    // arrow-down-0-1 의 PascalCase 는 ArrowDown01 이고 이는 별칭 arrow-down-01 로 풀린다.
    // lucide 가 두 키를 같은 모듈로 묶어 두었으므로 결과는 같은 아이콘이다(아래 별칭 테스트가 모듈 동일성을 본다).
    for (const [key, icon] of Object.entries(meta.icons)) {
      const back = toLucideKebab(toPascalCase(key));
      expect(back === key || (icon.a ?? []).includes(back), `${key} → ${back}`).toBe(true);
    }
  });

  it('별칭까지 포함한 맵 키 전부가 로드 가능한 키로 돌아온다(합류하는 별칭은 같은 모듈이다)', async () => {
    const merged: string[] = [];
    for (const key of dynamicKeys) {
      const back = toLucideKebab(toPascalCase(key));
      expect(dynamicKeys.has(back), `${key} → ${back}`).toBe(true);
      if (back !== key) merged.push(key);
    }
    // 예: arrow-down-0-1 과 arrow-down-01 이 둘 다 ArrowDown01 이 된다 — lucide 가 같은 모듈로 묶어 둔 별칭이다.
    expect(merged.length).toBeLessThanOrEqual(8);
    for (const key of merged) {
      const back = toLucideKebab(toPascalCase(key));
      const [a, b] = await Promise.all([
        dynamicIconImports[key as keyof typeof dynamicIconImports](),
        dynamicIconImports[back as keyof typeof dynamicIconImports](),
      ]);
      expect(a.default, `${key} vs ${back}`).toBe(b.default);
    }
  });
});

describe('buildCatalog', () => {
  it('deprecated 를 빼고 알파벳순으로 담는다', () => {
    expect(catalog.entries).toHaveLength(Object.keys(meta.icons).length - meta.deprecated.length);
    const keys = catalog.entries.map((e) => e.key);
    expect(keys).toEqual([...keys].sort());
    for (const dead of meta.deprecated) expect(keys).not.toContain(dead);
  });

  it('큐레이션 85개가 전부 카탈로그에 있다 — 큐레이션이 deprecated 를 품지 않는다', () => {
    const names = new Set(catalog.entries.map((e) => e.name));
    for (const name of LINK_ICON_NAMES) expect(names.has(name), name).toBe(true);
  });

  it('카테고리는 brands 를 빼고 한글 제목 가나다순이며 개수가 실제와 맞는다', () => {
    expect(catalog.categories.map((c) => c.slug)).not.toContain('brands');
    const titles = catalog.categories.map((c) => c.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'ko')));
    for (const category of catalog.categories) {
      expect(category.title).toBe(CATEGORY_TITLE_KO[category.slug]);
      expect(category.count).toBe(
        catalog.entries.filter((e) => e.categories.includes(category.slug)).length,
      );
      expect(category.count).toBeGreaterThan(0);
    }
  });
});

describe('searchCatalog', () => {
  it('공백·하이픈·대소문자를 무시하고 같은 결과를 준다', () => {
    const a = searchCatalog(catalog, 'arrow-right').map((e) => e.name);
    expect(a[0]).toBe('ArrowRight');
    expect(searchCatalog(catalog, 'arrow right').map((e) => e.name)).toEqual(a);
    expect(searchCatalog(catalog, 'ArrowRight').map((e) => e.name)).toEqual(a);
    expect(normalizeQuery('Arrow Right-Left_x')).toBe('arrowrightleftx');
  });

  it('이름 접두 → 이름 포함 → 태그 순으로 세운다', () => {
    const names = searchCatalog(catalog, 'camera').map((e) => e.name);
    expect(names[0]).toBe('Camera');
    expect(names.indexOf('Camera')).toBeLessThan(names.indexOf('Aperture'));
    expect(searchCatalog(catalog, 'photo').map((e) => e.name)).toContain('Camera');
  });

  it('별칭(옛 이름)으로도 찾는다 — 저장된 옛 값을 다시 고를 수 있어야 한다', () => {
    expect(searchCatalog(catalog, 'file-edit').map((e) => e.key)).toContain('file-pen');
  });

  it('카테고리로 좁힌다 — 빈 검색어면 그 카테고리 전체', () => {
    const charts = catalog.categories.find((c) => c.slug === 'charts');
    expect(charts).toBeDefined();
    const scoped = searchCatalog(catalog, '', 'charts');
    expect(scoped).toHaveLength(charts?.count ?? -1);
    for (const entry of searchCatalog(catalog, 'line', 'charts')) {
      expect(entry.categories).toContain('charts');
    }
  });

  it('아무것도 없으면 빈 배열', () => {
    expect(searchCatalog(catalog, '존재하지않는검색어')).toEqual([]);
  });
});
