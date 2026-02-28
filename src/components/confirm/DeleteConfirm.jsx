import ConfirmDialog from './ConfirmDialog'
import {CircleAlert} from 'lucide-react'

export default function DeleteConfirm(props) {
    return <ConfirmDialog icon={CircleAlert} title="삭제" confirmText="삭제" {...props} />
}
