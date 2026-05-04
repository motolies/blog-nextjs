import CategoryAutoComplete from "../../components/CategoryAutoComplete"
import {toast} from 'sonner'
import {useCallback, useEffect, useRef, useState} from "react"
import {usePostFormStore} from "../../store/usePostFormStore"
import {useLoadingStore} from "../../store/useLoadingStore"
import {getTsid} from 'tsid-ts'
import DynamicEditor from "../editor/DynamicEditor"
import service from "../../service"
import {useRouter} from "next/router"
import TagGroupComponent from "./TagGroupComponent"
import {FileComponent} from "./FileComponent"
import {fileLink} from "../../util/fileLink"
import FileUploadComponent from "../editor/FileUploadComponent"
import {useFiles, useInvalidateFiles} from "../../hooks/useFiles"
import {Button} from "../ui/button"
import {Input} from "../ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../ui/select"
import ConfirmDialog from "../confirm/ConfirmDialog"
import PostPreviewDialog from "./PostPreviewDialog"
import {LogOut, Eye, Save, Send, Undo2} from 'lucide-react'
import type {Tag} from "@/types/tag"
import type {Post, PostStatus} from "@/types/post"
import type {Category} from "@/types/category"

export default function PostModifyComponent() {
    const router = useRouter()
    const {post, setSubject, setCategoryId, setBody, setPublic: setPostPublic, loadForModify} = usePostFormStore()
    const {setLoading, cancelLoading} = useLoadingStore()
    const {data: files} = useFiles(post.id)
    const invalidateFiles = useInvalidateFiles()
    const [insertData, setInsertData] = useState<string>('')
    const [triggerGetData, setTriggerGetData] = useState<string>('')
    const [triggerGetDataForPreview, setTriggerGetDataForPreview] = useState<string>('')
    const [tags, setTags] = useState<Tag[]>([])
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(null)
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
    const [discardDraftConfirmOpen, setDiscardDraftConfirmOpen] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewSubject, setPreviewSubject] = useState<string>('')
    const [previewBody, setPreviewBody] = useState<string>('')
    const postRef = useRef<Post>(post)
    const initialBodyRef = useRef<string>(post.body)
    const initialSubjectRef = useRef<string>(post.subject)
    const isSavingRef = useRef<boolean>(false)
    const pendingStatusRef = useRef<PostStatus>('PUBLISH')

    useEffect(() => {
        postRef.current = post
    }, [post])

    useEffect(() => {
        setTags(post.tags)
    }, [post.tags])

    const savePost = useCallback((body: string, trigger?: string, status?: PostStatus) => {
        if (isSavingRef.current) {
            return
        }

        const isAutosave = trigger === 'autosave'
        const saveStatus: PostStatus = status ?? (isAutosave ? 'TEMP' : 'PUBLISH')

        isSavingRef.current = true
        const nextPost = {
            ...postRef.current,
            body,
            status: saveStatus,
        }

        if (isAutosave) {
            setSaveStatus('saving')
        } else {
            setLoading()
        }

        service.post.save({post: nextPost}).then(() => {
            if (isAutosave) {
                setSaveStatus('saved')
                setLastSavedTime(new Date().toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}))
            } else if (saveStatus === 'TEMP') {
                setSaveStatus('saved')
                setLastSavedTime(new Date().toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}))
                toast.success("임시저장되었습니다.")
            } else {
                router.push(`/post/${nextPost.id}`)
            }
        }).catch((err: unknown) => {
            toast.error("저장에 실패하였습니다.")
            console.error("content save error", err)
            if (isAutosave) {
                setSaveStatus('idle')
            }
        }).finally(() => {
            isSavingRef.current = false
            if (!isAutosave) {
                cancelLoading()
            }
        })
    }, [setLoading, cancelLoading, router])

    const onDiscardDraft = useCallback(async () => {
        if (!post.id) return
        setLoading()
        try {
            await service.post.deleteDraft({postId: String(post.id)})
            await loadForModify(String(post.id))
            toast.success("초안이 폐기되었습니다.")
        } catch {
            toast.error("초안 폐기에 실패하였습니다.")
        } finally {
            cancelLoading()
        }
    }, [post.id, setLoading, cancelLoading, loadForModify])

    const onChangeCategory = (category: Category | null) => {
        if (category?.id) {
            setCategoryId(category.id)
        } else {
            toast.error("카테고리는 필수로 선택해야 합니다.")
        }
    }

    const refreshFileList = () => {
        invalidateFiles(post.id)
    }

    const onChangeBody = useCallback((body: string, options: {shouldSave?: boolean; trigger?: string} = {}) => {
        if (options.trigger === 'preview') {
            setPreviewSubject(postRef.current.subject)
            setPreviewBody(body)
            setPreviewOpen(true)
            return
        }

        setBody(body)

        if (options.shouldSave) {
            const status = options.trigger === 'autosave' ? 'TEMP' as PostStatus : pendingStatusRef.current
            savePost(body, options.trigger, status)
        }
    }, [setBody, savePost])

    const onChangeFile = async (files: FileList | undefined) => {
        if (files === undefined || files.length === 0) return
        if (!post.id) {
            toast.warning("게시글이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.")
            return
        }
        setLoading()
        for (const file of Array.from(files)) {
            const body = new FormData()
            body.append("file", file)
            body.append("postId", post.id)
            await service.file.upload({formData: body})
                .then(() => {
                    toast.success("파일 업로드에 성공하였습니다.")
                })
                .catch(() => {
                    toast.error("파일 업로드에 실패하였습니다.")
                })
        }
        cancelLoading()
        refreshFileList()
    }

    const onDeleteFile = (file: {id: string}) => {
        setLoading()
        service.file.delete({fileId: file.id})
            .then(() => {
                toast.success("파일을 삭제하였습니다.")
            })
            .catch(() => {
                toast.error("파일 삭제에 실패하였습니다.")
            })
            .finally(() => {
                cancelLoading()
                refreshFileList()
            })
    }

    const onInsertFile = (file: {type: string; resourceUri: string; originName: string}) => {
        if (file.type.startsWith('image')) {
            const html = `<p style="text-align:center;">
                                <img src="${file.resourceUri}">
                            </p>`
            setInsertData(html)
        } else {
            const html = fileLink(file.resourceUri, file.originName)
            setInsertData(html)
        }
    }

    return (
        <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            {/* 에디터 영역 */}
            <div className="admin-panel admin-panel-pad min-w-0">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--admin-text-faint)]">Editor</p>
                        <h2 className="mt-1 text-lg font-semibold text-[color:var(--admin-text)]">본문 편집</h2>
                    </div>
                    <span className="admin-pill">
                        집중 작성 모드
                    </span>
                </div>
                <Input
                    placeholder="Title"
                    value={post.subject}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSubject(e.target.value)
                    }
                    className="mb-4"
                />
                <DynamicEditor postId={post.id} defaultData={post.body} onChangeData={onChangeBody} insertData={insertData} getDataTrigger={triggerGetData} getDataPreviewTrigger={triggerGetDataForPreview} onSaveShortcut={() => {
                    if (!isSavingRef.current) {
                        pendingStatusRef.current = 'TEMP'
                        setTriggerGetData(getTsid().toString())
                    }
                }}/>
            </div>

            {/* 사이드바 영역 */}
            <div className="admin-panel admin-panel-pad space-y-3 xl:max-h-[calc(100vh-15rem)] xl:overflow-y-auto">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--admin-text-faint)]">Settings</p>
                    <h2 className="mt-1 text-lg font-semibold text-[color:var(--admin-text)]">게시 설정</h2>
                </div>
                <CategoryAutoComplete onChangeCategory={onChangeCategory} setCategoryId={(post.category as {id: string}).id} label={'Category'}/>

                <Select
                    value={String(post.public)}
                    onValueChange={(v: string) =>
                        setPostPublic(v === 'true')
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="isPublic"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="true">공개</SelectItem>
                        <SelectItem value="false">비공개</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="outline" className="w-full" onClick={() => {
                    toast.warning("모달창에서 검색해서 선택할 수 있도록 하자.")
                    setInsertData(`${getTsid().toString()}`)
                }}>이전 글 넣기</Button>

                <div>
                    <FileUploadComponent multiple onChange={onChangeFile} className="mb-1"/>
                    <div className="overflow-y-auto max-h-[25vh]">
                        {(files ?? post.files)?.filter((f: any) => f.type?.startsWith('image')).map((file: any) => (
                            <FileComponent key={file.id} file={file} onDeleteFile={onDeleteFile} onInsertFile={onInsertFile}/>
                        ))}
                        {(files ?? post.files)?.filter((f: any) => !f.type?.startsWith('image')).map((file: any) => (
                            <FileComponent key={file.id} file={file} onDeleteFile={onDeleteFile} onInsertFile={onInsertFile}/>
                        ))}
                    </div>
                </div>

                <TagGroupComponent postId={post.id} tagList={tags} writePage={true} listHeight={{
                    overflowY: 'auto',
                    maxHeight: '15vh',
                    marginTop: '0.25rem',
                }}/>

                <Button variant="outline" className="w-full" onClick={() => setTriggerGetDataForPreview(getTsid().toString())}>
                    <Eye size={16} className="mr-2" />
                    미리보기
                </Button>

                <div className="flex items-center justify-between text-xs text-[color:var(--admin-text-faint)]">
                    <div>
                        {post.hasDraft && post.status === 'PUBLISH' && (
                            <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
                                onClick={() => setDiscardDraftConfirmOpen(true)}
                            >
                                <Undo2 size={12} />
                                초안 폐기
                            </button>
                        )}
                    </div>
                    <div>
                        {saveStatus === 'saving' && '저장 중...'}
                        {saveStatus === 'saved' && lastSavedTime && `마지막 저장: ${lastSavedTime}`}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => {
                            if (isSavingRef.current) {
                                return
                            }
                            pendingStatusRef.current = 'TEMP'
                            setTriggerGetData(getTsid().toString())
                        }}
                    >
                        <Save size={16} className="mr-1" />
                        임시저장
                    </Button>
                    <Button
                        size="lg"
                        onClick={() => {
                            if (isSavingRef.current) {
                                return
                            }
                            pendingStatusRef.current = 'PUBLISH'
                            setTriggerGetData(getTsid().toString())
                        }}
                    >
                        <Send size={16} className="mr-1" />
                        발행
                    </Button>
                    <Button size="lg" variant="destructive" onClick={() => {
                        const hasChanges = post.body !== initialBodyRef.current || post.subject !== initialSubjectRef.current
                        if (hasChanges) {
                            setCancelConfirmOpen(true)
                        } else {
                            post.id ? router.push(`/post/${post.id}`) : router.back()
                        }
                    }}>취소</Button>
                </div>

                <ConfirmDialog
                    open={cancelConfirmOpen}
                    icon={LogOut}
                    iconClassName="text-amber-500"
                    title="작성 취소"
                    question="저장하지 않은 내용이 있습니다. 정말 나가시겠습니까?"
                    confirmText="나가기"
                    onConfirm={() => {
                        setCancelConfirmOpen(false)
                        post.id ? router.push(`/post/${post.id}`) : router.back()
                    }}
                    onCancel={() => setCancelConfirmOpen(false)}
                />

                <ConfirmDialog
                    open={discardDraftConfirmOpen}
                    icon={Undo2}
                    iconClassName="text-amber-500"
                    title="초안 폐기"
                    question="초안을 폐기하고 발행된 원본 내용으로 되돌리시겠습니까?"
                    confirmText="폐기"
                    onConfirm={() => {
                        setDiscardDraftConfirmOpen(false)
                        onDiscardDraft()
                    }}
                    onCancel={() => setDiscardDraftConfirmOpen(false)}
                />

                <PostPreviewDialog
                    open={previewOpen}
                    subject={previewSubject}
                    body={previewBody}
                    onClose={() => setPreviewOpen(false)}
                />
            </div>
        </div>
    )
}
