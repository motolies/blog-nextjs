import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'

/**
 * 긴 텍스트를 팝업으로 표시하는 다이얼로그 컴포넌트
 *
 * @param {Object} props
 * @param {boolean} props.open - 다이얼로그 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {string} props.title - 다이얼로그 제목
 * @param {string} props.content - 표시할 내용
 */
export default function DetailDialog({open, onClose, title, content}) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
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
