import { ArrowUpRight } from 'lucide-react';
import type { GetServerSideProps } from 'next';
import { SearchEngineComponent } from '@/components/SearchEngineComponent';
import { buildBackendAuthConfig } from '@/lib/ssrRequestAuth';
import service from '@/service';
import type { FavoriteCategory } from '@/types/favorite';
import type { SearchEngine } from '@/types/searchEngine';

interface IndexPageProps {
  engines: SearchEngine[];
  favorites: FavoriteCategory[];
}

export default function IndexPage({ engines, favorites }: IndexPageProps) {
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
export const getServerSideProps: GetServerSideProps<IndexPageProps> = async (context) => {
  const authConfig = buildBackendAuthConfig(context.req);
  const enginesReq = await service.search.getAll(authConfig);
  const favoritesResponse = await service.favorite.getFavorites(authConfig);
  return {
    props: {
      engines: enginesReq.data,
      favorites: favoritesResponse,
    },
  };
};
