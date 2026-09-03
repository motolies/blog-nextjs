/**
 * lucide 전체 아이콘 카탈로그 — 피커의 "전체·카테고리·태그 검색"을 위한 순수 계층.
 *
 * 원천은 `scripts/gen-lucide-meta.mjs` 가 lucide 저장소(설치 버전과 같은 tag)에서 만든
 * `lucideMeta.json` 이다. 아이콘 **코드**는 여기 없다 — 이름·태그·카테고리뿐이라 1,702개를 담아도
 * 220KB 남짓이고, 그마저 `loadLucideMeta()` 로 피커가 열릴 때만 지연 로드한다. 실제 SVG 는
 * `lazyLinkIcon.tsx` 가 이름 하나당 청크 하나로 가져온다.
 *
 * React·lucide 무의존이라 node 환경 vitest 로 단위 테스트가 된다(`linkTree.ts` 와 같은 규약).
 */

import { toPascalCase } from './lucideName';

export { toLucideKebab, toPascalCase } from './lucideName';

export interface LucideMetaIcon {
  /** 태그(영문 동의어). lucide.dev 검색이 보는 것과 같다. */
  readonly t: readonly string[];
  /** 카테고리 slug 목록. */
  readonly c: readonly string[];
  /** 옛 이름(kebab, deprecated 별칭). 저장된 값이 옛 이름이어도 렌더는 된다. */
  readonly a?: readonly string[];
}

export interface LucideMeta {
  /** 생성 당시 lucide-react 버전. 설치 버전과 다르면 테스트가 재생성을 요구한다. */
  readonly version: string;
  /** slug → 영문 제목. */
  readonly categories: Readonly<Record<string, string>>;
  /** 브랜드 아이콘 등 `@deprecated` 로 표시된 kebab 이름 — 피커에 노출하지 않는다. */
  readonly deprecated: readonly string[];
  /** kebab 이름 → 메타. 키가 곧 정식 아이콘 목록이다. */
  readonly icons: Readonly<Record<string, LucideMetaIcon>>;
}

export interface LucideCatalogEntry {
  /** PascalCase — DB(`attributes.icon`)에 저장되는 값이자 lucide 컴포넌트 이름. */
  readonly name: string;
  /** kebab — lucide `dynamicIconImports` 의 키. */
  readonly key: string;
  readonly tags: readonly string[];
  readonly categories: readonly string[];
  readonly aliases: readonly string[];
}

export interface LucideCategory {
  readonly slug: string;
  /** 한글 제목. 매핑이 없는 새 slug 는 영문 제목으로 폴백한다. */
  readonly title: string;
  readonly count: number;
}

export interface LucideCatalog {
  readonly version: string;
  /** deprecated 를 뺀 정식 아이콘, key 기준 알파벳순. */
  readonly entries: readonly LucideCatalogEntry[];
  /** `brands` 를 뺀 카테고리, 한글 제목 가나다순. */
  readonly categories: readonly LucideCategory[];
}

/**
 * 카테고리 한글 제목. lucide 의 42개(brands 제외)를 손으로 옮겼다 — 피커의 나머지 UI 가 전부
 * 한글이라 여기만 영문이면 이질적이다. lucide 가 카테고리를 추가하면 테스트가 누락을 알린다.
 */
export const CATEGORY_TITLE_KO: Readonly<Record<string, string>> = {
  accessibility: '접근성',
  account: '계정 · 접근',
  animals: '동물',
  arrows: '화살표',
  buildings: '건물',
  charts: '차트',
  communication: '커뮤니케이션',
  connectivity: '연결',
  cursors: '커서',
  design: '디자인',
  development: '코딩 · 개발',
  devices: '기기',
  emoji: '이모지',
  files: '파일',
  finance: '금융',
  'food-beverage': '음식 · 음료',
  gaming: '게임',
  home: '홈',
  layout: '레이아웃',
  mail: '메일',
  math: '수학',
  medical: '의료',
  multimedia: '멀티미디어',
  nature: '자연',
  navigation: '내비게이션 · 장소',
  notifications: '알림',
  people: '사람',
  photography: '사진',
  science: '과학',
  seasons: '계절',
  security: '보안',
  shapes: '도형',
  shopping: '쇼핑',
  social: '소셜',
  sports: '스포츠',
  sustainability: '지속가능성',
  text: '텍스트 서식',
  time: '시간 · 달력',
  tools: '도구',
  transportation: '교통',
  travel: '여행',
  weather: '날씨',
};

/** 브랜드 아이콘 카테고리 — deprecated 를 빼면 4개만 남아 칩으로 둘 가치가 없다(아이콘 자체는 다른 카테고리·전체에 나온다). */
const EXCLUDED_CATEGORY = 'brands';

/** 검색어·이름 정규화 — 소문자화 후 공백·하이픈·언더스코어 제거. `arrow-right`·`arrow right`·`ArrowRight` 가 같아진다. */
export function normalizeQuery(text: string): string {
  return text.toLowerCase().replace(/[\s\-_]+/g, '');
}

/** JSON 메타를 피커가 쓰는 카탈로그로 바꾼다. deprecated 아이콘과 brands 카테고리는 여기서 빠진다. */
export function buildCatalog(meta: LucideMeta): LucideCatalog {
  const deprecated = new Set(meta.deprecated);
  const entries: LucideCatalogEntry[] = Object.keys(meta.icons)
    .filter((key) => !deprecated.has(key))
    .sort()
    .map((key) => {
      const icon = meta.icons[key];
      return {
        name: toPascalCase(key),
        key,
        tags: icon.t,
        categories: icon.c,
        aliases: icon.a ?? [],
      };
    });

  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const slug of entry.categories) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  const categories: LucideCategory[] = Object.entries(meta.categories)
    .filter(([slug]) => slug !== EXCLUDED_CATEGORY && (counts.get(slug) ?? 0) > 0)
    .map(([slug, englishTitle]) => ({
      slug,
      title: CATEGORY_TITLE_KO[slug] ?? englishTitle,
      count: counts.get(slug) ?? 0,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'ko'));

  return { version: meta.version, entries, categories };
}

/** 매칭 등급 — 낮을수록 앞에 온다. 0 = 이름 접두, 1 = 이름·별칭 포함, 2 = 태그 포함. */
function matchRank(entry: LucideCatalogEntry, normalized: string): number | null {
  const name = normalizeQuery(entry.key);
  if (name.startsWith(normalized)) return 0;
  if (name.includes(normalized)) return 1;
  if (entry.aliases.some((alias) => normalizeQuery(alias).includes(normalized))) return 1;
  if (entry.tags.some((tag) => normalizeQuery(tag).includes(normalized))) return 2;
  return null;
}

/**
 * 카탈로그 검색. 카테고리로 먼저 좁히고(없으면 전체), 검색어는 이름 접두 → 이름·별칭 포함 → 태그
 * 순으로 등급을 매겨 앞에 세운다. 빈 검색어는 범위 안 전체를 알파벳순 그대로 돌려준다.
 */
export function searchCatalog(
  catalog: LucideCatalog,
  query: string,
  categorySlug?: string | null,
): readonly LucideCatalogEntry[] {
  const scoped = categorySlug
    ? catalog.entries.filter((entry) => entry.categories.includes(categorySlug))
    : catalog.entries;
  const normalized = normalizeQuery(query);
  if (!normalized) return scoped;

  const ranked: { entry: LucideCatalogEntry; rank: number }[] = [];
  for (const entry of scoped) {
    const rank = matchRank(entry, normalized);
    if (rank !== null) ranked.push({ entry, rank });
  }
  // 같은 등급 안에서는 원래(알파벳) 순서를 유지한다 — Array.prototype.sort 는 안정 정렬이다.
  ranked.sort((a, b) => a.rank - b.rank);
  return ranked.map((item) => item.entry);
}

/** 메타 JSON 지연 로드 — 피커가 열릴 때만. 별도 청크라 관리 화면 초기 번들에도 실리지 않는다. */
export async function loadLucideMeta(): Promise<LucideMeta> {
  const module = await import('./lucideMeta.json');
  return module.default as LucideMeta;
}

let catalogPromise: Promise<LucideCatalog> | undefined;

/**
 * 카탈로그를 한 번만 만들어 재사용한다 — 피커를 닫았다 열어도 JSON 을 다시 파싱하지 않는다.
 * 실패한 약속은 캐시에서 비워 다음 열기에서 다시 시도한다(네트워크 순단이 영구 실패가 되지 않게).
 */
export function loadLucideCatalog(): Promise<LucideCatalog> {
  if (!catalogPromise) {
    const promise = loadLucideMeta().then(buildCatalog);
    promise.catch(() => {
      catalogPromise = undefined;
    });
    catalogPromise = promise;
  }
  return catalogPromise;
}
