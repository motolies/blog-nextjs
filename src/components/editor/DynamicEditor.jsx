// https://velog.io/@sssssssssy/d-19tzdgsn
import {useEffect, useRef, useState} from "react"
import {useDispatch} from "react-redux"
import {cancelLoading, setLoading} from "../../store/actions/commonActions"
import service from "../../service"
import {useSnackbar} from "notistack"
import {fileLink} from "../../util/fileLink"
import {FILE_LIST_BY_POST_REQUEST} from "../../store/types/fileTypes"

export default function DynamicEditor({postId, defaultData, onChangeData, insertData, getDataTrigger}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const editorRef = useRef()
    const dispatch = useDispatch()
    const [editorLoaded, setEditorLoaded] = useState(false)
    const {Editor} = editorRef.current || {}
    const [editorInstance, setEditorInstance] = useState(null)

    useEffect(() => {
        // CKEditor5 v46+ 호환성을 위한 dynamic import
        const loadEditor = async () => {
            try {
                const editorModule = require('ckeditor5-custom-build')
                // v46+에서는 default export를 확인해야 함
                const Editor = editorModule.default || editorModule
                editorRef.current = { Editor }
                setEditorLoaded(true)
            } catch (error) {
                console.error('CKEditor 로딩 실패:', error)
            }
        }
        
        loadEditor()
        
        return () => {
            // https://stackoverflow.com/questions/53960532/how-to-destroy-a-ckeditor-5-instance
            const ckIns = document.querySelector('.ck-editor__editable')
            if (ckIns) {
                ckIns.ckeditorInstance.destroy()
            }
        }
    }, [])

    useEffect(() => {
        if (!editorLoaded || postId === null || !Editor)
            return

        const editorElement = document.getElementById('editor')
        if (!editorElement) {
            console.error('Editor DOM 요소를 찾을 수 없습니다.')
            return
        }

        Editor.create(editorElement, {
            extraPlugins: [
                imageUploadPlugin,
                fileUploadPlugin
            ],
        })
            .then(editor => {
                console.log('CKEditor5 성공적으로 로드됨')
                setEditorInstance(editor)
            })
            .catch(error => {
                console.error('CKEditor5 생성 실패:')
                console.error('에러 상세:', error)
                enqueueSnackbar('에디터 로딩에 실패했습니다. 페이지를 새로고침해 주세요.', { variant: 'error' })
            })
    }, [editorLoaded, postId, Editor])

    useEffect(() => {
        if (editorLoaded && insertData !== '') {
            insertDataOnCursor(editorInstance, insertData)
        }
    }, [insertData])

    useEffect(() => {
        if (editorLoaded && getDataTrigger !== '') {
            onChangeData(editorInstance.getData())
        }
    }, [getDataTrigger])

    const refreshFileList = () => {
        dispatch({
            type: FILE_LIST_BY_POST_REQUEST,
            postId: postId
        })
    }

    const imageUploadPlugin = function (editor) {
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return imageUploadAdapter(loader)
        }
    }

    const imageUploadAdapter = (loader) => {
        return {
            upload: () => {
                return new Promise((resolve, reject) => {
                    const body = new FormData()
                    loader.file.then(async (file) => {
                        body.append("file", file)
                        body.append("postId", postId)
                        dispatch(setLoading())
                        await service.file.upload({formData: body})
                            .then(res => {
                                resolve({default: res.data.resourceUri})
                            })
                            .catch(err => {
                                enqueueSnackbar("파일 업로드에 실패하였습니다.", {variant: "error"})
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
    }


    const fileUploadPlugin = function (editor) {
        // https://github.com/ckeditor/ckeditor5/issues/5999
        editor.editing.view.document.on(
            'drop',
            async (event, data) => {
                console.log('drop')
                if (
                    data.dataTransfer.files &&
                    !data.dataTransfer.files[0].type.includes('image')
                ) {
                    event.stop()
                    data.preventDefault()
                    await uploadServer(editor, data.dataTransfer.files[0])
                }
            },
            {priority: 'high'}
        )

        editor.editing.view.document.on(
            'dragover',
            (event, data) => {
                event.stop()
                data.preventDefault()
            },
            {priority: 'high'}
        )
    }

    const uploadServer = async (editor, file) => {
        if (!file) {
            return
        }

        const body = new FormData()
        body.append("file", file)
        body.append("postId", postId)
        dispatch(setLoading())
        await service.file.upload({formData: body})
            .then(res => {
                const fileTag = fileLink(res.data.resourceUri, res.data.originName)
                insertDataOnCursor(editor, fileTag)
            })
            .catch(err => {
                enqueueSnackbar("파일 업로드에 실패하였습니다.", {variant: "error"})
            })
            .finally(() => {
                dispatch(cancelLoading())
            })
        refreshFileList()
    }

    const insertDataOnCursor = (editor, data) => {
        // TODO : 같은 파일을 연속으로 넣고 싶은데 안된다.
        const viewFragment = editor.data.processor.toView(data)
        const modelFragment = editor.data.toModel(viewFragment)
        editor.model.insertContent(
            modelFragment,
            editor.model.document.selection
        )
    }


    return editorLoaded ? (
            <div id={'editor'} dangerouslySetInnerHTML={{__html: defaultData}}/>
        )
        : (
            <h3>Editor loading...</h3>
        )
}