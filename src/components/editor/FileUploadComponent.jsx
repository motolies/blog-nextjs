import Button from "@mui/material/Button"
import {useRef} from "react"

export default function FileUploadComponent(props) {

    const fileInput = useRef()

    return (
        <div>
            <Button
                fullWidth size="large" variant="outlined"
                onClick={() => fileInput.current.click()}
            >
                upload file
            </Button>

            <input
                ref={fileInput}
                type="file"
                style={{display: 'none'}}
                onChange={(e) => props.onChange(e.target.files[0])}
            />
        </div>
    )
}