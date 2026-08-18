import ConfirmDialog from './ConfirmDialog'
import type {ConfirmDialogProps} from './ConfirmDialog'
import {AlertTriangle} from 'lucide-react'

type PublicConfirmProps = Omit<ConfirmDialogProps, 'icon' | 'title' | 'confirmText'> & {
    icon?: ConfirmDialogProps['icon']
    title?: string
    confirmText?: string
}

export default function PublicConfirm(props: PublicConfirmProps) {
    return <ConfirmDialog icon={AlertTriangle} title="공개/비공개 설정" confirmText="변경" {...props} />
}
