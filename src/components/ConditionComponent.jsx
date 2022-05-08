import {Box} from "@mui/material"
import IconButton from "@mui/material/IconButton"
import DeleteIcon from "@mui/icons-material/Delete"

export const ConditionComponent = ({id, name, onDelete}) => {

    const deleteCondition = (e) => {
        e.stopPropagation()
        onDelete(id)
    }

    return (
        <Box
            display="flex-inline"
            sx={{
                p: 1
                , '&:hover': {
                    background: "rgba(57, 138, 185, 0.4)"
                }
                // , cursor: "pointer"
            }}
        >
            {name}
            <IconButton aria-label="delete" onClick={deleteCondition}>
                <DeleteIcon/>
            </IconButton>
        </Box>
    )
}
