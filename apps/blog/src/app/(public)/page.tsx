import { headers } from 'next/headers';
import LinkRow from '@/components/common/LinkRow';
import PlatformFavoriteSection from '@/components/platform/PlatformFavoriteSection';
import { SearchEngineComponent } from '@/components/SearchEngineComponent';
import { getAuthTokenFromRequest } from '@/lib/authCookie';
import { buildBackendAuthConfig } from '@/lib/ssrRequestAuth';
import service from '@/service';
import type { SearchEngine } from '@/types/searchEngine';

/**
 * 홈 — async 서버 컴포넌트. headers() 를 읽으므로 동적 렌더(SSR).
 * 검색엔진·즐겨찾기·플랫폼은 서로 독립이라 Promise.all 로 병렬 조회한다.
 */
export default async function IndexPage() {
  const headerList = await headers();
  const authConfig = buildBackendAuthConfig(headerList);

  // 로그인 쿠키가 없으면 관리자일 수 없다 — 백엔드에 403 을 물으러 가지 않는다.
  // 공개 홈의 지배적 트래픽이 비로그인이라, 이 한 줄이 불필요한 왕복을 전부 없앤다.
  // (쿠키 파싱은 요청 헤더만 보는 동기 함수라 비용이 없다.)
  const hasSession = Boolean(getAuthTokenFromRequest(headerList));

  const [enginesRes, favorites, platformGroups] = await Promise.all([
    service.search.getAll(authConfig),
    service.favorite.getFavorites(authConfig),
    hasSession ? service.linkTree.getPlatformGroupsOrEmpty(authConfig) : Promise.resolve([]),
  ]);
  const engines: SearchEngine[] = enginesRes.data;

  return (
    <>
      <h1 className="visually-hidden">Skyscape - 홈</h1>
      <section className="public-container pb-10 pt-6 lg:pb-12 lg:pt-10">
        <SearchEngineComponent engines={engines} />
      </section>

      {/* 관리자 전용. 존재 이유가 "홈에서 곧장 플랫폼으로" 라서 즐겨찾기보다 위에 둔다. */}
      {platformGroups.length > 0 && <PlatformFavoriteSection groups={platformGroups} />}

      <section className="public-container pb-10 pt-6 lg:pb-14">
        <div className="mb-4 flex items-end justify-between gap-4 lg:mb-6">
          <div>
            <p className="public-label-text public-text-meta font-semibold uppercase tracking-[0.18em]">
              Favorite Groups
            </p>
          </div>
        </div>

        {/* 행 우선 배치 + 행 높이 stretch — 짧은 카드도 옆 카드 높이만큼 늘어나 빈 공간이 카드 안에 담긴다 */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((group) => (
            <section
              key={group.name}
              className="surface-panel-strong overflow-hidden rounded-(--radius-panel) p-(--public-pad-panel)"
            >
              <h3
                className="truncate public-text-title font-semibold tracking-[-0.03em] text-dl-fg"
                title={group.name}
              >
                {group.name}
              </h3>
              {/* 트랙 하한을 0 으로 — grid 아이템(li)의 min-width:auto 는 자동 최소 크기가
                  min-content 라, 안쪽 truncate 의 nowrap 텍스트 폭이 그대로 트랙을 밀어
                  카드가 넘친다. PostComponent 의 이전/다음 글 카드가 같은 처방을 쓴다. */}
              <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-2 lg:mt-6 lg:gap-3">
                {group.links.map((favorite) => (
                  <LinkRow key={favorite.name} link={favorite} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
