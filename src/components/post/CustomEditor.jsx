import {useEffect, useRef, useState} from "react"
import {Box} from "@mui/material"

// https://velog.io/@sssssssssy/d-19tzdgsn
export default function CustomEditor({defaultData, onChangeData}) {
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
                    loader.file.then((file) => {
                        body.append("files", file)

                        // TODO: 여기서 파일 업로드

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
                    }}
                    onReady={(e) => setEditor(e)}
                    onInit={editor => {
                        // You can store the "editor" and use when it is needed.
                        console.log('Editor is ready to use!', editor)
                    }}
                    onChange={onChange}
                />

            </Box>
        )
        : (
            <h3>Editor loading...</h3>
        )
}