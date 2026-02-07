import React from 'react'
import {
  Alert,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material'

export default function ClassForm({formData, setFormData, dialogMode, originalCode}) {
  const isEdit = dialogMode === 'editClass'
  const codeChanged = isEdit && formData.classCode !== originalCode

  return (
    <Stack spacing={3}>
      {dialogMode === 'addChildClass' && formData.parentCodeNode && (
        <Alert severity="info">
          부모 코드: <strong>
            {formData.parentCodeNode.classCode} - {formData.parentCodeNode.code} ({formData.parentCodeNode.name})
          </strong>
          <br/>
          이 코드의 하위 클래스로 새로운 클래스가 생성됩니다.
        </Alert>
      )}

      <TextField
        label="클래스 코드"
        value={formData.classCode}
        onChange={(e) => setFormData(prev => ({...prev, classCode: e.target.value}))}
        required
        fullWidth
        color={codeChanged ? 'warning' : undefined}
        focused={codeChanged ? true : undefined}
        helperText={
          codeChanged
            ? `⚠️ 기존 클래스 코드(${originalCode})가 변경 됩니다.`
            : '영문 대문자와 밑줄(_)만 사용'
        }
      />
      <TextField
        label="클래스명"
        value={formData.className}
        onChange={(e) => setFormData(prev => ({...prev, className: e.target.value}))}
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

      <Typography variant="h6">속성 정의</Typography>
      {[1, 2, 3, 4, 5].map(num => (
        <TextField
          key={num}
          label={`속성${num} 이름`}
          value={formData[`attribute${num}Name`]}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            [`attribute${num}Name`]: e.target.value
          }))}
          fullWidth
        />
      ))}

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
