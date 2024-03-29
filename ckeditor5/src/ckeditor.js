/**
 * @license Copyright (c) 2014-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor.js'
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment.js'
import AutoImage from '@ckeditor/ckeditor5-image/src/autoimage.js'
import AutoLink from '@ckeditor/ckeditor5-link/src/autolink.js'
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote.js'
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold.js'
import CodeBlock from '@ckeditor/ckeditor5-code-block/src/codeblock.js'
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials.js'
import FindAndReplace from '@ckeditor/ckeditor5-find-and-replace/src/findandreplace.js'
import FontBackgroundColor from '@ckeditor/ckeditor5-font/src/fontbackgroundcolor.js'
import FontColor from '@ckeditor/ckeditor5-font/src/fontcolor.js'
import FontFamily from '@ckeditor/ckeditor5-font/src/fontfamily.js'
import FontSize from '@ckeditor/ckeditor5-font/src/fontsize.js'
import GeneralHtmlSupport from '@ckeditor/ckeditor5-html-support/src/generalhtmlsupport.js'
import Heading from '@ckeditor/ckeditor5-heading/src/heading.js'
import Highlight from '@ckeditor/ckeditor5-highlight/src/highlight.js'
import HorizontalLine from '@ckeditor/ckeditor5-horizontal-line/src/horizontalline.js'
import Image from '@ckeditor/ckeditor5-image/src/image.js'
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption.js'
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle.js'
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar.js'
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload.js'
import Indent from '@ckeditor/ckeditor5-indent/src/indent.js'
import IndentBlock from '@ckeditor/ckeditor5-indent/src/indentblock.js'
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic.js'
import Link from '@ckeditor/ckeditor5-link/src/link.js'
import List from '@ckeditor/ckeditor5-list/src/list.js'
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed.js'
import MediaEmbedToolbar from '@ckeditor/ckeditor5-media-embed/src/mediaembedtoolbar.js'
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph.js'
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice.js'
import RemoveFormat from '@ckeditor/ckeditor5-remove-format/src/removeformat.js'
import SimpleUploadAdapter from '@ckeditor/ckeditor5-upload/src/adapters/simpleuploadadapter.js'
import SourceEditing from '@ckeditor/ckeditor5-source-editing/src/sourceediting.js'
import SpecialCharacters from '@ckeditor/ckeditor5-special-characters/src/specialcharacters.js'
import SpecialCharactersArrows from '@ckeditor/ckeditor5-special-characters/src/specialcharactersarrows.js'
import SpecialCharactersEssentials from '@ckeditor/ckeditor5-special-characters/src/specialcharactersessentials.js'
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough.js'
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline.js'

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
