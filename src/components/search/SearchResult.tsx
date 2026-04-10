import {format} from 'date-fns'
import Link from "next/link"
import {ArrowRight, Clock3, FolderOpen} from "lucide-react"

interface SearchResultPost {
    id: string
    subject: string
    categoryName: string
    createDate: string | number
}

interface SearchResultProps {
    posts?: SearchResultPost[]
}

export default function SearchResult({posts}: SearchResultProps) {
    const searchedPost = posts ?? []

    const timestampFormat = (timestamp: string | number): string => {
        return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')
    }

    return (
        <div className="space-y-4">
            {searchedPost.map(post => (
                <article key={post.id} className="surface-panel-strong rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1 hover:border-sky-200">
                    <div className="public-label-text flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sky-700 dark:bg-blue-950/50 dark:text-blue-300">
                            <FolderOpen className="h-3.5 w-3.5"/>
                            {post.categoryName}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5"/>
                            {timestampFormat(post.createDate)}
                        </span>
                    </div>
                    <Link href={`/post/${post.id}`} className="group mt-4 block">
                        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 transition group-hover:text-sky-700 dark:text-slate-50 dark:group-hover:text-blue-400">
                            {post.subject}
                        </h2>
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                            Read post
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5"/>
                        </div>
                    </Link>
                </article>
            ))}
            {searchedPost.length === 0 && (
                <div className="surface-panel-strong rounded-[1.75rem] px-6 py-10 text-center">
                    <p className="public-label-text text-sm font-semibold uppercase tracking-[0.18em]">
                        No Results
                    </p>
                    <h2 className="section-title mt-3 text-3xl font-semibold text-slate-950 dark:text-slate-50">
                        검색 결과가 없습니다.
                    </h2>
                    <p className="public-muted-text mt-3 text-sm">
                        키워드 조합을 줄이거나 카테고리, 태그 조건을 다시 선택해 보세요.
                    </p>
                </div>
            )}
        </div>
    )
}
