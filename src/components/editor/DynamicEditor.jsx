import { useRef, useCallback } from "react"
import { useDispatch } from "react-redux"
import { cancelLoading, setLoading } from "../../store/actions/commonActions"
import service from "../../service"
import { toast } from 'sonner'
import { fileLink } from "../../util/fileLink"
import { FILE_LIST_BY_POST_REQUEST } from "../../store/types/fileTypes"
import dynamic from 'next/dynamic'

function EditorLoadErrorFallback() {
    return (
        <div
            className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
            role="alert"
        >
            <p className="font-semibold">에디터를 불러오지 못했습니다.</p>
            <p className="mt-1 text-amber-100/80">페이지를 새로고침한 뒤 다시 시도해주세요.</p>
        </div>
    )
}

const CKEditorWrapper = dynamic(
    () =>
        import('./CKEditorWrapper')
            .then((module) => module.default)
            .catch((error) => {
                console.error('CKEditor wrapper load failed:', error)
                return EditorLoadErrorFallback
            }),
    {
    ssr: false,
    loading: () => <h3>Editor loading...</h3>
    }
)

export default function DynamicEditor({ postId, defaultData, onChangeData, insertData, getDataTrigger }) {
    const postIdRef = useRef(postId)
    const dispatch = useDispatch()

    // postIdRef를 최신 상태로 유지
    postIdRef.current = postId

    const refreshFileList = useCallback(() => {
        dispatch({
            type: FILE_LIST_BY_POST_REQUEST,
            postId: postIdRef.current
        })
    }, [dispatch])

    const imageUploadAdapter = useCallback((loader) => {
        return {
            upload: () => {
                return new Promise((resolve, reject) => {
                    const body = new FormData()
                    loader.file.then(async (file) => {
                        if (!postIdRef.current) {
                            toast.warning("게시글이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.")
                            reject(new Error("postId is null"))
                            return
                        }
                        body.append("file", file)
                        body.append("postId", postIdRef.current)
                        dispatch(setLoading())
                        await service.file.upload({ formData: body })
                            .then(res => {
                                resolve({ default: res.data.resourceUri })
                            })
                            .catch(err => {
                                toast.error("파일 업로드에 실패하였습니다.")
                                reject(err)
                            })
                            .finally(() => {
                                dispatch(cancelLoading())
                            })
                        refreshFileList()
                    })
                })
            }
        }
    }, [dispatch, refreshFileList])

    const uploadServer = useCallback(async (editor, file) => {
        if (!file) return

        if (!postIdRef.current) {
            toast.warning("게시글이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.")
            return
        }

        const body = new FormData()
        body.append("file", file)
        body.append("postId", postIdRef.current)
        dispatch(setLoading())
        await service.file.upload({ formData: body })
            .then(res => {
                const fileTag = fileLink(res.data.resourceUri, res.data.originName)
                const viewFragment = editor.data.processor.toView(fileTag)
                const modelFragment = editor.data.toModel(viewFragment)
                editor.model.insertContent(modelFragment, editor.model.document.selection)
            })
            .catch(() => {
                toast.error("파일 업로드에 실패하였습니다.")
            })
            .finally(() => {
                dispatch(cancelLoading())
            })
        refreshFileList()
    }, [dispatch, refreshFileList])

    return (
        <CKEditorWrapper
            postId={postId}
            defaultData={defaultData}
            onChangeData={onChangeData}
            insertData={insertData}
            getDataTrigger={getDataTrigger}
            imageUploadAdapter={imageUploadAdapter}
            uploadServer={uploadServer}
        />
    )
}
