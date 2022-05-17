import {useEffect, useRef, useState} from "react"
import {Box} from "@mui/material"
import service from "../../service"

// https://velog.io/@sssssssssy/d-19tzdgsn
export default function CustomEditor({postId, defaultData, onChangeData}) {
    const editorRef = useRef()
    const [editorLoaded, setEditorLoaded] = useState(false)
    const {CKEditor, ClassicEditor} = editorRef.current || {}
    const [editor, setEditor] = useState(null)


    useEffect(() => {
        // https://stackoverflow.com/questions/58447134/ckeditor-window-is-not-defined-reactjs-while-implementing
        editorRef.current = {
            CKEditor: require('@ckeditor/ckeditor5-react').CKEditor, // v3+
            ClassicEditor: require('@ckeditor/ckeditor5-build-classic')
        }
        setEditorLoaded(true)
    }, [])


    const UploadAdapter = (loader) => {
        return {
            upload: () => {
                return new Promise((resolve, reject) => {
                    const body = new FormData()
                    loader.file.then(async (file) => {
                        body.append("file", file)
                        body.append("contentId", postId)

                        // TODO: 여기서 파일 업로드
                        await service.file.upload({formData: body})
                            .then(res => {
                                resolve({default: res.data.resourceUri})
                            })
                            .catch(err => {
                                reject(err)
                            })

                    })
                })
            }
        }
    }

    const uploadPlugin = (editor) => {
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return UploadAdapter(loader)
        }
    }


    const onChange = (event, editor) => {
        const data = editor.getData()
        onChangeData(data)
    }

    return editorLoaded ? (
            <Box>
                <CKEditor
                    editor={ClassicEditor}
                    data={defaultData ? defaultData : ""}
                    config={{
                        extraPlugins: [uploadPlugin],
                        toolbar: { 		//사용 툴바
                            items: [
                                'heading',
                                '|',
                                'bold',
                                'italic',
                                'link',
                                'bulletedList',
                                'numberedList',
                                '|',
                                'outdent',
                                'indent',
                                '|',
                                'imageUpload',
                                'blockQuote',
                                'insertTable',
                                'mediaEmbed',
                                'undo',
                                'redo'
                            ]
                        },
                    }}
                    onReady={(e) => setEditor(e)}
                    onChange={onChange}
                />

            </Box>
        )
        : (
            <h3>Editor loading...</h3>
        )
}