import {useEffect, useState} from "react"
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Clock3,
    Globe,
    GlobeLock,
    Pencil,
    Trash2
} from "lucide-react"
import {Button} from "../ui/button"
import DeleteConfirm from "../confirm/DeleteConfirm"
import {useRouter} from "next/router"
import {toast} from 'sonner'
import {useSelector} from "react-redux"
import PublicConfirm from "../confirm/PublicConfirm"
import TagGroupComponent from "./TagGroupComponent"
import Link from "next/link"
import {searchObjectInit} from "../../model/searchObject"
import {base64Encode} from "../../util/base64Util"
import {fileLink} from "../../util/fileLink"
import {usePostNavigationShortcut} from "../../util/usePostNavigationShortcut"
import styles from './PostComponent.module.css'
import {format} from 'date-fns'
import service from "../../service"

export default function PostComponent({post, prevNext}) {
    const router = useRouter()
    const userState = useSelector((state) => state.user)

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showPublicConfirm, setShowPublicConfirm] = useState(false)
    const [postPublic, setPostPublic] = useState(post?.public)
    const [tags, setTags] = useState(post?.tags || [])
    const [publicConfirmQuestion, setPublicConfirmQuestion] = useState('')
    const [postBody, setPostBody] = useState('')
    const [isClientMounted, setIsClientMounted] = useState(false)

    const prevPostId = prevNext?.prev || 0
    const nextPostId = prevNext?.next || 0

    const onKeyPress = (event) => {
        if (event.ctrlKey && event.key === 'ArrowLeft' && prevPostId !== 0) {
            router.push(`/post/${prevPostId}`)
        } else if (event.ctrlKey && event.key === 'ArrowRight' && nextPostId !== 0) {
            router.push(`/post/${nextPostId}`)
        }
    }

    usePostNavigationShortcut(['ArrowLeft', 'ArrowRight'], onKeyPress)

    useEffect(() => {
        setPostPublic(post?.public)
        setTags(post?.tags || [])
    }, [post])

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
            if (icon.parentNode.nodeName === 'A') {
                const url = icon.parentNode.getAttribute('href')
                const name = icon.parentNode.innerHTML.replaceAll('<i class="far fa-file"></i>', '').trim()
                icon.parentNode.outerHTML = fileLink(url, name)
            }
        })
    }

    const postImagePopup = () => {
        const imgs = document.querySelectorAll('#post-content img')
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

    const initVsCode = (doc) => {
        Array.prototype.slice.call(doc.getElementsByTagName("div"), 0).forEach(div => {
            if (div.style && div.style.backgroundColor && div.style.backgroundColor === "rgb(30, 30, 30)") {
                if (getRootElement(div)) {
                    div.style.padding = "15px"
                    div.style.scrollPadding = "15px"
                    div.style.overflowX = "scroll"
                }
            }
        })
    }

    const initIntellij = (doc) => {
        Array.prototype.slice.call(doc.getElementsByTagName("div"), 0).forEach(div => {
            if (div.style && div.style.backgroundColor && div.style.backgroundColor === "rgb(40, 44, 52)") {
                if (getRootElement(div)) {
                    div.style.padding = "15px"
                    div.style.scrollPadding = "15px"
                    div.style.overflowX = "scroll"
                }
            }
        })
    }

    const initJetbrains = (doc) => {
        Array.prototype.slice.call(doc.getElementsByTagName("div"), 0).forEach(div => {
            if (div.style && div.style.backgroundColor && div.style.backgroundColor === "rgb(43, 43, 43)") {
                if (getRootElement(div)) {
                    div.style.padding = "15px"
                    div.style.scrollPadding = "15px"
                    div.style.overflowX = "scroll"
                }
            }
        })
    }

    const initLinkNewTab = (doc) => {
        Array.prototype.slice.call(doc.getElementsByTagName("a"), 0).forEach(a => {
            a.target = '_blank'
        })
    }

    const getRootElement = (element) => {
        let rtn = true
        while (element.parentNode) {
            if (element.parentNode.style && element.parentNode.style.backgroundColor && element.parentNode.style.backgroundColor === "rgb(30, 30, 30)") {
                rtn = false
                break
            }
            element = element.parentNode
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
        await service.post.deletePost({postId: post?.id})
            .then(res => {
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
            await service.post.setPublicPost({postId: post?.id, publicStatus: false}).then(res => {
                if (res.status >= 200 && res.status < 300) {
                    setPostPublic(false)
                    toast.success("공개를 비공개로 변경하였습니다.")
                }
            }).catch(() => {
                toast.error("공개를 비공개로 변경하지 못했습니다.")
            })
        } else {
            await service.post.setPublicPost({postId: post?.id, publicStatus: true}).then(res => {
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

    const searchCategory = () => {
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

    const formatDate = (value) => {
        if (!value || !isClientMounted) {
            return ''
        }
        return format(new Date(value.endsWith('Z') ? value : `${value}Z`), 'yyyy-MM-dd HH:mm:ss')
    }

    if (post?.id !== 0 && post?.id > 0) {
        return (
            <div className="public-container px-4 pb-8 pt-28 sm:px-6 lg:px-8">
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <article className="surface-panel-strong overflow-hidden rounded-[2rem]">
                        <div className="border-b border-slate-200/80 px-6 py-8 sm:px-8">
                            <div className="flex flex-wrap items-start justify-between gap-6">
                                <div className="max-w-3xl">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Article
                                    </p>
                                    <h1 className="section-title mt-3 text-4xl font-semibold leading-tight tracking-[-0.045em] text-slate-950 sm:text-5xl">
                                        {post.subject}
                                    </h1>
                                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                        <Link href={searchCategory()} className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 font-semibold text-sky-800 transition hover:border-sky-200 hover:bg-sky-100">
                                            {post.category?.name}
                                        </Link>
                                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2">
                                            <CalendarDays className="h-4 w-4"/>
                                            created {formatDate(post.created.at)}
                                        </span>
                                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2">
                                            <Clock3 className="h-4 w-4"/>
                                            updated {formatDate(post.updated.at)}
                                        </span>
                                    </div>
                                </div>

                                {!(userState.isAuthenticated && userState.user.username) ? null :
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-full border-slate-200 bg-white"
                                            aria-label="공개 상태 변경"
                                            onClick={showPublicConfirmDialog}
                                        >
                                            {postPublic ? <Globe className="h-4 w-4"/> : <GlobeLock className="h-4 w-4"/>}
                                            {postPublic ? 'Public' : 'Private'}
                                        </Button>
                                        <Button variant="outline" size="sm" className="rounded-full border-slate-200 bg-white" aria-label="edit" onClick={onEditor}>
                                            <Pencil className="h-4 w-4"/>
                                            Edit
                                        </Button>
                                        <Button variant="outline" size="sm" className="rounded-full border-slate-200 bg-white text-red-600 hover:text-red-700" aria-label="delete" onClick={showDeleteConfirmDialog}>
                                            <Trash2 className="h-4 w-4"/>
                                            Delete
                                        </Button>
                                    </div>
                                }
                            </div>
                        </div>

                        <div className="px-6 py-6 sm:px-8">
                            <TagGroupComponent postId={post?.id} tagList={tags} clickable={true}/>
                        </div>

                        <div className="border-t border-slate-200/70 px-6 py-8 sm:px-8">
                            <div className="content break-words" id="post-content" dangerouslySetInnerHTML={{__html: postBody}}/>
                        </div>

                        <div className="border-t border-slate-200/80 px-6 py-6 sm:px-8">
                            <div className="grid gap-4 md:grid-cols-2">
                                {prevPostId === 0 ? (
                                    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-6 text-sm text-slate-400">
                                        이전 글이 없습니다.
                                    </div>
                                ) : (
                                    <Link href={`/post/${prevPostId}`} className="group rounded-[1.5rem] border border-slate-200 bg-white/80 px-5 py-6 transition hover:border-sky-200">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Previous</p>
                                        <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition group-hover:text-sky-700">
                                            <ArrowLeft className="h-4 w-4"/>
                                            이전 글로 이동
                                        </div>
                                    </Link>
                                )}
                                {nextPostId === 0 ? (
                                    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-6 text-right text-sm text-slate-400">
                                        다음 글이 없습니다.
                                    </div>
                                ) : (
                                    <Link href={`/post/${nextPostId}`} className="group rounded-[1.5rem] border border-slate-200 bg-white/80 px-5 py-6 text-right transition hover:border-sky-200">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Next</p>
                                        <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition group-hover:text-sky-700">
                                            다음 글로 이동
                                            <ArrowRight className="h-4 w-4"/>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </article>

                    <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
                        <div className="surface-panel-strong rounded-[1.75rem] p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Reading Context
                            </p>

                        </div>
                        <div className="surface-panel-strong rounded-[1.75rem] p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Metadata
                            </p>
                            <dl className="mt-4 space-y-4 text-sm text-slate-600">
                                <div>
                                    <dt className="font-semibold text-slate-500">Category</dt>
                                    <dd className="mt-1 text-slate-950">{post.category?.name || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-slate-500">Tags</dt>
                                    <dd className="mt-1 text-slate-950">{tags?.length || 0}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold text-slate-500">Visibility</dt>
                                    <dd className="mt-1 text-slate-950">{postPublic ? 'Public' : 'Private'}</dd>
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Missing Article</p>
                <h2 className="section-title mt-3 text-4xl font-semibold text-slate-950">No post found</h2>
            </div>
        </article>
    )
}
