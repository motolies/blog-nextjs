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

interface SelectOption {
  value: string | number
  label: string
}

interface BaseSearchField {
  name: string
  label: string
  type?: string
  pinned?: boolean
  defaultValue?: string
  options?: SelectOption[]
}

interface DateRangeSearchField {
  type: 'dateRange'
  fromName: string
  toName: string
  fromLabel: string
  toLabel: string
  pinned?: boolean
}

interface NumberRangeSearchField {
  type: 'numberRange'
  fromName: string
  toName: string
  fromLabel: string
  toLabel: string
  pinned?: boolean
  allowNegative?: boolean
  min?: number
  max?: number
  integerOnly?: boolean
}

type RangeSearchField = DateRangeSearchField | NumberRangeSearchField
type SearchField = BaseSearchField | DateRangeSearchField | NumberRangeSearchField

interface SpacingConfig {
  [key: string]: unknown
}

/**
 * 필드의 고유 키를 반환
 */
const isRangeField = (field: SearchField): field is RangeSearchField =>
  field.type === 'dateRange' || field.type === 'numberRange'

const getFieldKey = (field: SearchField): string => {
  if (isRangeField(field)) return field.fromName
  return (field as BaseSearchField).name
}

/**
 * 필드의 라벨을 반환
 */
const getFieldLabel = (field: SearchField): string => {
  if (isRangeField(field)) {
    return `${field.fromLabel} ~ ${field.toLabel}`
  }
  return (field as BaseSearchField).label
}

/**
 * 검색 필드 렌더링
 */
const renderField = (
  field: SearchField,
  searchInputs: Record<string, unknown>,
  onInputChange: (name: string, value: string) => void,
  onKeyPress: (e: React.KeyboardEvent) => void,
  spacingConfig?: SpacingConfig,
) => {
  if (field.type === 'dateRange') {
    const df = field as DateRangeSearchField
    return (
      <DateRangePicker
        key={df.fromName}
        fromValue={String(searchInputs[df.fromName] || '')}
        toValue={String(searchInputs[df.toName] || '')}
        onFromChange={(val: string) => onInputChange(df.fromName, val)}
        onToChange={(val: string) => onInputChange(df.toName, val)}
        fromLabel={df.fromLabel}
        toLabel={df.toLabel}
        size="small"
      />
    )
  }

  if (field.type === 'numberRange') {
    const nf = field as NumberRangeSearchField
    const inputMin = nf.allowNegative === false ? Math.max(0, nf.min ?? 0) : nf.min
    const inputStep = nf.integerOnly ? 1 : undefined
    return (
      <div key={nf.fromName} className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">{`${nf.fromLabel} ~ ${nf.toLabel}`}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={String(searchInputs[nf.fromName] ?? '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(nf.fromName, e.target.value)}
            onKeyPress={onKeyPress}
            className="h-8 w-[90px]"
            placeholder={nf.fromLabel}
            min={inputMin}
            max={nf.max}
            step={inputStep}
          />
          <span className="text-muted-foreground text-xs">~</span>
          <Input
            type="number"
            value={String(searchInputs[nf.toName] ?? '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(nf.toName, e.target.value)}
            onKeyPress={onKeyPress}
            className="h-8 w-[90px]"
            placeholder={nf.toLabel}
            min={inputMin}
            max={nf.max}
            step={inputStep}
          />
        </div>
      </div>
    )
  }

  const baseField = field as BaseSearchField

  if (baseField.type === 'select') {
    const rawValue = searchInputs[baseField.name]
    const selectValue = rawValue === undefined || rawValue === null || rawValue === ''
      ? SELECT_EMPTY_VALUE
      : String(rawValue)

    return (
      <div key={baseField.name} className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">{baseField.label}</Label>
        <Select
          value={selectValue}
          onValueChange={(val: string) => onInputChange(baseField.name, val === SELECT_EMPTY_VALUE ? '' : val)}
        >
          <SelectTrigger size="sm" className="min-w-[120px]">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_EMPTY_VALUE}>전체</SelectItem>
            {baseField.options?.map(opt => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div key={baseField.name} className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{baseField.label}</Label>
      <Input
        type={baseField.type || 'text'}
        value={String(searchInputs[baseField.name] ?? '')}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(baseField.name, e.target.value)}
        onKeyPress={onKeyPress}
        className="h-8 min-w-[120px]"
        placeholder={baseField.label}
      />
    </div>
  )
}

interface DynamicSearchFieldsProps {
  searchFields: SearchField[]
  searchInputs: Record<string, unknown>
  defaultSearchParams: Record<string, unknown>
  onInputChange: (name: string, value: string) => void
  onSearch: () => void
  onReset: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
  spacingConfig?: SpacingConfig
  enableDynamic?: boolean
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
}: DynamicSearchFieldsProps) {
  const [activeFields, setActiveFields] = useState<string[]>([])
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // defaultSearchParams에 값이 있는 동적 필드는 자동 활성화
  useEffect(() => {
    if (!enableDynamic) return

    const dynamicFields = searchFields.filter(f => !f.pinned)
    const autoActive = dynamicFields
      .filter(field => {
        const key = getFieldKey(field)
        if (isRangeField(field)) {
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

  const handleAddField = (field: SearchField) => {
    const key = getFieldKey(field)
    if (!activeFields.includes(key)) {
      setActiveFields(prev => [...prev, key])
      if ((field as BaseSearchField).defaultValue !== undefined) {
        onInputChange((field as BaseSearchField).name, (field as BaseSearchField).defaultValue!)
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

  const handleRemoveField = (field: SearchField) => {
    const key = getFieldKey(field)
    setActiveFields(prev => prev.filter(k => k !== key))

    // 값 초기화
    if (isRangeField(field)) {
      onInputChange(field.fromName, '')
      onInputChange(field.toName, '')
    } else {
      onInputChange((field as BaseSearchField).name, '')
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
                ref={(el: HTMLDivElement | null) => { fieldRefs.current[key] = el }}
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
