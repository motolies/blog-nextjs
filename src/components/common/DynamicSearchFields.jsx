import React, {useState, useEffect, useRef} from 'react'
import {
  Search as SearchIcon,
  RefreshCw as RefreshIcon,
  Plus as AddIcon,
  X as CloseIcon,
  Check as CheckIcon,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const DateRangePicker = dynamic(() => import('./DateRangePicker'), {ssr: false})
const SELECT_EMPTY_VALUE = '__SHADCN_SELECT_EMPTY__'

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
    const rawValue = searchInputs[field.name]
    const selectValue = rawValue === undefined || rawValue === null || rawValue === ''
      ? SELECT_EMPTY_VALUE
      : String(rawValue)

    return (
      <div key={field.name} className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">{field.label}</Label>
        <Select
          value={selectValue}
          onValueChange={(val) => onInputChange(field.name, val === SELECT_EMPTY_VALUE ? '' : val)}
        >
          <SelectTrigger size="sm" className="min-w-[120px]">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_EMPTY_VALUE}>전체</SelectItem>
            {field.options?.map(opt => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div key={field.name} className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{field.label}</Label>
      <Input
        type={field.type || 'text'}
        value={searchInputs[field.name] ?? ''}
        onChange={(e) => onInputChange(field.name, e.target.value)}
        onKeyPress={onKeyPress}
        className="h-8 min-w-[120px]"
        placeholder={field.label}
      />
    </div>
  )
}

/**
 * 데이터 테이블용 검색 필드 컴포넌트
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
  const fieldRefs = useRef({})

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
      <div className="rounded-lg border bg-card p-3 mb-3">
        <div className="flex flex-wrap items-end gap-2">
          {searchFields.map(field => renderField(field, searchInputs, onInputChange, onKeyPress, spacingConfig))}
          <Button
            size="sm"
            onClick={onSearch}
            className="h-8"
          >
            <SearchIcon />
            검색
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-8"
          >
            <RefreshIcon />
            초기화
          </Button>
        </div>
      </div>
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
      if (field.defaultValue !== undefined) {
        onInputChange(field.name, field.defaultValue)
      }
    }

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
    <div className="rounded-lg border bg-card p-3 mb-3">
      {/* Row 1: Pinned 필드 + 검색/초기화 버튼 */}
      <div className="flex flex-wrap items-end gap-2">
        {pinnedFields.map(field => renderField(field, searchInputs, onInputChange, onKeyPress, spacingConfig))}
        <Button
          size="sm"
          onClick={onSearch}
          className="h-8"
        >
          <SearchIcon />
          검색
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          className="h-8"
        >
          <RefreshIcon />
          초기화
        </Button>
      </div>

      {/* Row 2: 검색 조건 추가 버튼 */}
      {dynamicFields.length > 0 && (
        <div className="mt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                <AddIcon />
                검색 조건 추가
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {dynamicFields.map(field => {
                const key = getFieldKey(field)
                const isActive = activeFields.includes(key)
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleAddField(field)}
                  >
                    <span className="flex items-center gap-2 w-full">
                      {isActive
                        ? <CheckIcon className="size-4 text-primary" />
                        : <span className="size-4" />
                      }
                      {getFieldLabel(field)}
                    </span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Row 3: 동적 추가된 필드들 */}
      {visibleDynamic.length > 0 && (
        <div className="flex flex-wrap items-end gap-2 mt-3">
          {visibleDynamic.map(field => {
            const key = getFieldKey(field)
            return (
              <div
                key={key}
                ref={el => fieldRefs.current[key] = el}
                className="flex items-end gap-1"
              >
                {renderField(field, searchInputs, onInputChange, onKeyPress, spacingConfig)}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveField(field)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive mb-0"
                >
                  <CloseIcon className="size-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
