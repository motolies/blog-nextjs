// https://velog.io/@sssssssssy/d-19tzdgsn
import Script from "next/script"

export default function DynamicEditor({postId, defaultData, onChangeData, insertData}) {


    return (
        <>
            <div className="editor" dangerouslySetInnerHTML={{__html: defaultData}}>

            </div>
            <Script id={'editor'} strategy={"beforeInteractive"} src={'/js/ckeditor.js'}/>
            <Script id={'editor.exec'} strategy={"lazyOnload"} src={'/js/ckeditor.exec.js'}/>
        </>
    )
}