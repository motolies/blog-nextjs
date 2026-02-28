import { useEffect, useRef, useState } from "react"
import { CKEditor } from '@ckeditor/ckeditor5-react'
import {
    Autoformat, AutoImage, Autosave, BlockQuote, Bold, Code, CodeBlock,
    Essentials, FontBackgroundColor, FontColor, FontFamily, FontSize,
    GeneralHtmlSupport, Heading, Highlight, HorizontalLine,
    HtmlEmbed, ImageBlock, ImageCaption, ImageInline,
    ImageInsert, ImageInsertViaUrl, ImageResize, ImageStyle,
    ImageTextAlternative, ImageToolbar, ImageUpload, Indent, IndentBlock,
    Italic, Link, LinkImage, List, ListProperties, MediaEmbed, Mention,
    Paragraph, PasteFromOffice, RemoveFormat, SourceEditing, SpecialCharacters,
    SpecialCharactersArrows, SpecialCharactersCurrency,
    SpecialCharactersEssentials, SpecialCharactersLatin,
    SpecialCharactersMathematical, SpecialCharactersText, Strikethrough,
    Subscript, Superscript, Table, TableCaption, TableCellProperties,
    TableColumnResize, TableProperties, TableToolbar,
    TextTransformation, TodoList, Underline, WordCount, ClassicEditor
} from 'ckeditor5'
import translations from 'ckeditor5/translations/ko.js'
import 'ckeditor5/ckeditor5.css'

function EditorInitError({ message }) {
    return (
        <div
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            role="alert"
        >
            <p className="font-semibold">에디터 초기화에 실패했습니다.</p>
            <p className="mt-1 text-red-100/80">{message}</p>
        </div>
    )
}

function createEditorConfig({ defaultData, imageUploadAdapter, uploadServer }) {
    const customImageUploadPlugin = function (editor) {
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            return imageUploadAdapter(loader)
        }
    }

    const fileUploadPlugin = function (editor) {
        editor.editing.view.document.on(
            'drop',
            async (event, data) => {
                if (
                    data.dataTransfer.files &&
                    !data.dataTransfer.files[0].type.includes('image')
                ) {
                    event.stop()
                    data.preventDefault()
                    await uploadServer(editor, data.dataTransfer.files[0])
                }
            },
            { priority: 'high' }
        )

        editor.editing.view.document.on(
            'dragover',
            (event, data) => {
                event.stop()
                data.preventDefault()
            },
            { priority: 'high' }
        )
    }

    return {
        toolbar: {
            items: [
                'undo', 'redo', '|', 'sourceEditing', 'horizontalLine', '|',
                'heading', '|', 'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
                'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript',
                'code', 'codeBlock', 'removeFormat', '-',
                'specialCharacters', 'link', 'insertImage', 'mediaEmbed',
                'insertTable', 'highlight', 'blockQuote', 'htmlEmbed', '|',
                'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent'
            ],
            shouldNotGroupWhenFull: true
        },
        plugins: [
            Autoformat, AutoImage, Autosave, BlockQuote, Bold, Code, CodeBlock,
            Essentials, FontBackgroundColor, FontColor, FontFamily, FontSize,
            GeneralHtmlSupport, Heading, Highlight, HorizontalLine,
            HtmlEmbed, ImageBlock, ImageCaption, ImageInline,
            ImageInsert, ImageInsertViaUrl, ImageResize, ImageStyle,
            ImageTextAlternative, ImageToolbar, ImageUpload, Indent, IndentBlock,
            Italic, Link, LinkImage, List, ListProperties, MediaEmbed, Mention,
            Paragraph, PasteFromOffice, RemoveFormat, SourceEditing, SpecialCharacters,
            SpecialCharactersArrows, SpecialCharactersCurrency,
            SpecialCharactersEssentials, SpecialCharactersLatin,
            SpecialCharactersMathematical, SpecialCharactersText, Strikethrough,
            Subscript, Superscript, Table, TableCaption, TableCellProperties,
            TableColumnResize, TableProperties, TableToolbar,
            TextTransformation, TodoList, Underline, WordCount,
            customImageUploadPlugin, fileUploadPlugin
        ],
        fontFamily: { supportAllValues: true },
        fontSize: {
            options: [10, 12, 14, 'default', 18, 20, 22],
            supportAllValues: true
        },
        heading: {
            options: [
                { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
                { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
                { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
            ]
        },
        htmlSupport: {
            allow: [{ name: /^.*$/, styles: true, attributes: true, classes: true }]
        },
        image: {
            toolbar: [
                'toggleImageCaption', 'imageTextAlternative', '|',
                'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|',
                'resizeImage'
            ]
        },
        initialData: defaultData,
        language: 'ko',
        licenseKey: 'GPL',
        link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
            decorators: {
                toggleDownloadable: {
                    mode: 'manual',
                    label: 'Downloadable',
                    attributes: { download: 'file' }
                }
            }
        },
        list: { properties: { styles: true, startIndex: true, reversed: true } },
        mention: { feeds: [{ marker: '@', feed: [] }] },
        codeBlock: {
            languages: [
                { language: 'plaintext', label: 'Plain text' },
                { language: 'javascript', label: 'JavaScript' },
                { language: 'typescript', label: 'TypeScript' },
                { language: 'python', label: 'Python' },
                { language: 'java', label: 'Java' },
                { language: 'css', label: 'CSS' },
                { language: 'html', label: 'HTML' },
                { language: 'sql', label: 'SQL' },
                { language: 'shell', label: 'Shell' },
                { language: 'json', label: 'JSON' },
                { language: 'xml', label: 'XML' },
                { language: 'yaml', label: 'YAML' }
            ]
        },
        placeholder: '내용을 입력하세요...',
        table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
        },
        translations: [translations]
    }
}

export default function CKEditorWrapper({ postId, defaultData, onChangeData, insertData, getDataTrigger, imageUploadAdapter, uploadServer }) {
    const initialData = defaultData ?? ''
    const prevDefaultDataRef = useRef(initialData)
    const prevPostIdRef = useRef(postId)
    const lastGetDataTriggerRef = useRef('')
    const onChangeDataRef = useRef(onChangeData)
    const [editorInstance, setEditorInstance] = useState(null)
    const [initError, setInitError] = useState(null)
    const [editorConfig] = useState(() =>
        createEditorConfig({
            defaultData: initialData,
            imageUploadAdapter,
            uploadServer
        })
    )

    useEffect(() => {
        if (insertData !== '' && editorInstance) {
            const viewFragment = editorInstance.data.processor.toView(insertData)
            const modelFragment = editorInstance.data.toModel(viewFragment)
            editorInstance.model.insertContent(
                modelFragment,
                editorInstance.model.document.selection
            )
        }
    }, [insertData, editorInstance])

    useEffect(() => {
        onChangeDataRef.current = onChangeData
    }, [onChangeData])

    useEffect(() => {
        if (getDataTrigger === '' || !editorInstance) {
            return
        }

        if (lastGetDataTriggerRef.current === getDataTrigger) {
            return
        }

        lastGetDataTriggerRef.current = getDataTrigger
        onChangeDataRef.current(editorInstance.getData(), {
            shouldSave: true,
            trigger: getDataTrigger,
        })
    }, [getDataTrigger, editorInstance])

    useEffect(() => {
        if (!editorInstance) {
            return
        }

        const nextData = defaultData ?? ''
        const postIdChanged = prevPostIdRef.current !== postId
        const dataChanged = prevDefaultDataRef.current !== nextData

        if (postIdChanged || dataChanged) {
            editorInstance.setData(nextData)
            prevDefaultDataRef.current = nextData
            prevPostIdRef.current = postId
        }
    }, [defaultData, editorInstance, postId])

    if (initError) {
        return <EditorInitError message={initError} />
    }

    return (
        <div className="editor-container">
            <CKEditor
                onReady={(editor) => {
                    const nextData = defaultData ?? ''
                    setInitError(null)
                    setEditorInstance(editor)
                    if (nextData !== editor.getData()) {
                        editor.setData(nextData)
                    }
                    prevDefaultDataRef.current = nextData
                    prevPostIdRef.current = postId
                }}
                onError={(error, details) => {
                    console.error('CKEditor error:', details?.phase, error)
                    if (details?.phase === 'initialization') {
                        setInitError('지원되지 않는 CKEditor 설정 충돌이 발생했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.')
                    }
                }}
                onAfterDestroy={() => {
                    setEditorInstance(null)
                }}
                editor={ClassicEditor}
                config={editorConfig}
            />
        </div>
    )
}
