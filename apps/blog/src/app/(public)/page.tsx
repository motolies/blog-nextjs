import { Icon } from '@hvy/ui';
import { ArrowUpRight } from 'lucide-react';
import { headers } from 'next/headers';
import PlatformFavoriteSection from '@/components/platform/PlatformFavoriteSection';
import { SearchEngineComponent } from '@/components/SearchEngineComponent';
import { getAuthTokenFromRequest } from '@/lib/authCookie';
import { resolveLinkIcon } from '@/lib/linkIcons';
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
      <section className="public-container pb-10 pt-6 sm:pt-10 lg:pb-12">
        <SearchEngineComponent engines={engines} />
      </section>

      {/* 관리자 전용. 존재 이유가 "홈에서 곧장 플랫폼으로" 라서 즐겨찾기보다 위에 둔다. */}
      {platformGroups.length > 0 && <PlatformFavoriteSection groups={platformGroups} />}

      <section className="public-container pb-14 pt-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="public-label-text text-sm font-semibold uppercase tracking-[0.18em]">
              Favorite Groups
            </p>
          </div>
        </div>

        {/* 행 우선 배치 + 행 높이 stretch — 짧은 카드도 옆 카드 높이만큼 늘어나 빈 공간이 카드 안에 담긴다 */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((group) => (
            <section
              key={group.name}
              className="surface-panel-strong overflow-hidden rounded-(--radius-panel) p-6"
            >
              <h3 className="text-2xl font-semibold tracking-[-0.03em] text-dl-fg">{group.name}</h3>
              <ul className="mt-6 grid gap-3">
                {group.links.map((favorite) => {
                  // 아이콘은 선택 항목이다 — 기존 데이터에는 하나도 없어서 값이 있을 때만 그린다.
                  // 없을 때 폴백을 그리면 모든 링크가 같은 아이콘으로 도배된다.
                  const LinkIcon = resolveLinkIcon(favorite.icon);
                  return (
                    <li key={favorite.name}>
                      <a
                        href={favorite.url}
                        target="_blank"
                        rel="noreferrer"
                        className="public-card-surface group flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium text-dl-fg transition hover:text-dl-primary-ink"
                      >
                        {LinkIcon && <Icon icon={LinkIcon} size="sm" />}
                        <span className="flex-1 truncate">{favorite.name}</span>
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
