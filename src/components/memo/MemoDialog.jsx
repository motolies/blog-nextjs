import React, {useState, useEffect} from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Autocomplete,
} from '@mui/material'
import {Close as CloseIcon} from '@mui/icons-material'
import {useSnackbar} from 'notistack'
import service from '../../service'

export default function MemoDialog({open, onClose, memoId = null, onSaved}) {
  const {enqueueSnackbar} = useSnackbar()
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadCategories().then(cats => {
        if (memoId) {
          loadMemo(memoId)
        } else {
          setContent('')
          if (cats.length > 0) {
            const sorted = [...cats].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
            setCategoryId(sorted[0].id)
            setSelectedCategory(sorted[0])
          } else {
            setCategoryId(null)
            setSelectedCategory(null)
          }
        }
      })
    }
  }, [open, memoId])

  const loadCategories = async () => {
    try {
      const data = await service.memo.getCategories()
      setCategories(data || [])
      return data || []
    } catch (error) {
      console.error('카테고리 로드 실패:', error)
      return []
    }
  }

  const loadMemo = async (id) => {
    try {
      const data = await service.memo.getById(id)
      setContent(data.content || '')
      if (data.category) {
        setCategoryId(data.category.id)
        setSelectedCategory(data.category)
      } else {
        setCategoryId(null)
        setSelectedCategory(null)
      }
    } catch (error) {
      enqueueSnackbar('메모를 불러오는데 실패했습니다.', {variant: 'error'})
    }
  }

  const handleSave = async () => {
    if (!content.trim()) {
      enqueueSnackbar('메모 내용을 입력해주세요.', {variant: 'warning'})
      return
    }

    setLoading(true)
    try {
      const data = {content: content.trim(), categoryId}
      if (memoId) {
        await service.memo.update(memoId, data)
        enqueueSnackbar('메모가 수정되었습니다.', {variant: 'success'})
      } else {
        await service.memo.create(data)
        enqueueSnackbar('메모가 저장되었습니다.', {variant: 'success'})
      }
      onSaved?.()
      onClose()
    } catch (error) {
      enqueueSnackbar('메모 저장에 실패했습니다.', {variant: 'error'})
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (event, newValue) => {
    setSelectedCategory(newValue)
    setCategoryId(newValue?.id || null)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{sx: {maxHeight: '80vh'}}}
    >
      <DialogTitle sx={{m: 0, p: 2, pr: 6}}>
        {memoId ? '메모 수정' : '메모 작성'}
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
          <CloseIcon/>
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Autocomplete
            options={categories}
            getOptionLabel={(option) => option.name || ''}
            value={selectedCategory}
            onChange={handleCategoryChange}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            renderInput={(params) => (
                <TextField {...params} label="카테고리" size="small"/>
            )}
            sx={{mb: 2}}
        />
        <TextField
            autoFocus
            multiline
            minRows={8}
            maxRows={24}
            fullWidth
            placeholder="메모 내용을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}

        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          저장
        </Button>
      </DialogActions>
    </Dialog>
  )
}
