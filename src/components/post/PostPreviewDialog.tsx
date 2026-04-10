import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {Eye} from 'lucide-react'

interface PostPreviewDialogProps {
    open: boolean
    subject: string
    body: string
    onClose: () => void
}

export default function PostPreviewDialog({open, subject, body, onClose}: PostPreviewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen: boolean) => { if (!isOpen) onClose() }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye size={20} />
                        미리보기
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                    {subject && (
                        <h1 className="text-2xl font-bold mb-6">{subject}</h1>
                    )}
                    <div
                        className="content"
                        dangerouslySetInnerHTML={{__html: body}}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
