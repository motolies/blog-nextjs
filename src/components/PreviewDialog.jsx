import React from 'react'
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import Button from "@mui/material/Button"
import PreviewIcon from '@mui/icons-material/Preview'
import Image from "next/image"

export default function PreviewDialog({open, imageSrc, onClose}) {
    const onDialogClose = (e) => {
        e.stopPropagation()
        onClose()
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
                        <PreviewIcon sx={{verticalAlign: 'middle', mr: 1}} color={'error'}/>
                        Preview Image
                    </div>

                </DialogTitle>
                <DialogContent>
                    <Image src={imageSrc} alt="preview" width={'600px'} height={'400px'}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onDialogClose} autoFocus>취소</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

