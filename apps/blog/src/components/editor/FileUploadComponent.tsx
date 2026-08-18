import {Button} from "@/components/ui/button"
import {useRef} from "react"

interface FileUploadComponentProps {
    multiple?: boolean
    onChange: (files: FileList | File) => void
    className?: string
}

export default function FileUploadComponent({multiple, onChange, className}: FileUploadComponentProps) {

    const fileInput = useRef<HTMLInputElement>(null)

    return (
        <div>
            <Button
                className={`w-full${className ? ' ' + className : ''}`}
                variant="outline"
                size="lg"
                onClick={() => fileInput.current?.click()}
            >
                upload file
            </Button>

            <input
                ref={fileInput}
                type="file"
                multiple={multiple}
                style={{display: 'none'}}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(multiple ? e.target.files! : e.target.files![0])}
            />
        </div>
    )
}
