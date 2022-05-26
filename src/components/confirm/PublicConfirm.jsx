import * as React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import DangerousIcon from '@mui/icons-material/Dangerous'
import WarningIcon from '@mui/icons-material/Warning';

export default function PublicConfirm({open, question, onConfirm, onCancel}) {

    const onDelete = (e) => {
        e.stopPropagation()
        onConfirm()
    }

    const onDialogCancel = (e) => {
        e.stopPropagation()
        onCancel()
    }

    return (
        <div>
            <Dialog
                open={open}
                onClose={(e) => {
                    // 배경 클릭시에 이전 element가 click 되는 현상 방지
                    e.stopPropagation()
                }}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}>
                        <WarningIcon sx={{verticalAlign: 'middle', mr:1}} color={'error'}/>
                        공개/비공개 설정
                    </div>

                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {question}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onDelete}>변경</Button>
                    <Button onClick={onDialogCancel} autoFocus>취소</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}