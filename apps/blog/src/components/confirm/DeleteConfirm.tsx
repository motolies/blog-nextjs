import { CircleAlert } from 'lucide-react';
import type { ConfirmDialogProps } from './ConfirmDialog';
import ConfirmDialog from './ConfirmDialog';

type DeleteConfirmProps = Omit<ConfirmDialogProps, 'icon' | 'title' | 'confirmText'> & {
  icon?: ConfirmDialogProps['icon'];
  title?: string;
  confirmText?: string;
};

export default function DeleteConfirm(props: DeleteConfirmProps) {
  return <ConfirmDialog icon={CircleAlert} title="삭제" confirmText="삭제" {...props} />;
}
