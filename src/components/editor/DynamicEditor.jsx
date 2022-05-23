// https://velog.io/@sssssssssy/d-19tzdgsn
import {useEffect, useRef, useState} from "react"
import {useDispatch, useSelector} from "react-redux"
import {cancelLoading, setLoading} from "../../store/actions/commonActions"
import service from "../../service"
import {useSnackbar} from "notistack"
import {POST_LOCAL_MODIFY_FILE} from "../../store/types/postTypes"
import {editorFileLink} from "../../util/viewerFileLink"

export default function DynamicEditor({postId, defaultData, onChangeData, insertData, getDataTrigger}) {
    const postFile = useSelector(state => state.post.modifyPost.file)
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const editorRef = useRef()
    const dispatch = useDispatch()
    const [editorLoaded, setEditorLoaded] = useState(false)
    const {Editor} = editorRef.current || {}
    const [editorInstance, setEditorInstance] = useState(null)

    useEffect(() => {
        editorRef.current = {
            Editor: require('ckeditor5-custom-build')
        }
        setEditorLoaded(true)
        return () => {
            // https://stackoverflow.com/questions/53960532/how-to-destroy-a-ckeditor-5-instance
            const ckIns = document.querySelector('.ck-editor__editable')
            if (ckIns) {
                ckIns.ckeditorInstance.destroy()
            }
        }
    }, [])

    useEffect(() => {
        if (!editorLoaded || postId === null)
            return

        Editor.create(document.getElementById('editor'), {
            extraPlugins: [
                imageUploadPlugin,
                fileUploadPlugin
            ],
        })
            .then(editor => {
                setEditorInstance(editor)
            })
            .catch(error => {
                console.error('Oops, something went wrong!')
                console.error('Please, report the following error on https://github.com/ckeditor/ckeditor5/issues with the build id and the error stack trace:')
                console.warn('Build id: 5wt7uafw81ce-w6cyizl4wv1b')
                console.error(error)
            })
    }, [editorLoaded, postId])

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

    const imageUploadPlugin = (editor) => {
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
                        body.append("contentId", postId)
                        dispatch(setLoading())
                        await service.file.upload({formData: body})
                            .then(res => {
                                dispatch({
                                    type: POST_LOCAL_MODIFY_FILE,
                                    file: [...postFile, res.data],
                                })
                                resolve({default: res.data.resourceUri})
                            })
                            .catch(err => {
                                enqueueSnackbar("파일 업로드에 실패하였습니다.", {variant: "error"})
                                reject(err)
                            })
                            .finally(() => {
                                dispatch(cancelLoading())
                            })

                    })
                })
            }
        }
    }


    const fileUploadPlugin = (editor) => {
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
        body.append("contentId", postId)
        dispatch(setLoading())
        await service.file.upload({formData: body})
            .then(res => {
                dispatch({
                    type: POST_LOCAL_MODIFY_FILE,
                    file: [...postFile, res.data],
                })
                const fileTag = editorFileLink(res.data.resourceUri, res.data.originFileName)
                insertDataOnCursor(editor, fileTag)
            })
            .catch(err => {
                enqueueSnackbar("파일 업로드에 실패하였습니다.", {variant: "error"})
            })
            .finally(() => {
                dispatch(cancelLoading())
            })
    }

    const insertDataOnCursor = (editor, data) => {
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