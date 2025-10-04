import React from 'react'
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import PreviewIcon from '@mui/icons-material/Preview'
import {Box} from "@mui/material"

export default function PreviewDialog({open, imageSrc, onClose}) {
    const close = (e) => {
        e.stopPropagation()
        onClose()
    }
    return (
        <div>
            <Dialog
                PaperProps={{sx: {maxWidth: "100%", maxHeight: "100%"}}}
                open={open}
                onClose={(e) => {
                    close(e)
                }}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                         onClick={(e) => {
                             close(e)
                         }}
                    >
                        <PreviewIcon sx={{verticalAlign: 'middle', mr: 1}} color={'error'}/>
                        Preview Image
                    </div>
                </DialogTitle>
                <Box sx={{m: 3, textAlign: 'center'}}
                     onClick={(e) => {
                         close(e)
                     }}>
                    <img src={window.location.origin + imageSrc} style={{maxWidth: '90%'}}/>
                </Box>
            </Dialog>
        </div>
    )
}

