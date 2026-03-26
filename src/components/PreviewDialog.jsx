import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {Eye} from 'lucide-react'

export default function PreviewDialog({open, imageSrc, onClose}) {
    const close = (e) => {
        e.stopPropagation()
        onClose()
    }
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
            <DialogContent
                className="max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
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

