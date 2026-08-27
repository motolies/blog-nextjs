import { ArrowUpRight } from 'lucide-react';
import { headers } from 'next/headers';
import { SearchEngineComponent } from '@/components/SearchEngineComponent';
import { buildBackendAuthConfig } from '@/lib/ssrRequestAuth';
import service from '@/service';
import type { SearchEngine } from '@/types/searchEngine';

/**
 * 홈 — async 서버 컴포넌트. headers() 를 읽으므로 동적 렌더(SSR).
 * 검색엔진·즐겨찾기는 서로 독립이라 Promise.all 로 병렬 조회한다.
 */
export default async function IndexPage() {
  const authConfig = buildBackendAuthConfig(await headers());
  const [enginesRes, favorites] = await Promise.all([
    service.search.getAll(authConfig),
    service.favorite.getFavorites(authConfig),
  ]);
  const engines: SearchEngine[] = enginesRes.data;

  return (
    <>
      <h1 className="visually-hidden">Skyscape - 홈</h1>
      <section className="public-container pb-10 pt-6 sm:pt-10 lg:pb-12">
        <SearchEngineComponent engines={engines} />
      </section>

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
                {group.links.map((favorite) => (
                  <li key={favorite.name}>
                    <a
                      href={favorite.url}
                      target="_blank"
                      rel="noreferrer"
                      className="public-card-surface group flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium text-dl-fg transition hover:text-dl-primary-ink"
                    >
                      <span className="truncate">{favorite.name}</span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
