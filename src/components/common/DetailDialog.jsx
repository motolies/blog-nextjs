import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography
} from '@mui/material'
import {Close as CloseIcon} from '@mui/icons-material'

/**
 * 긴 텍스트를 팝업으로 표시하는 다이얼로그 컴포넌트
 *
 * @param {Object} props
 * @param {boolean} props.open - 다이얼로그 열림 상태
 * @param {Function} props.onClose - 닫기 핸들러
 * @param {string} props.title - 다이얼로그 제목
 * @param {string} props.content - 표시할 내용
 */
export default function DetailDialog({open, onClose, title, content}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{m: 0, p: 2, pr: 6}}>
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box
          component="pre"
          sx={{
            fontFamily: 'D2Coding, monospace',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            margin: 0,
            padding: 1,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
          }}
        >
          {content || '-'}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  )
}
