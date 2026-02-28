import ConfirmDialog from './ConfirmDialog'
import {AlertTriangle} from 'lucide-react'

export default function PublicConfirm(props) {
    return <ConfirmDialog icon={AlertTriangle} title="공개/비공개 설정" confirmText="변경" {...props} />
}
