import axios from 'axios';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { handlers } from './handlers';

/**
 * 목 계약 검증 — 봉투 형태·두 인터셉터 경로·결정론.
 *
 * blog 의 백엔드 호출은 두 클라이언트를 탄다:
 *   (a) BFF 프록시([...path].ts)의 fetch → undici FetchInterceptor
 *   (b) SSR axios(axiosClient)의 Node http adapter → ClientRequestInterceptor
 * 둘 다 MSW node 가 가로채는지 여기서 직접 증명한다 — 이게 깨지면 목 전체가 무의미하다.
 */
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const BASE = 'https://mock-backend.test';

function encodeSearch(searchObject: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(searchObject)).toString('base64url');
}

describe('인터셉터 경로', () => {
  it('fetch(undici) 경로를 가로채고 봉투 {status, path, data} 를 돌려준다', async () => {
    const response = await fetch(`${BASE}/api/category`);
    const json = await response.json();
    expect(json.status).toBe('SUCCESS');
    expect(json.path).toBe('/api/category');
    expect(Array.isArray(json.data)).toBe(true);
    // axios 인터셉터의 평탄화 조건(두 키 존재)을 만족해야 한다
    expect('status' in json && 'path' in json).toBe(true);
  });

  it('axios(Node http adapter) 경로도 가로챈다', async () => {
    const response = await axios.get(`${BASE}/api/tag/all`);
    expect(response.data.status).toBe('SUCCESS');
    expect(response.data.data.length).toBeGreaterThan(0);
    expect(response.data.data[0]).toHaveProperty('label');
  });
});

describe('인증 플로우', () => {
  it('shake 는 PEM 헤더 없는 base64 공개키 본문을 돌려준다', async () => {
    const response = await fetch(`${BASE}/api/auth/shake`, { method: 'POST' });
    const json = await response.json();
    expect(json.data.publicKey).not.toContain('BEGIN PUBLIC KEY');
    expect(json.data.publicKey).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('로그인 성공 시 Set-Cookie: Authorization=<jwt> 를 싣는다 (전용 라우트가 재포장하는 헤더)', async () => {
    const response = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', encPassword: 'x', publicKey: 'y' }),
    });
    expect(response.status).toBe(200);
    const cookie = response.headers.get('set-cookie');
    expect(cookie).toContain('Authorization=');
    expect(cookie).toContain('HttpOnly');
  });

  it('모르는 username 은 401 실패 봉투(path 없음)', async () => {
    const response = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nobody' }),
    });
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.status).toBe('FAIL');
    expect(json).not.toHaveProperty('path');
  });

  it('profile 은 Bearer 없으면 본문 없는 401, 있으면 사용자 봉투', async () => {
    const unauthorized = await fetch(`${BASE}/api/auth/profile`);
    expect(unauthorized.status).toBe(401);
    expect(await unauthorized.text()).toBe('');

    const authorized = await fetch(`${BASE}/api/auth/profile`, {
      headers: { Authorization: 'Bearer mock' },
    });
    const json = await authorized.json();
    expect(json.data.username).toBe('admin');
  });
});

describe('검색', () => {
  it('URL-safe base64 SearchObject 를 실제로 디코드해 키워드 필터·페이징한다', async () => {
    const query = encodeSearch({
      searchType: 'TITLE',
      searchCondition: { keywords: ['포스트 1'], logic: 'AND' },
      categories: [],
      tags: [],
      page: 1,
      pageSize: 5,
    });
    const response = await fetch(`${BASE}/api/post/search?query=${query}`);
    const json = await response.json();
    // '포스트 1' 은 1, 10, 11, 12 에 매치된다
    expect(json.data.totalCount).toBe(4);
    expect(json.data.list.length).toBe(4);
    expect(json.data).toHaveProperty('totalPage');
    expect(json.data).toHaveProperty('begin');
    expect(json.data.list[0]).toHaveProperty('categoryName');
  });

  it('카테고리 필터가 동작한다', async () => {
    const query = encodeSearch({
      searchType: 'TITLE',
      searchCondition: { keywords: [], logic: 'AND' },
      categories: ['CAT-AI'],
      tags: [],
      page: 1,
      pageSize: 10,
    });
    const response = await fetch(`${BASE}/api/post/search?query=${query}`);
    const json = await response.json();
    expect(json.data.totalCount).toBe(3); // 12개 중 4주기 순환의 CAT-AI = 3개
  });
});

describe('포스트·시리즈', () => {
  it('메인 포스트와 상세가 같은 직렬화 형태를 쓴다', async () => {
    const main = await (await fetch(`${BASE}/api/post`)).json();
    const detail = await (await fetch(`${BASE}/api/post/1`)).json();
    expect(Object.keys(main.data).sort()).toEqual(Object.keys(detail.data).sort());
    expect(main.data.main).toBe(true);
  });

  it('prev-next 경계: 첫 포스트의 prev 는 null', async () => {
    const json = await (await fetch(`${BASE}/api/post/prev-next/1`)).json();
    expect(json.data.prev).toBeNull();
    expect(json.data.next?.id).toBe(2);
  });

  it('시리즈 by-post: 소속이면 포스트 목록 포함, 아니면 data null', async () => {
    const hit = await (await fetch(`${BASE}/api/series/by-post/1`)).json();
    expect(hit.data.posts.length).toBe(3);
    const miss = await (await fetch(`${BASE}/api/series/by-post/99`)).json();
    expect(miss.data).toBeNull();
  });
});

describe('결정론', () => {
  it('같은 요청 2회는 완전히 같은 응답을 돌려준다', async () => {
    const first = await (await fetch(`${BASE}/api/post/3`)).json();
    const second = await (await fetch(`${BASE}/api/post/3`)).json();
    expect(second).toEqual(first);
  });
});
