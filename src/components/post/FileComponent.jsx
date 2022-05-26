import {Box} from "@mui/material"
import {useState} from "react"
import IconButton from "@mui/material/IconButton"
import DeleteIcon from "@mui/icons-material/Delete"
import DeleteConfirm from "../confirm/DeleteConfirm"
import PreviewDialog from "../PreviewDialog"
import PreviewIcon from '@mui/icons-material/Preview'


export const FileComponent = (props) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [question, setQuestion] = useState('')

    const showDeleteConfirmDialog = (e) => {
        e.stopPropagation()
        setQuestion(`${props.file.originFileName} 파일을 삭제하시겠습니까?`)
        setShowDeleteConfirm(true)
    }

    const deleteFile = async () => {
        await props.onDeleteFile(props.file)
        setShowDeleteConfirm(false)
    }
    const deleteFileCancel = () => {
        setShowDeleteConfirm(false)
    }

    const insertFileLink = (e) => {
        props.onInsertFile(props.file)
    }

    const fileTypeStyle = () => {
        const style = {
            mb: 1
            , px: 1
            , background: "rgba(17, 153, 142, .2)"
            , '&:hover': {
                background: "rgba(17, 153, 142, .6)"
            }
            , cursor: 'pointer'
            , display: 'flex'
            , alignItems: 'center'
        }
        if (props.file.type.startsWith('image')) {
            style.background = 'rgba(253, 187, 45, .2)'
            style['&:hover'] = {
                background: 'rgba(253, 187, 45, .6)'
            }
        }
        return style
    }

    const fileLeftMargin = () => {
        if(props.file.type.startsWith('image'))
            return {}
        else
            return {marginLeft:'auto'}
    }


    return (
        <Box display="flex-inline"
             sx={fileTypeStyle}
             onClick={insertFileLink}
        >
            <Box sx={{
                textOverflow: 'ellipsis'
                , overflow: 'hidden'
                , whiteSpace: 'nowrap'
            }}>
                {props.file.originFileName}
            </Box>
            {!props.file.type.startsWith('image') ? null :
                <IconButton aria-label="delete" onClick={(e) => {
                    e.stopPropagation()
                    setShowPreview(true)
                }}
                            sx={{marginLeft: 'auto'}}>
                    <PreviewIcon fontSize={'small'}/>
                </IconButton>
            }
            <IconButton aria-label="delete" onClick={showDeleteConfirmDialog}
                        sx={fileLeftMargin}>
                <DeleteIcon fontSize={'small'}/>
            </IconButton>
            <DeleteConfirm open={showDeleteConfirm} question={question} onConfirm={deleteFile} onCancel={deleteFileCancel}/>
            <PreviewDialog open={showPreview} imageSrc={props.file.resourceUri} onClose={() => setShowPreview(false)}/>
        </Box>
    )

}
