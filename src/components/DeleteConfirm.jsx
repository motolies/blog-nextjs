import * as React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import DangerousIcon from '@mui/icons-material/Dangerous'

export default function DeleteConfirm({open, question, onConfirm, onCancel}) {

    const onDelete = () => {
        onConfirm()
    }

    const onDialogCancel = () => {
        onCancel()
    }

    return (
        <div>
            <Dialog
                open={open}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}>
                        <DangerousIcon sx={{verticalAlign: 'middle', mr:1}} color={'error'}/>
                        삭제
                    </div>

                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {question}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onDelete}>삭제</Button>
                    <Button onClick={onDialogCancel} autoFocus>취소</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}