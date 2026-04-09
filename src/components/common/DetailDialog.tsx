import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'

interface DetailDialogProps {
    open: boolean
    onClose: () => void
    title: string
    content: string
}

export default function DetailDialog({open, onClose, title, content}: DetailDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen: boolean) => { if (!isOpen) onClose() }}>
            <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-[1200px] flex flex-col">
                <DialogHeader className="pr-10">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="overflow-auto flex-1 rounded-xl border border-border bg-card/60">
                    <pre
                        className="m-0 whitespace-pre-wrap break-all rounded-xl bg-transparent p-4 font-mono text-sm text-foreground"
                        style={{fontFamily: 'D2Coding, monospace'}}
                    >
                        {content || '-'}
                    </pre>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>닫기</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
