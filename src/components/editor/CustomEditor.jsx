import {useEffect, useRef, useState} from "react"
import {Box} from "@mui/material"
import service from "../../service"
import {useDispatch} from "react-redux"
import {cancelLoading, setLoading} from "../../store/actions/commonActions"
import {useSnackbar} from "notistack"

// https://velog.io/@sssssssssy/d-19tzdgsn
export default function CustomEditor({postId, defaultData, onChangeData}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const editorRef = useRef()
    const dispatch = useDispatch()
    const [editorLoaded, setEditorLoaded] = useState(false)
    const {CKEditor, Editor} = editorRef.current || {}
    const [editor, setEditor] = useState(null)


    useEffect(() => {
        // https://stackoverflow.com/questions/58447134/ckeditor-window-is-not-defined-reactjs-while-implementing
        editorRef.current = {
            CKEditor: require('@ckeditor/ckeditor5-react').CKEditor, // v3+
            Editor: require('ckeditor5-custom-build')
        }
        setEditorLoaded(true)
    }, [])


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

    const imageUploadPlugin = (editor) => {
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return imageUploadAdapter(loader)
        }
    }

    const onReady = (editor) => {
        setEditor(editor)
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
                const content = `<a href="${res.data.resourceUri}"/>${res.data.originFileName}</a>`
                const viewFragment = editor.data.processor.toView(content)
                const modelFragment = editor.data.toModel(viewFragment)
                editor.model.insertContent(
                    modelFragment,
                    editor.model.document.selection
                )
            })
            .catch(err => {
                enqueueSnackbar("파일 업로드에 실패하였습니다.", {variant: "error"})
            })
            .finally(() => {
                dispatch(cancelLoading())
            })
    }


    const onChange = (event, editor) => {
        const data = editor.getData()
        onChangeData(data)
    }

    return editorLoaded ? (
            <Box>
                <CKEditor
                    editor={Editor}
                    data={defaultData ? defaultData : ""}
                    config={{
                        extraPlugins: [
                            imageUploadPlugin,
                            fileUploadPlugin
                        ],
                    }}
                    onReady={onReady}
                    onChange={onChange}
                />

            </Box>
        )
        : (
            <h3>Editor loading...</h3>
        )
}