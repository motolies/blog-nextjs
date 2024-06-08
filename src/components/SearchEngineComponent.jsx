import {Box, TextField} from "@mui/material"
import {useState} from "react"

export const SearchEngineComponent = ({name, url}) => {

  const [text, setText] = useState('')
  const [searchWindow, setSearchWindow] = useState(null);

  const goSearch = (e) => {
    if (e.key === 'Enter') {
      const searchUrl = url.replace('%s', encodeURIComponent(text.trim()));

      if (searchWindow && !searchWindow.closed) {
        searchWindow.focus();
      } else {
        const newWindow = window.open(searchUrl, '_blank');
        setSearchWindow(newWindow);
      }
    }
  }

  return (
      <Box
          sx={{
            p: 1,
            '&:hover': {
              background: "rgba(57, 138, 185, 0.4)"
            },
            borderRadius: '.5rem',
            alignItems: 'stretch',
            width: {xs: '100%', sm: 'calc(100% * 0.42)', md: 'calc(100% * 0.42)', lg: 'calc(100% * 0.45)', xl: 'calc(100% * 0.3)'},
          }}
      >
        <TextField type={'search'}
                   value={text}
                   fullWidth
                   size="small"
                   onChange={(e) => setText(e.target.value)}
                   id="outlined-basic"
                   label={name}
                   variant="outlined"
                   onKeyDown={goSearch}
        />
      </Box>
  )
}
