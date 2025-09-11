/**
 * @license Copyright (c) 2014-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic'
import { Alignment } from '@ckeditor/ckeditor5-alignment'
import { AutoImage } from '@ckeditor/ckeditor5-image'
import { AutoLink } from '@ckeditor/ckeditor5-link'
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote'
import { Bold } from '@ckeditor/ckeditor5-basic-styles'
import { CodeBlock } from '@ckeditor/ckeditor5-code-block'
import { Essentials } from '@ckeditor/ckeditor5-essentials'
import { FindAndReplace } from '@ckeditor/ckeditor5-find-and-replace'
import { FontBackgroundColor } from '@ckeditor/ckeditor5-font'
import { FontColor } from '@ckeditor/ckeditor5-font'
import { FontFamily } from '@ckeditor/ckeditor5-font'
import { FontSize } from '@ckeditor/ckeditor5-font'
import { GeneralHtmlSupport } from '@ckeditor/ckeditor5-html-support'
import { Heading } from '@ckeditor/ckeditor5-heading'
import { Highlight } from '@ckeditor/ckeditor5-highlight'
import { HorizontalLine } from '@ckeditor/ckeditor5-horizontal-line'
import { Image } from '@ckeditor/ckeditor5-image'
import { ImageCaption } from '@ckeditor/ckeditor5-image'
import { ImageStyle } from '@ckeditor/ckeditor5-image'
import { ImageToolbar } from '@ckeditor/ckeditor5-image'
import { ImageUpload } from '@ckeditor/ckeditor5-image'
import { Indent } from '@ckeditor/ckeditor5-indent'
import { IndentBlock } from '@ckeditor/ckeditor5-indent'
import { Italic } from '@ckeditor/ckeditor5-basic-styles'
import { Link } from '@ckeditor/ckeditor5-link'
import { List } from '@ckeditor/ckeditor5-list'
import { MediaEmbed } from '@ckeditor/ckeditor5-media-embed'
import { MediaEmbedToolbar } from '@ckeditor/ckeditor5-media-embed'
import { Paragraph } from '@ckeditor/ckeditor5-paragraph'
import { PasteFromOffice } from '@ckeditor/ckeditor5-paste-from-office'
import { RemoveFormat } from '@ckeditor/ckeditor5-remove-format'
import { SimpleUploadAdapter } from '@ckeditor/ckeditor5-upload'
import { SourceEditing } from '@ckeditor/ckeditor5-source-editing'
import { SpecialCharacters } from '@ckeditor/ckeditor5-special-characters'
import { SpecialCharactersArrows } from '@ckeditor/ckeditor5-special-characters'
import { SpecialCharactersEssentials } from '@ckeditor/ckeditor5-special-characters'
import { Strikethrough } from '@ckeditor/ckeditor5-basic-styles'
import { Underline } from '@ckeditor/ckeditor5-basic-styles'

class Editor extends ClassicEditor {
}

// Plugins to include in the build.
Editor.builtinPlugins = [
    Alignment,
    AutoImage,
    AutoLink,
    BlockQuote,
    Bold,
    CodeBlock,
    Essentials,
    FindAndReplace,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    GeneralHtmlSupport,
    Heading,
    Highlight,
    HorizontalLine,
    Image,
    ImageCaption,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    Indent,
    IndentBlock,
    Italic,
    Link,
    List,
    MediaEmbed,
    MediaEmbedToolbar,
    Paragraph,
    PasteFromOffice,
    RemoveFormat,
    SimpleUploadAdapter,
    SourceEditing,
    SpecialCharacters,
    SpecialCharactersArrows,
    SpecialCharactersEssentials,
    Strikethrough,
    Underline,
]

// Editor configuration.
Editor.defaultConfig = {
    // CKEditor5 v46+ GPL 라이선스 설정
    licenseKey: 'GPL',
    
    toolbar: {
        items: [
            'fontFamily',
            '|',
            'heading',
            '|',
            'alignment',
            'fontBackgroundColor',
            'fontColor',
            'fontSize',
            'highlight',
            '|',
            'bold',
            'italic',
            'strikethrough',
            'underline',
            '|',
            'undo',
            'redo',
            '-',
            'link',
            'bulletedList',
            'numberedList',
            'horizontalLine',
            '|',
            'outdent',
            'indent',
            '|',
            'imageUpload',
            'blockQuote',
            'insertTable',
            'mediaEmbed',
            'codeBlock',
            'htmlEmbed',
            '-',
            'removeFormat',
            '|',
            'findAndReplace',
            'specialCharacters',
            '|',
            'sourceEditing'
        ],
        shouldNotGroupWhenFull: true
    },
    language: 'ko',
    image: {
        toolbar: [
            'imageTextAlternative',
            'imageStyle:inline',
            'imageStyle:block',
            'imageStyle:side'
        ]
    },
    table: {
        contentToolbar: [
            'tableColumn',
            'tableRow',
            'mergeTableCells',
            'tableCellProperties',
            'tableProperties'
        ]
    },
    htmlSupport: {
        // https://ckeditor.com/docs/ckeditor5/latest/features/general-html-support.html
        // 붙여넣기 같은 걸 할 때 모든 html tag 사용할 수 있도록 변경하는 부분, 일반사용자용 게시판에서는 사용하지 않는게 좋다.
        allow: [
            {
                name: /.*/,
                attributes: true,
                classes: true,
                styles: true
            }
        ],
    }
}

export default Editor
