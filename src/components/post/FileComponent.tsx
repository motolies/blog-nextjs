import {useState} from "react"
import {Trash2, Eye} from "lucide-react"
import {Button} from "../ui/button"
import DeleteConfirm from "../confirm/DeleteConfirm"
import PreviewDialog from "../PreviewDialog"

interface FileComponentProps {
    file: {
        id: string
        originName: string
        type: string
        resourceUri: string
    }
    onDeleteFile: (file: FileComponentProps['file']) => Promise<void> | void
    onInsertFile: (file: FileComponentProps['file']) => void
}

export const FileComponent = (props: FileComponentProps) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
    const [showPreview, setShowPreview] = useState<boolean>(false)
    const [question, setQuestion] = useState<string>('')

    const showDeleteConfirmDialog = (e: React.MouseEvent) => {
        e.stopPropagation()
        setQuestion(`${props.file.originName} 파일을 삭제하시겠습니까?`)
        setShowDeleteConfirm(true)
    }

    const deleteFile = async () => {
        await props.onDeleteFile(props.file)
        setShowDeleteConfirm(false)
    }
    const deleteFileCancel = () => {
        setShowDeleteConfirm(false)
    }

    const insertFileLink = () => {
        props.onInsertFile(props.file)
    }

    const isImage = props.file.type.startsWith('image')

    return (
        <div
            className={`flex items-center mb-1 px-2 rounded cursor-pointer transition-colors ${isImage ? 'bg-yellow-100 hover:bg-yellow-300' : 'bg-teal-100 hover:bg-teal-300'}`}
            onClick={insertFileLink}
        >
            <span className="flex-1 truncate text-sm">{props.file.originName}</span>
            {isImage &&
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-auto"
                    aria-label="preview"
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        setShowPreview(true)
                    }}
                >
                    <Eye className="h-4 w-4"/>
                </Button>
            }
            <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${isImage ? '' : 'ml-auto'}`}
                aria-label="delete"
                onClick={showDeleteConfirmDialog}
            >
                <Trash2 className="h-4 w-4"/>
            </Button>
            <DeleteConfirm open={showDeleteConfirm} question={question} onConfirm={deleteFile} onCancel={deleteFileCancel}/>
            <PreviewDialog open={showPreview} imageSrc={props.file.resourceUri} onClose={() => setShowPreview(false)}/>
        </div>
    )

}
