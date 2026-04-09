import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {Eye} from 'lucide-react'

interface PreviewDialogProps {
    open: boolean
    imageSrc: string
    onClose: () => void
}

export default function PreviewDialog({open, imageSrc, onClose}: PreviewDialogProps) {
    const close = (e: React.MouseEvent) => {
        e.stopPropagation()
        onClose()
    }
    return (
        <Dialog open={open} onOpenChange={(isOpen: boolean) => { if (!isOpen) onClose() }}>
            <DialogContent
                className="max-w-full max-h-full"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle
                        className="flex items-center flex-wrap gap-1 cursor-pointer"
                        onClick={close}
                    >
                        <Eye className="text-destructive" size={20}/>
                        Preview Image
                    </DialogTitle>
                </DialogHeader>
                <div
                    className="m-3 text-center cursor-pointer"
                    onClick={close}
                >
                    <img src={window.location.origin + imageSrc} alt="미리보기 이미지" style={{maxWidth: '90%'}}/>
                </div>
            </DialogContent>
        </Dialog>
    )
}
