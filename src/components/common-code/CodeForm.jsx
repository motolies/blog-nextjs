import React from 'react'
import {
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'

export default function CodeForm({formData, setFormData, dialogMode, originalCode, parentClassNode}) {
  const isEdit = dialogMode === 'editCode'
  const codeChanged = isEdit && formData.code !== originalCode

  return (
    <Stack spacing={3}>
      <TextField
        label="소속 클래스 코드"
        value={formData.codeClassCode}
        disabled
        fullWidth
      />
      <TextField
        label="코드값"
        value={formData.code}
        onChange={(e) => setFormData(prev => ({...prev, code: e.target.value}))}
        required
        fullWidth
        color={codeChanged ? 'warning' : undefined}
        focused={codeChanged ? true : undefined}
        helperText={
          codeChanged
            ? `⚠️ 기존 코드(${originalCode})가 변경 됩니다.`
            : '영문 대문자와 밑줄(_)만 사용'
        }
      />
      <TextField
        label="코드명"
        value={formData.codeName}
        onChange={(e) => setFormData(prev => ({...prev, codeName: e.target.value}))}
        required
        fullWidth
      />
      <TextField
        label="설명"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
        multiline
        rows={3}
        fullWidth
      />

      <Typography variant="h6">속성 값</Typography>
      {[1, 2, 3, 4, 5].map(num => {
        const attrName = parentClassNode?.[`attribute${num}Name`]
        return (
          <TextField
            key={num}
            label={attrName || `속성${num} 값`}
            value={formData[`attribute${num}Value`]}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              [`attribute${num}Value`]: e.target.value
            }))}
            fullWidth
            helperText={attrName ? undefined : '(부모 클래스에 속성명 미정의)'}
            disabled={!attrName}
          />
        )
      })}

      <TextField
        label="하위 클래스 코드"
        value={formData.childClassCode}
        onChange={(e) => setFormData(prev => ({...prev, childClassCode: e.target.value}))}
        placeholder="재귀 구조용 (선택사항)"
        fullWidth
      />

      <TextField
        label="정렬순서"
        type="number"
        value={formData.sort}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          sort: parseInt(e.target.value) || 0
        }))}
        fullWidth
      />

      <FormControlLabel
        control={
          <Switch
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.checked}))}
          />
        }
        label="활성화"
      />
    </Stack>
  )
}
