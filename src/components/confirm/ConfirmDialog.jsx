import * as React from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ConfirmDialog({open, icon: Icon, iconClassName = 'text-destructive', title, question, confirmText = '확인', onConfirm, onCancel}) {

    const handleConfirm = (e) => {
        e.stopPropagation()
        onConfirm()
    }

    const handleCancel = (e) => {
        e.stopPropagation()
        onCancel()
    }

    return (
        <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel() }}>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <div className="flex items-center flex-wrap gap-1">
                            {Icon && <Icon className={iconClassName} size={20}/>}
                            {title}
                        </div>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {question}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={handleConfirm}>{confirmText}</AlertDialogAction>
                    <AlertDialogCancel onClick={handleCancel}>취소</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
