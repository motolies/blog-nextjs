import {useMemo} from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {Eye} from 'lucide-react'
import {sanitizeThemeHostileStyles} from '../../util/contentStyleSanitizer'

interface PostPreviewDialogProps {
    open: boolean
    subject: string
    body: string
    onClose: () => void
}

export default function PostPreviewDialog({open, subject, body, onClose}: PostPreviewDialogProps) {
    // 발행 페이지(PostComponent)와 동일하게 테마 적대적 인라인 스타일을 제거해 미리보기 일관성 유지
    const sanitizedBody = useMemo(() => {
        if (!body || typeof window === 'undefined') {
            return body
        }
        const doc = new DOMParser().parseFromString(body, 'text/html')
        sanitizeThemeHostileStyles(doc.body)
        return doc.body.innerHTML
    }, [body])

    return (
        <Dialog open={open} onOpenChange={(isOpen: boolean) => { if (!isOpen) onClose() }}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-5xl max-h-[calc(100vh-6rem)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye size={20} />
                        미리보기
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                    <div className="surface-panel-strong rounded-[1.5rem] px-6 py-8 sm:px-8">
                        {subject && (
                            <h1 className="text-2xl font-bold mb-6">{subject}</h1>
                        )}
                        <div
                            className="content break-words"
                            dangerouslySetInnerHTML={{__html: sanitizedBody}}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
