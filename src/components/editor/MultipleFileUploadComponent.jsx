import Button from "@mui/material/Button"
import {useRef} from "react"

export default function MultipleFileUploadComponent(props) {

    const fileInput = useRef()

    return (
        <div>
            <Button
                fullWidth size="large" variant="outlined"
                onClick={() => fileInput.current.click()}
                sx={props.sx}
            >
                upload file
            </Button>

            <input
                multiple
                ref={fileInput}
                type="file"
                style={{display: 'none'}}
                onChange={(e) => props.onChange(e.target.files)}
            />
        </div>
    )
}