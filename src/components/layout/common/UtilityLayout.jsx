export default function UtilityLayout({children}) {
    return (
        <div className="public-container px-4 pb-12 pt-28 sm:px-6 lg:px-8 lg:pb-14">
            <div className="rounded-[2.2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(248,250,252,0.52))] p-1 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                <div className="surface-panel-strong overflow-hidden rounded-[1.9rem]">
                    {children}
                </div>
            </div>
        </div>
    )
}
