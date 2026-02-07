import React, {useState, useEffect, useRef, useCallback} from 'react'
import {
  Box, TextField, Button, Stack, Paper, MenuItem,
  Menu, IconButton, Chip
} from '@mui/material'
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Check as CheckIcon
} from '@mui/icons-material'
import dynamic from 'next/dynamic'

const DateRangePicker = dynamic(() => import('./DateRangePicker'), {ssr: false})

/**
 * 필드의 고유 키를 반환
 */
const getFieldKey = (field) => {
  if (field.type === 'dateRange') return field.fromName
  return field.name
}

/**
 * 필드의 라벨을 반환
 */
const getFieldLabel = (field) => {
  if (field.type === 'dateRange') return `${field.fromLabel} ~ ${field.toLabel}`
  return field.label
}

/**
 * 검색 필드 렌더링
 */
const renderField = (field, searchInputs, onInputChange, onKeyPress, spacingConfig) => {
  if (field.type === 'dateRange') {
    return (
      <DateRangePicker
        key={field.fromName}
        fromValue={searchInputs[field.fromName] || ''}
        toValue={searchInputs[field.toName] || ''}
        onFromChange={(val) => onInputChange(field.fromName, val)}
        onToChange={(val) => onInputChange(field.toName, val)}
        fromLabel={field.fromLabel}
        toLabel={field.toLabel}
        size="small"
      />
    )
  }

  if (field.type === 'select') {
    return (
      <TextField
        key={field.name}
        select
        label={field.label}
        size="small"
        value={searchInputs[field.name] || ''}
        onChange={(e) => onInputChange(field.name, e.target.value)}
        sx={{minWidth: spacingConfig.textFieldMinWidth}}
      >
        <MenuItem value="">전체</MenuItem>
        {field.options?.map(opt => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </TextField>
    )
  }

  return (
    <TextField
      key={field.name}
      label={field.label}
      size="small"
      type={field.type || 'text'}
      value={searchInputs[field.name] || ''}
      onChange={(e) => onInputChange(field.name, e.target.value)}
      onKeyPress={onKeyPress}
      sx={{minWidth: spacingConfig.textFieldMinWidth}}
    />
  )
}

/**
 * MRTTable용 검색 필드 컴포넌트
 *
 * enableDynamic=false: 기존 방식 (모든 필드 일렬 표시)
 * enableDynamic=true: pinned/dynamic 분리 + 필드 추가 메뉴
 */
export default function DynamicSearchFields({
  searchFields,
  searchInputs,
  defaultSearchParams,
  onInputChange,
  onSearch,
  onReset,
  onKeyPress,
  spacingConfig,
  enableDynamic = false,
}) {
  const [activeFields, setActiveFields] = useState([])
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const fieldRefs = useRef({})
  const menuOpen = Boolean(menuAnchorEl)

  // defaultSearchParams에 값이 있는 동적 필드는 자동 활성화
  useEffect(() => {
    if (!enableDynamic) return

    const dynamicFields = searchFields.filter(f => !f.pinned)
    const autoActive = dynamicFields
      .filter(field => {
        const key = getFieldKey(field)
        if (field.type === 'dateRange') {
          return defaultSearchParams[field.fromName] || defaultSearchParams[field.toName]
        }
        return defaultSearchParams[key]
      })
      .map(getFieldKey)

    if (autoActive.length > 0) {
      setActiveFields(autoActive)
    }
  }, []) // 초기 마운트 시 1회만

  // 기존 방식 (enableDynamic=false)
  if (!enableDynamic) {
    return (
      <Paper sx={{p: spacingConfig.filterPadding, mb: spacingConfig.filterMarginBottom}}>
        <Stack direction="row" spacing={spacingConfig.stackSpacing} flexWrap="wrap" useFlexGap>
          {searchFields.map(field => renderField(field, searchInputs, onInputChange, onKeyPress, spacingConfig))}
          <Button
            variant="contained"
            size={spacingConfig.buttonSize}
            startIcon={<SearchIcon/>}
            onClick={onSearch}
          >
            검색
          </Button>
          <Button
            variant="outlined"
            size={spacingConfig.buttonSize}
            startIcon={<RefreshIcon/>}
            onClick={onReset}
          >
            초기화
          </Button>
        </Stack>
      </Paper>
    )
  }

  // 동적 모드
  const pinnedFields = searchFields.filter(f => f.pinned === true)
  const dynamicFields = searchFields.filter(f => f.pinned !== true)
  const visibleDynamic = dynamicFields.filter(f => activeFields.includes(getFieldKey(f)))

  const handleAddField = (field) => {
    const key = getFieldKey(field)
    if (!activeFields.includes(key)) {
      setActiveFields(prev => [...prev, key])
    }
    setMenuAnchorEl(null)

    // 추가 후 해당 필드로 포커스
    setTimeout(() => {
      const ref = fieldRefs.current[key]
      if (ref) {
        const input = ref.querySelector('input')
        if (input) input.focus()
      }
    }, 100)
  }

  const handleRemoveField = (field) => {
    const key = getFieldKey(field)
    setActiveFields(prev => prev.filter(k => k !== key))

    // 값 초기화
    if (field.type === 'dateRange') {
      onInputChange(field.fromName, '')
      onInputChange(field.toName, '')
    } else {
      onInputChange(field.name, '')
    }
  }

  const handleResetAll = () => {
    setActiveFields([])
    onReset()
  }

  return (
    <Paper sx={{p: spacingConfig.filterPadding, mb: spacingConfig.filterMarginBottom}}>
      {/* Row 1: Pinned 필드 + 검색/초기화 버튼 */}
      <Stack direction="row" spacing={spacingConfig.stackSpacing} flexWrap="wrap" useFlexGap alignItems="center">
        {pinnedFields.map(field => renderField(field, searchInputs, onInputChange, onKeyPress, spacingConfig))}
        <Button
          variant="contained"
          size={spacingConfig.buttonSize}
          startIcon={<SearchIcon/>}
          onClick={onSearch}
        >
          검색
        </Button>
        <Button
          variant="outlined"
          size={spacingConfig.buttonSize}
          startIcon={<RefreshIcon/>}
          onClick={handleResetAll}
        >
          초기화
        </Button>
      </Stack>

      {/* Row 2: 검색 조건 추가 버튼 */}
      {dynamicFields.length > 0 && (
        <Box sx={{mt: 1.5}}>
          <Button
            size={spacingConfig.buttonSize}
            startIcon={<AddIcon/>}
            onClick={(e) => setMenuAnchorEl(e.currentTarget)}
            sx={{textTransform: 'none'}}
          >
            검색 조건 추가
          </Button>
          <Menu
            anchorEl={menuAnchorEl}
            open={menuOpen}
            onClose={() => setMenuAnchorEl(null)}
          >
            {dynamicFields.map(field => {
              const key = getFieldKey(field)
              const isActive = activeFields.includes(key)
              return (
                <MenuItem
                  key={key}
                  onClick={() => handleAddField(field)}
                >
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1, width: '100%'}}>
                    {isActive && <CheckIcon fontSize="small" color="primary"/>}
                    {!isActive && <Box sx={{width: 20}}/>}
                    {getFieldLabel(field)}
                  </Box>
                </MenuItem>
              )
            })}
          </Menu>
        </Box>
      )}

      {/* Row 3: 동적 추가된 필드들 */}
      {visibleDynamic.length > 0 && (
        <Stack direction="row" spacing={spacingConfig.stackSpacing} flexWrap="wrap" useFlexGap sx={{mt: 1.5}}>
          {visibleDynamic.map(field => {
            const key = getFieldKey(field)
            return (
              <Box
                key={key}
                ref={el => fieldRefs.current[key] = el}
                sx={{display: 'flex', alignItems: 'center', gap: 0.5}}
              >
                {renderField(field, searchInputs, onInputChange, onKeyPress, spacingConfig)}
                <IconButton
                  size="small"
                  onClick={() => handleRemoveField(field)}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {color: 'error.main'}
                  }}
                >
                  <CloseIcon fontSize="small"/>
                </IconButton>
              </Box>
            )
          })}
        </Stack>
      )}
    </Paper>
  )
}
