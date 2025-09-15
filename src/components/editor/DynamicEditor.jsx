import { useEffect, useRef, useState, useMemo } from "react"
import { useDispatch } from "react-redux"
import { cancelLoading, setLoading } from "../../store/actions/commonActions"
import service from "../../service"
import { useSnackbar } from "notistack"
import { fileLink } from "../../util/fileLink"
import { FILE_LIST_BY_POST_REQUEST } from "../../store/types/fileTypes"

export default function DynamicEditor({postId, defaultData, onChangeData, insertData, getDataTrigger}) {
    const prevDefaultDataRef = useRef()
    const prevPostIdRef = useRef()
    const { enqueueSnackbar } = useSnackbar()
    const dispatch = useDispatch()
    const [isLayoutReady, setIsLayoutReady] = useState(false)
    const [editorInstance, setEditorInstance] = useState(null)
    const [CKEditor, setCKEditor] = useState(null)
    const [Editor, setEditor] = useState(null)
    const [editorLoaded, setEditorLoaded] = useState(false)

    useEffect(() => {
        // 클라이언트 사이드에서만 CKEditor 로드
        const loadEditor = async () => {
            try {
                // CKEditor React 컴포넌트 로드
                const ckEditorReact = await import('@ckeditor/ckeditor5-react')

                // CKEditor 모듈들 로드
                const ckEditorModules = await import('ckeditor5')
                const translations = await import('ckeditor5/translations/ko.js')

                // CSS 로드
                await import('ckeditor5/ckeditor5.css')

                setCKEditor(() => ckEditorReact.CKEditor)
                setEditor(() => ckEditorModules.ClassicEditor)
                setEditorLoaded(true)
                setIsLayoutReady(true)
            } catch (error) {
                console.error('CKEditor 로딩 실패:', error)
                enqueueSnackbar('에디터 로딩에 실패했습니다.', { variant: 'error' })
            }
        }

        if (typeof window !== 'undefined') {
        loadEditor()
        }

        return () => {
            setIsLayoutReady(false)
        }
    }, [])

    useEffect(() => {
        if (isLayoutReady && insertData !== '' && editorInstance) {
            insertDataOnCursor(editorInstance, insertData)
        }
    }, [insertData, isLayoutReady, editorInstance])

    useEffect(() => {
        if (isLayoutReady && getDataTrigger !== '' && editorInstance) {
            onChangeData(editorInstance.getData())
        }
    }, [getDataTrigger, isLayoutReady, editorInstance])

    useEffect(() => {
        if (editorInstance && defaultData) {
            // postId가 변경되었거나 defaultData가 변경되었을 때 무조건 설정
            const postIdChanged = prevPostIdRef.current !== postId
            const dataChanged = prevDefaultDataRef.current !== defaultData
            
            if (postIdChanged || dataChanged) {
                editorInstance.setData(defaultData)
                prevDefaultDataRef.current = defaultData
                prevPostIdRef.current = postId
            }
        }
    }, [defaultData, editorInstance, postId])

    const refreshFileList = () => {
        dispatch({
            type: FILE_LIST_BY_POST_REQUEST,
            postId: postId
        })
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
                        await service.file.upload({ formData: body })
                            .then(res => {
                                resolve({ default: res.data.resourceUri })
                            })
                            .catch(err => {
                                enqueueSnackbar("파일 업로드에 실패하였습니다.", { variant: "error" })
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

    const uploadServer = async (editor, file) => {
        if (!file) {
            return
        }

        const body = new FormData()
        body.append("file", file)
        body.append("postId", postId)
        dispatch(setLoading())
        await service.file.upload({ formData: body })
            .then(res => {
                const fileTag = fileLink(res.data.resourceUri, res.data.originName)
                insertDataOnCursor(editor, fileTag)
            })
            .catch(err => {
                enqueueSnackbar("파일 업로드에 실패하였습니다.", { variant: "error" })
            })
            .finally(() => {
                dispatch(cancelLoading())
            })
        refreshFileList()
    }

    const insertDataOnCursor = (editor, data) => {
        const viewFragment = editor.data.processor.toView(data)
        const modelFragment = editor.data.toModel(viewFragment)
        editor.model.insertContent(
            modelFragment,
            editor.model.document.selection
        )
    }

    const createEditorConfig = async () => {
        const ckEditorModules = await import('ckeditor5')
        const translations = await import('ckeditor5/translations/ko.js')

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
                    'undo',
                    'redo',
                    '|',
                    'sourceEditing',
                    '|',
                    'heading',
                    '|',
                    'fontSize',
                    'fontFamily',
                    'fontColor',
                    'fontBackgroundColor',
                    '|',
                    'bold',
                    'italic',
                    'underline',
                    'strikethrough',
                    'subscript',
                    'superscript',
                    'code',
                    'removeFormat',
                    '-',
                    'emoji',
                    'specialCharacters',
                    'link',
                    'insertImage',
                    'mediaEmbed',
                    'insertTable',
                    'insertTableLayout',
                    'highlight',
                    'blockQuote',
                    'htmlEmbed',
                    '|',
                    'bulletedList',
                    'numberedList',
                    'todoList',
                    'outdent',
                    'indent'
                ],
                shouldNotGroupWhenFull: true
            },
            plugins: [
                ckEditorModules.Autoformat,
                ckEditorModules.AutoImage,
                ckEditorModules.Autosave,
                ckEditorModules.BlockQuote,
                ckEditorModules.Bold,
                ckEditorModules.Code,
                ckEditorModules.Emoji,
                ckEditorModules.Essentials,
                ckEditorModules.FontBackgroundColor,
                ckEditorModules.FontColor,
                ckEditorModules.FontFamily,
                ckEditorModules.FontSize,
                ckEditorModules.FullPage,
                ckEditorModules.GeneralHtmlSupport,
                ckEditorModules.Heading,
                ckEditorModules.Highlight,
                ckEditorModules.HtmlComment,
                ckEditorModules.HtmlEmbed,
                ckEditorModules.ImageBlock,
                ckEditorModules.ImageCaption,
                ckEditorModules.ImageInline,
                ckEditorModules.ImageInsert,
                ckEditorModules.ImageInsertViaUrl,
                ckEditorModules.ImageResize,
                ckEditorModules.ImageStyle,
                ckEditorModules.ImageTextAlternative,
                ckEditorModules.ImageToolbar,
                ckEditorModules.ImageUpload,
                ckEditorModules.Indent,
                ckEditorModules.IndentBlock,
                ckEditorModules.Italic,
                ckEditorModules.Link,
                ckEditorModules.LinkImage,
                ckEditorModules.List,
                ckEditorModules.ListProperties,
                ckEditorModules.MediaEmbed,
                ckEditorModules.Mention,
                ckEditorModules.Paragraph,
                ckEditorModules.PasteFromOffice,
                ckEditorModules.PlainTableOutput,
                ckEditorModules.RemoveFormat,
                ckEditorModules.SimpleUploadAdapter,
                ckEditorModules.SourceEditing,
                ckEditorModules.SpecialCharacters,
                ckEditorModules.SpecialCharactersArrows,
                ckEditorModules.SpecialCharactersCurrency,
                ckEditorModules.SpecialCharactersEssentials,
                ckEditorModules.SpecialCharactersLatin,
                ckEditorModules.SpecialCharactersMathematical,
                ckEditorModules.SpecialCharactersText,
                ckEditorModules.Strikethrough,
                ckEditorModules.Subscript,
                ckEditorModules.Superscript,
                ckEditorModules.Table,
                ckEditorModules.TableCaption,
                ckEditorModules.TableCellProperties,
                ckEditorModules.TableColumnResize,
                ckEditorModules.TableLayout,
                ckEditorModules.TableProperties,
                ckEditorModules.TableToolbar,
                ckEditorModules.TextTransformation,
                ckEditorModules.TodoList,
                ckEditorModules.Underline,
                ckEditorModules.WordCount,
                customImageUploadPlugin,
                fileUploadPlugin
            ],
            fontFamily: {
                supportAllValues: true
            },
            fontSize: {
                options: [10, 12, 14, 'default', 18, 20, 22],
                supportAllValues: true
            },
            heading: {
                options: [
                    {
                        model: 'paragraph',
                        title: 'Paragraph',
                        class: 'ck-heading_paragraph'
                    },
                    {
                        model: 'heading1',
                        view: 'h1',
                        title: 'Heading 1',
                        class: 'ck-heading_heading1'
                    },
                    {
                        model: 'heading2',
                        view: 'h2',
                        title: 'Heading 2',
                        class: 'ck-heading_heading2'
                    },
                    {
                        model: 'heading3',
                        view: 'h3',
                        title: 'Heading 3',
                        class: 'ck-heading_heading3'
                    },
                    {
                        model: 'heading4',
                        view: 'h4',
                        title: 'Heading 4',
                        class: 'ck-heading_heading4'
                    },
                    {
                        model: 'heading5',
                        view: 'h5',
                        title: 'Heading 5',
                        class: 'ck-heading_heading5'
                    },
                    {
                        model: 'heading6',
                        view: 'h6',
                        title: 'Heading 6',
                        class: 'ck-heading_heading6'
                    }
                ]
            },
            htmlSupport: {
                allow: [
                    {
                        name: /^.*$/,
                        styles: true,
                        attributes: true,
                        classes: true
                    }
                ]
            },
            image: {
                toolbar: [
                    'toggleImageCaption',
                    'imageTextAlternative',
                    '|',
                    'imageStyle:inline',
                    'imageStyle:wrapText',
                    'imageStyle:breakText',
                    '|',
                    'resizeImage'
                ]
            },
            initialData: defaultData || '',
            language: 'ko',
            licenseKey: 'GPL',
            link: {
                addTargetToExternalLinks: true,
                defaultProtocol: 'https://',
                decorators: {
                    toggleDownloadable: {
                        mode: 'manual',
                        label: 'Downloadable',
                        attributes: {
                            download: 'file'
                        }
                    }
                }
            },
            list: {
                properties: {
                    styles: true,
                    startIndex: true,
                    reversed: true
                }
            },
            mention: {
                feeds: [
                    {
                        marker: '@',
                        feed: []
                    }
                ]
            },
            placeholder: '내용을 입력하세요...',
            table: {
                contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
            },
            translations: [translations.default]
        }
    }

    const [editorConfig, setEditorConfig] = useState(null)

    useEffect(() => {
        if (isLayoutReady) {
            createEditorConfig().then(config => {
                setEditorConfig(config)
            })
        }
    }, [isLayoutReady, defaultData])

    // 서버 사이드에서는 로딩 메시지만 렌더링
    if (typeof window === 'undefined') {
        return <h3>Editor loading...</h3>
    }

    return (
        <div className="editor-container">
            {CKEditor && Editor && isLayoutReady && editorConfig ? (
                <CKEditor
                    onReady={async (editor) => {
                        console.log('CKEditor5 성공적으로 로드됨')
                        setEditorInstance(editor)
                        if (defaultData) {
                            editor.setData(defaultData)
                            prevDefaultDataRef.current = defaultData
                            prevPostIdRef.current = postId
                        }
                    }}
                    onAfterDestroy={() => {
                        setEditorInstance(null)
                    }}
                    editor={Editor}
                    config={editorConfig}
                />
            ) : (
            <h3>Editor loading...</h3>
            )}
        </div>
        )
}