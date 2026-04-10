import {useEffect, useState} from "react"
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    Clock3,
    Globe,
    GlobeLock,
    List,
    Pencil,
    Trash2
} from "lucide-react"
import {Button} from "../ui/button"
import DeleteConfirm from "../confirm/DeleteConfirm"
import {useRouter} from "next/router"
import {toast} from 'sonner'
import {useAuthStore} from "../../store/useAuthStore"
import {useShallow} from 'zustand/react/shallow'
import PublicConfirm from "../confirm/PublicConfirm"
import TagGroupComponent from "./TagGroupComponent"
import Link from "next/link"
import {searchObjectInit} from "../../model/searchObject"
import {base64Encode} from "../../util/base64Util"
import {fileLink} from "../../util/fileLink"
import {usePostNavigationShortcut} from "../../util/usePostNavigationShortcut"
import {useCodeHighlight} from "../../hooks/useCodeHighlight"
import TableOfContents from "./TableOfContents"
import styles from './PostComponent.module.css'
import {format} from 'date-fns'
import service from "../../service"
import type {Tag} from "@/types/tag"
import type {Series} from "@/types/series"

interface PostData {
    id: number
    subject: string
    body: string
    category: {
        id: string
        name: string
    }
    public: boolean
    status?: 'TEMP' | 'PUBLISH'
    tags: Tag[]
    created: { at: string }
    updated: { at: string }
}

interface PrevNext {
    prev: number
    next: number
    prevSubject?: string
    nextSubject?: string
}

interface RelatedPost {
    id: number
    subject: string
    categoryName: string
    createDate: string
    commonTagCount: number
}

interface PostComponentProps {
    post: PostData
    prevNext: PrevNext
}

export default function PostComponent({post, prevNext}: PostComponentProps) {
    const router = useRouter()
    const userState = useAuthStore(useShallow(s => ({isAuthenticated: s.isAuthenticated, user: s.user})))

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
    const [showPublicConfirm, setShowPublicConfirm] = useState<boolean>(false)
    const [postPublic, setPostPublic] = useState<boolean | undefined>(post?.public)
    const [tags, setTags] = useState<Tag[]>(post?.tags || [])
    const [publicConfirmQuestion, setPublicConfirmQuestion] = useState<string>('')
    const [postBody, setPostBody] = useState<string>('')
    const [isClientMounted, setIsClientMounted] = useState<boolean>(false)
    const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
    const [series, setSeries] = useState<Series | null>(null)
    const [seriesExpanded, setSeriesExpanded] = useState<boolean>(false)

    const prevPostId = prevNext?.prev || 0
    const nextPostId = prevNext?.next || 0

    const onKeyPress = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === 'ArrowLeft' && prevPostId !== 0) {
            router.push(`/post/${prevPostId}`)
        } else if (event.ctrlKey && event.key === 'ArrowRight' && nextPostId !== 0) {
            router.push(`/post/${nextPostId}`)
        }
    }

    usePostNavigationShortcut(['ArrowLeft', 'ArrowRight'], onKeyPress)
    useCodeHighlight(postBody)

    useEffect(() => {
        setPostPublic(post?.public)
        setTags(post?.tags || [])
    }, [post])

    useEffect(() => {
        if (post?.id && post.id > 0) {
            service.post.getRelatedPosts({postId: String(post.id)})
                .then((res: { data: RelatedPost[] }) => setRelatedPosts(res.data ?? []))
                .catch(() => setRelatedPosts([]))

            service.series.getByPostId({postId: String(post.id)})
                .then((res: { data: Series | null }) => {
                    const data = res.data
                    setSeries(data?.id ? data : null)
                })
                .catch(() => setSeries(null))
        }
    }, [post?.id])

    useEffect(() => {
        setIsClientMounted(true)
    }, [])

    useEffect(() => {
        if (!postBody) {
            return
        }
        postImagePopup()
        postIconChange()
    }, [postBody])

    useEffect(() => {
        if (!post?.body) {
            setPostBody('')
            return
        }
        const doc = new DOMParser().parseFromString(post.body, 'text/html')
        initVsCode(doc)
        initJetbrains(doc)
        initIntellij(doc)
        initLinkNewTab(doc)
        setPostBody(doc.head.innerHTML + doc.body.innerHTML)
    }, [post?.body])

    const postIconChange = () => {
        document.querySelectorAll('i.fa-file').forEach(icon => {
            if (icon.parentNode?.nodeName === 'A') {
                const parentAnchor = icon.parentNode as HTMLAnchorElement
                const url = parentAnchor.getAttribute('href')
                const name = parentAnchor.innerHTML.replaceAll('<i class="far fa-file"></i>', '').trim()
                parentAnchor.outerHTML = fileLink(url!, name)
            }
        })
    }

    const postImagePopup = () => {
        const imgs = document.querySelectorAll('#post-content img') as NodeListOf<HTMLImageElement>
        for (let i = 0; i < imgs.length; i++) {
            const currentImg = imgs[i]
            currentImg.style.maxWidth = '100%'
            currentImg.addEventListener('click', function () {
                const imgPopupHtml = `<html>
                                  <head>
                                    <meta name="viewport" content="user-scalable=yes, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, width=device-width" />
                                  </head>
                                  <body style="margin:0; background:#000;height:100%;" onclick="javascript:window.close('simpleLightbox');">
                                      <table border="0" width="100%" height="100%">
                                          <tr>
                                              <td valign="middle" align="center">
                                                <img alt="확대 이미지" style="position:relative;z-index:2;width:100%" src="${currentImg.src}"/>
                                              </td>
                                          </tr>
                                      </table>
                                  </body>
                                  </html>`
                const popup = window.open('', 'simpleLightbox', 'noopener,noreferrer')
                if (popup) popup.document.write(imgPopupHtml)
            })
        }
    }

    const initVsCode = (doc: Document) => {
        Array.prototype.slice.call(doc.getElementsByTagName("div"), 0).forEach((div: HTMLDivElement) => {
            if (div.style && div.style.backgroundColor && div.style.backgroundColor === "rgb(30, 30, 30)") {
                if (getRootElement(div)) {
                    div.style.padding = "15px"
                    div.style.scrollPadding = "15px"
                    div.style.overflowX = "scroll"
                }
            }
        })
    }

    const initIntellij = (doc: Document) => {
        Array.prototype.slice.call(doc.getElementsByTagName("div"), 0).forEach((div: HTMLDivElement) => {
            if (div.style && div.style.backgroundColor && div.style.backgroundColor === "rgb(40, 44, 52)") {
                if (getRootElement(div)) {
                    div.style.padding = "15px"
                    div.style.scrollPadding = "15px"
                    div.style.overflowX = "scroll"
                }
            }
        })
    }

    const initJetbrains = (doc: Document) => {
        Array.prototype.slice.call(doc.getElementsByTagName("div"), 0).forEach((div: HTMLDivElement) => {
            if (div.style && div.style.backgroundColor && div.style.backgroundColor === "rgb(43, 43, 43)") {
                if (getRootElement(div)) {
                    div.style.padding = "15px"
                    div.style.scrollPadding = "15px"
                    div.style.overflowX = "scroll"
                }
            }
        })
    }

    const initLinkNewTab = (doc: Document) => {
        Array.prototype.slice.call(doc.getElementsByTagName("a"), 0).forEach((a: HTMLAnchorElement) => {
            a.target = '_blank'
        })
    }

    const getRootElement = (element: HTMLElement): boolean => {
        let rtn = true
        let current: HTMLElement | null = element
        while (current?.parentNode) {
            const parent = current.parentNode as HTMLElement
            if (parent.style && parent.style.backgroundColor && parent.style.backgroundColor === "rgb(30, 30, 30)") {
                rtn = false
                break
            }
            current = parent
        }
        return rtn
    }

    const showDeleteConfirmDialog = () => {
        setShowDeleteConfirm(true)
    }

    const showPublicConfirmDialog = () => {
        if (postPublic) {
            setPublicConfirmQuestion('현재 포스트를 비공개 상태로 변경하시겠습니까?')
        } else {
            setPublicConfirmQuestion('현재 포스트를 공개 상태로 변경하시겠습니까?')
        }
        setShowPublicConfirm(true)
    }

    const deletePost = async () => {
        await service.post.deletePost({postId: String(post?.id)})
            .then((res: { data: { id: number } }) => {
                if (res.data.id === post?.id) {
                    toast.success("삭제에 성공하였습니다.")
                    router.push("/")
                }
            }).catch(() => {
                toast.error("삭제에 실패하였습니다.")
            })
        setShowDeleteConfirm(false)
    }

    const deletePostCancel = () => {
        setShowDeleteConfirm(false)
    }

    const publicPostCancel = () => {
        setShowPublicConfirm(false)
    }

    const onEditor = () => {
        router.push(`/admin/write/${post?.id}`)
    }

    const setPublicStatus = async () => {
        if (postPublic) {
            await service.post.setPublicPost({postId: String(post?.id), publicStatus: false}).then((res: { status: number }) => {
                if (res.status >= 200 && res.status < 300) {
                    setPostPublic(false)
                    toast.success("공개를 비공개로 변경하였습니다.")
                }
            }).catch(() => {
                toast.error("공개를 비공개로 변경하지 못했습니다.")
            })
        } else {
            await service.post.setPublicPost({postId: String(post?.id), publicStatus: true}).then((res: { status: number }) => {
                if (res.status >= 200 && res.status < 300) {
                    setPostPublic(true)
                    toast.success("비공개를 공개로 변경하였습니다.")
                }
            }).catch(() => {
                toast.error("비공개를 공개로 변경하지 못했습니다.")
            })
        }
        setShowPublicConfirm(false)
    }

    const searchCategory = (): string => {
        if (!post?.category?.id) {
            return '/search'
        }
        const condition = {
            ...searchObjectInit,
            ...{
                categories: [{id: post.category.id, name: post.category.name}],
            }
        }
        return `/search?q=${base64Encode(JSON.stringify(condition))}`
    }

    const formatDate = (value: string | undefined): string => {
        if (!value || !isClientMounted) {
            return ''
        }
        return format(new Date(value.endsWith('Z') ? value : `${value}Z`), 'yyyy-MM-dd HH:mm:ss')
    }

    const readingTime = (): string => {
        if (!post?.body) return ''
        const plainText = post.body.replace(/<[^>]*>/g, '')
        const charCount = plainText.length
        const minutes = Math.ceil(charCount / 500)
        return minutes < 1 ? '1분 미만' : `약 ${minutes}분 소요`
    }

    if (post?.id !== 0 && post?.id > 0) {
        return (
            <div className="public-container px-4 pb-8 pt-28 sm:px-6 lg:px-8">
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <article className="surface-panel-strong overflow-hidden rounded-[2rem]">
                        <div className="border-b border-[color:var(--line-soft)] px-6 py-8 sm:px-8">
                            <div className="flex flex-wrap items-start justify-between gap-6">
                                <div className="max-w-3xl">
                                    <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">
                                        Article
                                    </p>
                                    <h1 className="section-title mt-3 text-4xl font-semibold leading-tight tracking-[-0.045em] text-slate-950 dark:text-slate-50 sm:text-5xl">
                                        {post.subject}
                                    </h1>
                                    <div className="public-muted-text mt-5 flex flex-wrap items-center gap-3 text-sm">
                                        <Link href={searchCategory()} className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 font-semibold text-sky-800 transition hover:border-sky-200 hover:bg-sky-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:border-blue-700 dark:hover:bg-blue-900/50">
                                            {post.category?.name}
                                        </Link>
                                        <span className="public-chip-surface-strong inline-flex items-center gap-2 rounded-full border px-4 py-2">
                                            <CalendarDays className="h-4 w-4"/>
                                            created {formatDate(post.created.at)}
                                        </span>
                                        <span className="public-chip-surface-strong inline-flex items-center gap-2 rounded-full border px-4 py-2">
                                            <Clock3 className="h-4 w-4"/>
                                            updated {formatDate(post.updated.at)}
                                        </span>
                                        <span className="public-chip-surface-strong inline-flex items-center gap-2 rounded-full border px-4 py-2">
                                            <BookOpen className="h-4 w-4"/>
                                            {readingTime()}
                                        </span>
                                    </div>
                                </div>

                                {!(userState.isAuthenticated && userState.user.username) ? null :
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="public-control-surface rounded-full border"
                                            aria-label="공개 상태 변경"
                                            onClick={showPublicConfirmDialog}
                                        >
                                            {postPublic ? <Globe className="h-4 w-4"/> : <GlobeLock className="h-4 w-4"/>}
                                            {postPublic ? 'Public' : 'Private'}
                                        </Button>
                                        <Button variant="outline" size="sm" className="public-control-surface rounded-full border" aria-label="edit" onClick={onEditor}>
                                            <Pencil className="h-4 w-4"/>
                                            Edit
                                        </Button>
                                        <Button variant="outline" size="sm" className="public-control-surface rounded-full border text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" aria-label="delete" onClick={showDeleteConfirmDialog}>
                                            <Trash2 className="h-4 w-4"/>
                                            Delete
                                        </Button>
                                    </div>
                                }
                            </div>
                        </div>

                        {series && (
                            <div className="border-b border-[color:var(--line-soft)] px-6 py-5 sm:px-8">
                                <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between text-left"
                                        onClick={() => setSeriesExpanded(!seriesExpanded)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <List className="h-4 w-4 text-sky-600 dark:text-blue-400"/>
                                            <span className="text-sm font-semibold text-sky-800 dark:text-blue-300">{series.title}</span>
                                            <span className="rounded-full bg-sky-200 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-blue-800 dark:text-blue-300">
                                                {series.posts?.length ?? 0}편
                                            </span>
                                        </div>
                                        {seriesExpanded ? <ChevronUp className="h-4 w-4 text-sky-600 dark:text-blue-400"/> : <ChevronDown className="h-4 w-4 text-sky-600 dark:text-blue-400"/>}
                                    </button>
                                    {seriesExpanded && (
                                        <ol className="mt-3 space-y-1 border-t border-sky-200 pt-3 dark:border-blue-800">
                                            {series.posts?.map((sp) => (
                                                <li key={sp.postId}>
                                                    {sp.postId === post.id ? (
                                                        <span className="flex items-center gap-2 rounded-lg bg-sky-200/60 px-3 py-2 text-sm font-semibold text-sky-900 dark:bg-blue-800/40 dark:text-blue-200">
                                                            <span className="text-xs text-sky-500">{sp.seq}.</span>
                                                            {sp.subject}
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            href={`/post/${sp.postId}`}
                                                            className="public-muted-text flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-sky-100 dark:hover:bg-blue-900/30"
                                                        >
                                                            <span className="public-label-text text-xs">{sp.seq}.</span>
                                                            {sp.subject}
                                                        </Link>
                                                    )}
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            </div>
                        )}

                        {(tags?.length > 0 || (userState.isAuthenticated && userState.user.username)) && (
                            <div className="px-6 py-6 sm:px-8">
                                <TagGroupComponent postId={post?.id?.toString() ?? null} tagList={tags} clickable={true}/>
                            </div>
                        )}

                        <div className="border-t border-[color:var(--line-soft)] px-6 py-8 sm:px-8">
                            <div className="content break-words" id="post-content" dangerouslySetInnerHTML={{__html: postBody}}/>
                        </div>

                        <div className="border-t border-[color:var(--line-soft)] px-6 py-6 sm:px-8">
                            <div className="grid gap-4 md:grid-cols-2">
                                {prevPostId === 0 ? (
                                    <div className="public-muted-panel public-muted-text rounded-[1.5rem] border border-dashed px-5 py-6 text-sm">
                                        이전 글이 없습니다.
                                    </div>
                                ) : (
                                    <Link href={`/post/${prevPostId}`} className="public-card-surface group rounded-[1.5rem] border px-5 py-6 transition">
                                        <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">Previous</p>
                                        <div className="public-muted-text mt-3 flex items-center gap-2 text-sm font-semibold transition group-hover:text-sky-700 dark:group-hover:text-blue-400">
                                            <ArrowLeft className="h-4 w-4 shrink-0"/>
                                            <span className="truncate">{prevNext?.prevSubject || '이전 글로 이동'}</span>
                                        </div>
                                    </Link>
                                )}
                                {nextPostId === 0 ? (
                                    <div className="public-muted-panel public-muted-text rounded-[1.5rem] border border-dashed px-5 py-6 text-right text-sm">
                                        다음 글이 없습니다.
                                    </div>
                                ) : (
                                    <Link href={`/post/${nextPostId}`} className="public-card-surface group rounded-[1.5rem] border px-5 py-6 text-right transition">
                                        <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">Next</p>
                                        <div className="public-muted-text mt-3 flex items-center justify-end gap-2 text-sm font-semibold transition group-hover:text-sky-700 dark:group-hover:text-blue-400">
                                            <span className="truncate">{prevNext?.nextSubject || '다음 글로 이동'}</span>
                                            <ArrowRight className="h-4 w-4 shrink-0"/>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {relatedPosts.length > 0 && (
                            <div className="border-t border-[color:var(--line-soft)] px-6 py-6 sm:px-8">
                                <p className="public-label-text mb-4 text-xs font-semibold uppercase tracking-[0.18em]">Related Posts</p>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {relatedPosts.map((related) => (
                                        <Link
                                            key={related.id}
                                            href={`/post/${related.id}`}
                                            className="public-card-surface group rounded-2xl border p-4 transition hover:shadow-sm"
                                        >
                                            <p className="truncate text-sm font-semibold text-foreground transition group-hover:text-sky-700 dark:group-hover:text-blue-400">
                                                {related.subject}
                                            </p>
                                            <div className="public-label-text mt-2 flex items-center gap-2 text-xs">
                                                <span className="public-chip-surface inline-flex rounded-full border px-2 py-0.5">
                                                    {related.categoryName}
                                                </span>
                                                {isClientMounted && related.createDate && (
                                                    <span>{format(new Date(related.createDate), 'yyyy-MM-dd')}</span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>

                    <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
                        <div className="surface-panel-strong rounded-[1.75rem] p-6">
                            <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">
                                Reading Context
                            </p>
                            <TableOfContents postBody={postBody}/>
                        </div>
                        <div className="surface-panel-strong rounded-[1.75rem] p-6">
                            <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">
                                Metadata
                            </p>
                            <dl className="public-muted-text mt-4 space-y-4 text-sm">
                                <div>
                                    <dt className="public-label-text font-semibold">Category</dt>
                                    <dd className="mt-1 text-slate-950 dark:text-slate-100">{post.category?.name || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="public-label-text font-semibold">Tags</dt>
                                    <dd className="mt-1 text-slate-950 dark:text-slate-100">{tags?.length || 0}</dd>
                                </div>
                                <div>
                                    <dt className="public-label-text font-semibold">Visibility</dt>
                                    <dd className="mt-1 text-slate-950 dark:text-slate-100">{postPublic ? 'Public' : 'Private'}</dd>
                                </div>
                            </dl>
                        </div>
                    </aside>
                </div>

                <DeleteConfirm open={showDeleteConfirm} question={'현재 포스트를 삭제하시겠습니까?'} onConfirm={deletePost} onCancel={deletePostCancel}/>
                <PublicConfirm open={showPublicConfirm} question={publicConfirmQuestion} onConfirm={setPublicStatus} onCancel={publicPostCancel}/>

            </div>
        )
    }

    return (
        <article className="mx-auto max-w-4xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
            <div className="surface-panel-strong rounded-[2rem] px-6 py-12 text-center sm:px-8">
                <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">Missing Article</p>
                <h2 className="section-title mt-3 text-4xl font-semibold text-slate-950 dark:text-slate-50">No post found</h2>
            </div>
        </article>
    )
}
