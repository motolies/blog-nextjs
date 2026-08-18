import React, { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DataTableEditableConfig } from './DataTableCore'

interface EditableCellProps {
  value: unknown
  config: DataTableEditableConfig
  isEditing: boolean
  onStartEdit: () => void
  onCommit: (value: unknown) => void
  onCancel: () => void
  readContent: ReactNode
}

export default function EditableCell({
  value,
  config,
  isEditing,
  onStartEdit,
  onCommit,
  onCancel,
  readContent,
}: EditableCellProps) {
  const [localValue, setLocalValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const committedRef = useRef(false)

  useEffect(() => {
    if (isEditing) {
      setLocalValue(value)
      committedRef.current = false
    }
  }, [isEditing, value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleCommit = useCallback((val: unknown) => {
    if (committedRef.current) return
    committedRef.current = true
    onCommit(val)
  }, [onCommit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommit(localValue)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    } else if (e.key === 'Tab') {
      handleCommit(localValue)
    }
  }, [localValue, handleCommit, onCancel])

  if (!isEditing) {
    return (
      <div
        onDoubleClick={(e) => {
          e.stopPropagation()
          onStartEdit()
        }}
        className="min-h-[1.25rem] cursor-default"
      >
        {readContent}
      </div>
    )
  }

  if (config.type === 'select') {
    return (
      <Select
        value={String(localValue ?? '')}
        onValueChange={(val) => handleCommit(val)}
        open
        onOpenChange={(open) => { if (!open) onCancel() }}
      >
        <SelectTrigger
          className="h-7 w-full text-xs"
          onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onCancel() } }}
          onClick={(e) => e.stopPropagation()}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {config.options?.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      ref={inputRef}
      type={config.type === 'number' ? 'number' : 'text'}
      value={localValue as string ?? ''}
      onChange={(e) => setLocalValue(config.type === 'number' ? Number(e.target.value) : e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => handleCommit(localValue)}
      className="h-7 px-1.5 text-xs"
      min={config.min}
      max={config.max}
      step={config.step}
      placeholder={config.placeholder}
      onClick={(e) => e.stopPropagation()}
    />
  )
}
