import {Button} from "@/components/ui/button"
import {useRef} from "react"

export default function FileUploadComponent({multiple, onChange, className}) {

    const fileInput = useRef()

    return (
        <div>
            <Button
                className={`w-full${className ? ' ' + className : ''}`}
                variant="outline"
                size="lg"
                onClick={() => fileInput.current.click()}
            >
                upload file
            </Button>

            <input
                ref={fileInput}
                type="file"
                multiple={multiple}
                style={{display: 'none'}}
                onChange={(e) => onChange(multiple ? e.target.files : e.target.files[0])}
            />
        </div>
    )
}