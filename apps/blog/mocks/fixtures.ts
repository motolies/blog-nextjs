/**
 * 블로그 도메인 결정론 픽스처 — Math.random()/Date.now() 금지.
 * 모든 값은 id 의 순수 함수로 파생시켜, 재시작해도 같은 값이 나온다
 * (같은 요청 2회 = 같은 응답이어야 화면 회귀를 목으로 검증할 수 있다).
 *
 * 응답 형태는 실물 대조(2026-08-19, api.hvy.kr) 기준:
 *   category: {id, name, order, fullName, parentId?, treeName, label}
 *   tag:      {id(number), name, postCount, label}
 *   post:     {id, subject, body, categoryId, category, status, viewCount, tags,
 *              files, created, updated, hasDraft, public, main}
 *   series:   {id, title, postCount}
 *   search 항목: {id, subject, categoryName, viewCount, createDate, updateDate}
 */

/** 기준 시각 — 여기서 산술 파생한다. */
const BASE_MS = Date.UTC(2026, 0, 1);

function isoAt(dayOffset: number, hour = 9): string {
  return new Date(BASE_MS + dayOffset * 86_400_000 + hour * 3_600_000).toISOString();
}

// ── 인증 ──────────────────────────────────────────────────────────────────────

/**
 * 고정 테스트용 RSA-2048 공개키(SPKI base64 본문만 — PEM 헤더 없음).
 * 프론트(useAuthStore.encryptPassword)가 헤더를 직접 감싸므로 본문만 내려야 한다.
 * 개인키는 보관하지 않는다 — 목은 복호화하지 않고 username 존재만 검사한다.
 */
export const MOCK_PUBLIC_KEY_B64 =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiDkKX5B/t5++85UcXZBD' +
  'Ijv7/zdJOeNYYdrRI0SSK7mq2pC+HDG4YunacsTPBPBNO3peH5ZC0nU9neQeJJ0N' +
  'ziOm6lZAf/HBAWi7RfZ1APaJa+9ho2HwUoNG38VgtefvRqq6WLb64r76SUVp9CKu' +
  'YO9w/OvheDHzwoeb8REIhnoxhyEZAW3FHIBOOV4nnWSzPFc4vIpUbcK3Pg1VJpZ2' +
  'AnGeDbPCt4Lb5mbneRN7mPgPASM7G9ABaQGcyoZpBYS0yUw5Iw56zN2MHXGApK9s' +
  'u7+o3rcO5vAFI44eClyTPytWwyKTpqMQLbx5VI+cy6hLPq6fg6N9Q+OdWow+bK/y' +
  'EwIDAQAB';

/** JWT 형태(base64url 3분절)의 고정 문자열 — 서명은 무의미하고 형태만 재현한다. */
export const MOCK_JWT = [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ sub: 'admin', exp: 4102444800 })).toString('base64url'),
  'mock-signature',
].join('.');

export const MOCK_USER = {
  username: 'admin',
  name: '관리자',
};

// ── 카테고리 ──────────────────────────────────────────────────────────────────

/** 실서버 CategoryFlatResponse 의 @JsonGetter 파생 treeName 재현: 전각공백×level + └─ + 전각공백 + name */
function treeName(level: number, name: string): string {
  if (level === 0) return name;
  return `${'　'.repeat(level)}└─　${name}`;
}

interface FlatCategory {
  id: string;
  name: string;
  order: number;
  fullName: string;
  parentId?: string;
  treeName: string;
  label: string;
}

export const CATEGORIES: readonly FlatCategory[] = [
  {
    id: 'ROOT',
    name: '전체글',
    order: 1,
    fullName: '/전체글/',
    treeName: treeName(0, '전체글'),
    label: '전체글',
  },
  {
    id: 'CAT-DEV',
    name: 'Dev',
    order: 0,
    fullName: '/전체글/Dev/',
    parentId: 'ROOT',
    treeName: treeName(1, 'Dev'),
    label: 'Dev',
  },
  {
    id: 'CAT-AI',
    name: 'AI',
    order: 0,
    fullName: '/전체글/Dev/AI/',
    parentId: 'CAT-DEV',
    treeName: treeName(2, 'AI'),
    label: 'AI',
  },
  {
    id: 'CAT-INFRA',
    name: 'Infra',
    order: 1,
    fullName: '/전체글/Infra/',
    parentId: 'ROOT',
    treeName: treeName(1, 'Infra'),
    label: 'Infra',
  },
  {
    id: 'CAT-DAILY',
    name: '일상',
    order: 2,
    fullName: '/전체글/일상/',
    parentId: 'ROOT',
    treeName: treeName(1, '일상'),
    label: '일상',
  },
] as const;

/** CategoryResponse 트리(GET /api/category/root) — flat 픽스처에서 파생한다. */
export function categoryTree(): unknown {
  const build = (id: string): Record<string, unknown> => {
    const node = CATEGORIES.find((c) => c.id === id);
    if (!node) throw new Error(`픽스처에 없는 카테고리: ${id}`);
    const children = CATEGORIES.filter((c) => c.parentId === id).map((c) => build(c.id));
    return {
      id: node.id,
      name: node.name,
      order: node.order,
      fullPath: node.fullName,
      parentId: node.parentId ?? null,
      postCount: POSTS.filter((p) => p.categoryId === node.id).length,
      children,
    };
  };
  return build('ROOT');
}

// ── 태그 ──────────────────────────────────────────────────────────────────────

const TAG_NAMES = ['docker', 'nextjs', 'spring', 'ai', 'pnpm', 'blog'] as const;

export const TAGS = TAG_NAMES.map((name, index) => ({
  id: index + 1,
  name,
  postCount: ((index * 3) % 5) + 1,
  label: name,
}));

// ── 포스트 ────────────────────────────────────────────────────────────────────

const POST_CATEGORY_CYCLE = ['CAT-DEV', 'CAT-AI', 'CAT-INFRA', 'CAT-DAILY'] as const;

/** 마크다운 렌더 경로(헤딩·코드블록·목차)를 태우는 고정 본문. */
function postBody(id: number): string {
  return [
    `# 테스트 포스트 ${id}`,
    '',
    '목 데이터로 생성된 본문입니다. 헤딩·코드블록·리스트를 포함해 렌더 경로를 검증합니다.',
    '',
    '## 코드 예시',
    '',
    '```javascript',
    `const postId = ${id};`,
    "console.log('mock post', postId);",
    '```',
    '',
    '## 목록',
    '',
    '- 항목 하나',
    '- 항목 둘',
  ].join('\n');
}

export interface MockPost {
  id: number;
  subject: string;
  body: string;
  categoryId: string;
  viewCount: number;
  created: string;
  updated: string;
  isPublic: boolean;
  isMain: boolean;
  tagIds: readonly number[];
}

export const POSTS: readonly MockPost[] = Array.from({ length: 12 }, (_, i) => {
  const id = i + 1;
  return {
    id,
    subject: `테스트 포스트 ${id}`,
    body: postBody(id),
    categoryId: POST_CATEGORY_CYCLE[i % POST_CATEGORY_CYCLE.length] as string,
    viewCount: id * 7,
    created: isoAt(i),
    updated: isoAt(i, 15),
    isPublic: true,
    isMain: id === 1,
    tagIds: [TAGS[i % TAGS.length]?.id ?? 1, TAGS[(i + 2) % TAGS.length]?.id ?? 2],
  };
});

/** PostResponse(상세/메인) 직렬화 형태 — 실물 키 목록 기준. */
export function postResponse(post: MockPost): Record<string, unknown> {
  const category = CATEGORIES.find((c) => c.id === post.categoryId);
  return {
    id: post.id,
    subject: post.subject,
    body: post.body,
    categoryId: post.categoryId,
    category: category
      ? { id: category.id, name: category.name, parentId: category.parentId ?? null }
      : null,
    status: 'PUBLISH',
    viewCount: post.viewCount,
    tags: post.tagIds.map((tagId) => TAGS.find((t) => t.id === tagId)).filter(Boolean),
    files: [],
    created: post.created,
    updated: post.updated,
    hasDraft: false,
    public: post.isPublic,
    main: post.isMain,
  };
}

/** 검색 결과 항목(PostNoBodyResponse) — 실물 키: id, subject, categoryName, viewCount, createDate, updateDate */
export function postSearchItem(post: MockPost): Record<string, unknown> {
  const category = CATEGORIES.find((c) => c.id === post.categoryId);
  return {
    id: post.id,
    subject: post.subject,
    categoryName: category?.name ?? '',
    viewCount: post.viewCount,
    createDate: post.created,
    updateDate: post.updated,
  };
}

// ── 검색 엔진 (퀵서치) ────────────────────────────────────────────────────────

/** SearchEngineResponse — 실물 키: {id, name, url, order}. 메인 SSR 이 기동 시 반드시 호출한다. */
export const SEARCH_ENGINES = [
  { id: 1, name: 'Naver', url: 'https://search.naver.com/search.naver?query=%s', order: 0 },
  { id: 2, name: 'Google', url: 'https://www.google.com/search?q=%s', order: 1 },
];

// ── 시리즈 ────────────────────────────────────────────────────────────────────

export const SERIES = [{ id: 1, title: '모노레포 전환기', postCount: 3 }];

/** 시리즈 소속 포스트 id — 결정론 고정. */
export const SERIES_POST_IDS: Readonly<Record<number, readonly number[]>> = {
  1: [1, 2, 3],
};
