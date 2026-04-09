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
import type {Tag} from "@/types/tag"
import type {Post} from "@/types/post"
import type {Category} from "@/types/category"

export default function PostModifyComponent() {
    const router = useRouter()
    const {post, setSubject, setCategoryId, setBody, setPublic: setPostPublic} = usePostFormStore()
    const {setLoading, cancelLoading} = useLoadingStore()
    const {data: files} = useFiles(post.id)
    const invalidateFiles = useInvalidateFiles()
    const [insertData, setInsertData] = useState<string>('')
    const [triggerGetData, setTriggerGetData] = useState<string>('')
    const [tags, setTags] = useState<Tag[]>([])
    const postRef = useRef<Post>(post)
    const isSavingRef = useRef<boolean>(false)

    useEffect(() => {
        postRef.current = post
    }, [post])

    useEffect(() => {
        setTags(post.tags)
    }, [post.tags])

    const savePost = useCallback((body: string) => {
        if (isSavingRef.current) {
            return
        }

        isSavingRef.current = true
        const nextPost = {
            ...postRef.current,
            body,
        }

        setLoading()
        service.post.save({post: nextPost}).then(() => {
            router.push(`/post/${nextPost.id}`)
        }).catch((err: unknown) => {
            toast.error("저장에 실패하였습니다.")
            console.error("content save error", err)
        }).finally(() => {
            isSavingRef.current = false
            cancelLoading()
        })
    }, [setLoading, cancelLoading, router])

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

    const onChangeBody = useCallback((body: string, options: {shouldSave?: boolean} = {}) => {
        setBody(body)

        if (options.shouldSave) {
            savePost(body)
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
                <DynamicEditor postId={post.id} defaultData={post.body} onChangeData={onChangeBody} insertData={insertData} getDataTrigger={triggerGetData}/>
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

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        size="lg"
                        onClick={() => {
                            if (isSavingRef.current) {
                                return
                            }
                            setTriggerGetData(getTsid().toString())
                        }}
                    >
                        저장
                    </Button>
                    <Button size="lg" variant="destructive">취소</Button>
                </div>
            </div>
        </div>
    )
}
