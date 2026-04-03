import service from "../service"
import {SearchEngineComponent} from "../components/SearchEngineComponent"
import {ArrowUpRight, Link2, Search} from 'lucide-react'
import {buildBackendAuthConfig} from "../lib/ssrRequestAuth"

export default function IndexPage({engines, favorites}) {

    return (
        <>
            <h1 className="visually-hidden">Skyscape - 홈</h1>
            <section>
                <div className="public-container px-4 pb-10 pt-28 sm:px-6 lg:px-8 lg:pb-12">
                    <div className="w-full">
                        <SearchEngineComponent engines={engines}/>
                    </div>
                </div>
            </section>

            <section className="public-container px-4 pb-14 pt-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Favorite Groups
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                    {favorites.map((group) =>
                        <section key={group.name} className="surface-panel-strong overflow-hidden rounded-[1.75rem] p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Collection
                                    </p>
                                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                        {group.name}
                                    </h3>
                                </div>
                                <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                    <Link2 className="h-5 w-5"/>
                                </span>
                            </div>
                            <ul className="mt-6 grid gap-3">
                                {group.links.map((favorite) =>
                                    <li key={favorite.name}>
                                        <a
                                            href={favorite.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                                        >
                                            <span className="truncate">{favorite.name}</span>
                                            <ArrowUpRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </section>
                    )}
                </div>
            </section>
        </>
    )
}
export async function getServerSideProps(context) {
    const authConfig = buildBackendAuthConfig(context.req)
    const enginesReq = await service.search.getAll(authConfig)
    const favoritesResponse = await service.favorite.getFavorites(authConfig)
    return {
        props: {
            engines: enginesReq.data,
            favorites: favoritesResponse
        }
    }
}
