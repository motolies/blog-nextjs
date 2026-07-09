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
import { MarkdownGfmDataProcessor } from '@ckeditor/ckeditor5-markdown-gfm'
import translations from 'ckeditor5/translations/ko.js'
import 'ckeditor5/ckeditor5.css'
import { sanitizeThemeHostileStyles } from '@/util/contentStyleSanitizer'

interface EditorInitErrorProps {
    message: string
}

function EditorInitError({ message }: EditorInitErrorProps) {
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

interface CreateEditorConfigParams {
    defaultData: string
    imageUploadAdapter: (loader: unknown) => unknown
    uploadServer: (editor: unknown, file: File) => Promise<void>
    onChangeDataRef: React.MutableRefObject<(data: string, options?: {shouldSave?: boolean; trigger?: string}) => void>
}

function createEditorConfig({ defaultData, imageUploadAdapter, uploadServer, onChangeDataRef }: CreateEditorConfigParams) {
    const customImageUploadPlugin = function (editor: any) {
        editor.plugins.get('FileRepository').createUploadAdapter = (loader: unknown) => {
            return imageUploadAdapter(loader)
        }
    }

    // 클립보드에 text/plain만 있는 붙여넣기(마크다운 원문 복사 등)를 GFM으로 해석해 리치 콘텐츠로 변환하는 플러그인.
    // PasteFromMarkdownExperimental은 span 래핑 HTML까지 마크다운으로 재해석해 에디터 내부 복사 서식(fontColor 등)을
    // 유실시키는 부작용이 있어, 공개 API(MarkdownGfmDataProcessor)로 text/plain 전용 변환만 직접 구현한다.
    const markdownPastePlugin = function (editor: any) {
        const gfmProcessor = new MarkdownGfmDataProcessor(editor.data.viewDocument)
        let shiftPressed = false
        editor.editing.view.document.on('keydown', (_evt: unknown, data: any) => {
            shiftPressed = data.shiftKey
        })
        editor.plugins.get('ClipboardPipeline').on(
            'inputTransformation',
            (_evt: unknown, data: any) => {
                // Shift 붙여넣기(서식 없이 붙여넣기 의도)·에디터 내부 복사·HTML 클립보드는 변환하지 않는다
                if (shiftPressed || data.sourceEditorId || data.dataTransfer.getData('text/html')) {
                    return
                }
                const plainText = data.dataTransfer.getData('text/plain')
                if (plainText) {
                    data.content = gfmProcessor.toView(plainText)
                }
            }
        )
    }

    // 외부(MD 뷰어, 웹페이지 등)에서 복사한 콘텐츠의 테마 적대적 인라인 스타일을 붙여넣기 시점에 제거하는 플러그인.
    // - PasteFromOffice(high)와 파이프라인 최종 변환(low) 사이의 기본 우선순위에서 실행.
    // - 에디터 내부 복사(sourceEditorId 존재)는 툴바로 설정한 의도된 서식이므로 정화하지 않는다.
    const pasteSanitizerPlugin = function (editor: any) {
        editor.plugins.get('ClipboardPipeline').on(
            'inputTransformation',
            (_evt: unknown, data: any) => {
                if (data.sourceEditorId || data.content.isEmpty) {
                    return
                }
                const processor = editor.data.htmlProcessor
                const doc = new DOMParser().parseFromString(processor.toData(data.content), 'text/html')
                sanitizeThemeHostileStyles(doc.body)
                data.content = processor.toView(doc.body.innerHTML)
            }
        )
    }

    const fileUploadPlugin = function (editor: any) {
        editor.editing.view.document.on(
            'drop',
            async (event: any, data: any) => {
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
            (event: any, data: any) => {
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
            customImageUploadPlugin, fileUploadPlugin, markdownPastePlugin, pasteSanitizerPlugin
        ],
        fontFamily: { supportAllValues: true },
        fontSize: {
            options: [10, 12, 14, 'default', 18, 20, 22],
            supportAllValues: true
        },
        heading: {
            options: [
                { model: 'paragraph' as const, title: 'Paragraph', class: 'ck-heading_paragraph' },
                { model: 'heading1' as const, view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                { model: 'heading2' as const, view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                { model: 'heading3' as const, view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                { model: 'heading4' as const, view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
                { model: 'heading5' as const, view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
                { model: 'heading6' as const, view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
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
        // v48부터 initialData/placeholder는 config.root 하위로 이동 (최상위 형식은 deprecated)
        root: {
            initialData: defaultData,
            placeholder: '내용을 입력하세요...'
        },
        language: 'ko',
        licenseKey: 'GPL' as const,
        link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
            decorators: {
                toggleDownloadable: {
                    mode: 'manual' as const,
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
        autosave: {
            save(editor: any) {
                onChangeDataRef.current(editor.getData(), {shouldSave: true, trigger: 'autosave'})
            },
            waitingTime: 30000
        },
        table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
        },
        translations: [translations]
    }
}

interface CKEditorWrapperProps {
    postId: string | null
    defaultData: string
    onChangeData: (data: string, options?: {shouldSave?: boolean; trigger?: string}) => void
    insertData: string
    getDataTrigger: string
    getDataPreviewTrigger?: string
    onSaveShortcut?: () => void
    imageUploadAdapter: (loader: unknown) => unknown
    uploadServer: (editor: unknown, file: File) => Promise<void>
}

export default function CKEditorWrapper({ postId, defaultData, onChangeData, insertData, getDataTrigger, getDataPreviewTrigger, onSaveShortcut, imageUploadAdapter, uploadServer }: CKEditorWrapperProps) {
    const initialData = defaultData ?? ''
    const prevDefaultDataRef = useRef<string>(initialData)
    const prevPostIdRef = useRef<string | null>(postId)
    const lastGetDataTriggerRef = useRef<string>('')
    const lastGetDataPreviewTriggerRef = useRef<string>('')
    const onChangeDataRef = useRef(onChangeData)
    const [editorInstance, setEditorInstance] = useState<any>(null)
    const [initError, setInitError] = useState<string | null>(null)
    const onSaveShortcutRef = useRef(onSaveShortcut)
    const [editorConfig] = useState(() =>
        createEditorConfig({
            defaultData: initialData,
            imageUploadAdapter,
            uploadServer,
            onChangeDataRef
        })
    )

    useEffect(() => {
        onSaveShortcutRef.current = onSaveShortcut
    }, [onSaveShortcut])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                onSaveShortcutRef.current?.()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

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
        if (!getDataPreviewTrigger || !editorInstance) {
            return
        }

        if (lastGetDataPreviewTriggerRef.current === getDataPreviewTrigger) {
            return
        }

        lastGetDataPreviewTriggerRef.current = getDataPreviewTrigger
        onChangeDataRef.current(editorInstance.getData(), {
            shouldSave: false,
            trigger: 'preview',
        })
    }, [getDataPreviewTrigger, editorInstance])

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
                onReady={(editor: any) => {
                    const nextData = defaultData ?? ''
                    setInitError(null)
                    setEditorInstance(editor)
                    if (nextData !== editor.getData()) {
                        editor.setData(nextData)
                    }
                    prevDefaultDataRef.current = nextData
                    prevPostIdRef.current = postId

                    editor.keystrokes.set('Ctrl+S', (_keyEvtData: unknown, cancel: () => void) => {
                        cancel()
                        onSaveShortcut?.()
                    })
                }}
                onError={(error: Error, details?: {phase?: string}) => {
                    console.error('CKEditor error:', details?.phase, error)
                    if (details?.phase === 'initialization') {
                        setInitError('지원되지 않는 CKEditor 설정 충돌이 발생했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.')
                    }
                }}
                onAfterDestroy={() => {
                    setEditorInstance(null)
                }}
                editor={ClassicEditor}
                config={editorConfig as any}
            />
        </div>
    )
}
