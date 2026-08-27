import { HttpResponse, http } from 'msw';
import { fail, ok, pageOf } from './envelope';
import {
  CATEGORIES,
  categoryTree,
  MOCK_JWT,
  MOCK_PUBLIC_KEY_B64,
  MOCK_USER,
  POSTS,
  postResponse,
  postSearchItem,
  SEARCH_ENGINES,
  SERIES,
  SERIES_POST_IDS,
  TAGS,
} from './fixtures';

/**
 * hvy-blog 공개 API 목 — 화면 기동에 필요한 초기 세트(auth 3 + post 6 + category 2 + tag 2 + series 3).
 *
 * 패턴은 와일드카드 프리픽스(`*\/api/...`) — BLOG_URL_DEV/PROD 가 무엇을 가리켜도 매치된다.
 * 등록 순서 주의: MSW 는 배열 순 매칭이므로 구체 경로를 파라미터 경로보다 위에 둔다.
 * admin CRUD(`/api/post/admin/**` 등)는 2차 확장 — bypass 로 실 백엔드로 나간다.
 */

/**
 * 호출 카운터 — globalThis 보관(HMR 로 모듈 그래프가 갈라지면 카운터가 분리되는 것을 방지).
 * 조회는 /api/dev/mock-stats.
 */
type CounterKey = 'auth' | 'post' | 'search' | 'category' | 'tag' | 'series';

type CounterGlobal = typeof globalThis & {
  __hvyMockCounters?: Record<CounterKey, number>;
};

const counterStore = globalThis as CounterGlobal;

function counters(): Record<CounterKey, number> {
  if (!counterStore.__hvyMockCounters) {
    counterStore.__hvyMockCounters = {
      auth: 0,
      post: 0,
      search: 0,
      category: 0,
      tag: 0,
      series: 0,
    };
  }
  return counterStore.__hvyMockCounters;
}

function count(key: CounterKey): void {
  counters()[key] += 1;
}

export const callCounters = {
  snapshot: (): Record<CounterKey, number> => ({ ...counters() }),
  reset: (): void => {
    counterStore.__hvyMockCounters = undefined;
  },
};

/** URL-safe base64(JSON SearchObject) 디코드 — 실서버와 같은 계약. */
function decodeSearchQuery(query: string): {
  searchType?: string;
  searchCondition?: { keywords?: string[]; logic?: 'AND' | 'OR' };
  categories?: string[];
  tags?: string[];
  page?: number;
  pageSize?: number;
} {
  return JSON.parse(Buffer.from(query, 'base64url').toString('utf8'));
}

export const handlers = [
  // ── auth ────────────────────────────────────────────────────────────────────
  http.post('*/api/auth/shake', ({ request }) => {
    count('auth');
    return ok(request, { publicKey: MOCK_PUBLIC_KEY_B64 });
  }),

  http.post('*/api/auth/login', async ({ request }) => {
    count('auth');
    const body = (await request.json().catch(() => null)) as { username?: string } | null;
    // 목은 복호화하지 않는다 — username 존재만 검사한다(개인키 미보관).
    if (body?.username !== MOCK_USER.username) {
      return fail('아이디 또는 비밀번호가 올바르지 않습니다', 401);
    }
    // 로그인 전용 라우트(app/api/auth/login/route.ts)가 이 헤더에서 토큰을 뽑아 재포장한다 — 필수.
    return ok(request, MOCK_USER, {
      headers: { 'Set-Cookie': `Authorization=${MOCK_JWT}; Path=/; Max-Age=86400; HttpOnly` },
    });
  }),

  http.get('*/api/auth/profile', ({ request }) => {
    count('auth');
    // 실서버는 미인증 시 본문 없는 401(ResponseEntity.status(401).build())을 돌려준다.
    if (!request.headers.get('authorization')?.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 });
    }
    return ok(request, MOCK_USER);
  }),

  // ── post (구체 경로 → 파라미터 경로 순) ──────────────────────────────────────
  http.get('*/api/post/public-content', ({ request }) => {
    count('post');
    return ok(
      request,
      POSTS.filter((p) => p.isPublic).map((p) => p.id),
    );
  }),

  http.get('*/api/post/search', ({ request }) => {
    count('search');
    const raw = new URL(request.url).searchParams.get('query');
    if (!raw) return fail('query 파라미터가 필요합니다', 400);

    let search: ReturnType<typeof decodeSearchQuery>;
    try {
      search = decodeSearchQuery(raw);
    } catch {
      return fail('query 디코드 실패', 400);
    }

    // 실제 필터를 구현해야 검색 화면 검증이 성립한다 (deleo orders.ts 원칙).
    const keywords = search.searchCondition?.keywords ?? [];
    const logic = search.searchCondition?.logic ?? 'AND';
    let filtered = POSTS.filter((p) => p.isPublic);

    if (keywords.length > 0) {
      filtered = filtered.filter((p) => {
        const hit = (kw: string) => p.subject.includes(kw) || p.body.includes(kw);
        return logic === 'AND' ? keywords.every(hit) : keywords.some(hit);
      });
    }
    if (search.categories && search.categories.length > 0) {
      filtered = filtered.filter((p) => search.categories?.includes(p.categoryId));
    }
    if (search.tags && search.tags.length > 0) {
      filtered = filtered.filter((p) =>
        p.tagIds.some((tagId) => search.tags?.includes(String(tagId))),
      );
    }

    const page = search.page ?? 1;
    const pageSize = search.pageSize ?? 10;
    const slice = filtered.slice((page - 1) * pageSize, page * pageSize);
    return ok(request, pageOf(slice.map(postSearchItem), page, pageSize, filtered.length));
  }),

  // ⚠️ 반드시 :postId 보다 위 — 한 세그먼트라 :postId 가 삼킨다 (실측: 메인 SSR 500)
  http.get('*/api/post/search-engine', ({ request }) => {
    count('post');
    return ok(request, SEARCH_ENGINES);
  }),

  // 실물 계약(PostPrevNextResponse / PostMapper.findPrevNextById): prev·next 는 id(없으면 COALESCE 0), *Subject 는 제목(없으면 null).
  // 객체를 돌려주면 PostComponent 의 <Link href={`/post/${prev}`}> 가 `/post/[object Object]` 가 되어 App Router 가 throw 한다.
  http.get('*/api/post/prev-next/:postId', ({ request, params }) => {
    count('post');
    const id = Number(params.postId);
    const prev = POSTS.find((p) => p.id === id - 1);
    const next = POSTS.find((p) => p.id === id + 1);
    return ok(request, {
      prev: prev?.id ?? 0,
      next: next?.id ?? 0,
      prevSubject: prev?.subject ?? null,
      nextSubject: next?.subject ?? null,
    });
  }),

  http.get('*/api/post/:postId/related', ({ request, params }) => {
    count('post');
    const id = Number(params.postId);
    // 결정론 5개 — id 산술로 선택한다.
    const related = Array.from({ length: 5 }, (_, i) => POSTS[(id + i) % POSTS.length])
      .filter((p) => p !== undefined && p.id !== id)
      .map((p) => postSearchItem(p));
    return ok(request, related);
  }),

  http.get('*/api/post/:postId', ({ request, params }) => {
    count('post');
    const post = POSTS.find((p) => p.id === Number(params.postId));
    if (!post) return fail(`포스트가 없습니다: ${String(params.postId)}`, 404);
    return ok(request, postResponse(post));
  }),

  http.get('*/api/post', ({ request }) => {
    count('post');
    const main = POSTS.find((p) => p.isMain);
    if (!main) return fail('메인 포스트가 없습니다', 404);
    return ok(request, postResponse(main));
  }),

  // ── category ────────────────────────────────────────────────────────────────
  http.get('*/api/category/root', ({ request }) => {
    count('category');
    return ok(request, categoryTree());
  }),

  http.get('*/api/category', ({ request }) => {
    count('category');
    return ok(request, CATEGORIES);
  }),

  // ── tag ─────────────────────────────────────────────────────────────────────
  http.get('*/api/tag/all', ({ request }) => {
    count('tag');
    return ok(request, TAGS);
  }),

  http.get('*/api/tag', ({ request }) => {
    count('tag');
    const name = new URL(request.url).searchParams.get('name') ?? '';
    return ok(
      request,
      TAGS.filter((t) => t.name.includes(name)),
    );
  }),

  // ── series ──────────────────────────────────────────────────────────────────
  http.get('*/api/series/by-post/:postId', ({ request, params }) => {
    count('series');
    const postId = Number(params.postId);
    const found = SERIES.find((s) => SERIES_POST_IDS[s.id]?.includes(postId));
    if (!found) return ok(request, null);
    return ok(request, {
      ...found,
      posts: (SERIES_POST_IDS[found.id] ?? [])
        .map((id) => POSTS.find((p) => p.id === id))
        .filter((p) => p !== undefined)
        .map((p) => postSearchItem(p)),
    });
  }),

  http.get('*/api/series/:seriesId', ({ request, params }) => {
    count('series');
    const found = SERIES.find((s) => s.id === Number(params.seriesId));
    if (!found) return fail(`시리즈가 없습니다: ${String(params.seriesId)}`, 404);
    return ok(request, {
      ...found,
      posts: (SERIES_POST_IDS[found.id] ?? [])
        .map((id) => POSTS.find((p) => p.id === id))
        .filter((p) => p !== undefined)
        .map((p) => postSearchItem(p)),
    });
  }),

  http.get('*/api/series', ({ request }) => {
    count('series');
    return ok(request, SERIES);
  }),
];
