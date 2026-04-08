import React, { type ReactNode } from 'react'
import { type RowData, type Table } from '@tanstack/react-table'
import { Plus, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type DataTableDensity } from './DataTableCore'

export interface DataTableToolbarProps<TData extends RowData> {
  enableRowSelection?: boolean
  selectedRows: TData[]
  selectedCount: number
  clearSelection: () => void
  renderSelectionToolbar?: (props: {
    selectedRows: TData[]
    selectedCount: number
    clearSelection: () => void
    table: Table<TData>
  }) => ReactNode

  onAddRow?: () => void
  onSaveAll?: (data: TData[]) => void | Promise<void>
  data: TData[]

  renderToolbar?: (props: {
    table: Table<TData>
    data: TData[]
    addRow: (() => void) | undefined
    saveAll: (() => void) | undefined
  }) => ReactNode

  table: Table<TData>
  density: DataTableDensity
}

export default function DataTableToolbar<TData extends RowData>({
  enableRowSelection,
  selectedRows,
  selectedCount,
  clearSelection,
  renderSelectionToolbar,
  onAddRow,
  onSaveAll,
  data,
  renderToolbar,
  table,
  density,
}: DataTableToolbarProps<TData>) {
  const hasSelection = enableRowSelection && selectedCount > 0
  const hasActions = Boolean(onAddRow || onSaveAll)

  const handleSaveAll = onSaveAll ? () => onSaveAll(data) : undefined

  if (renderToolbar) {
    return (
      <div className="mb-1">
        {renderToolbar({
          table,
          data,
          addRow: onAddRow,
          saveAll: handleSaveAll,
        })}
      </div>
    )
  }

  if (!hasSelection && !hasActions) {
    return null
  }

  const sizeClass = density === 'compact' ? 'h-7 text-xs' : 'h-8 text-sm'
  const iconSize = density === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5'

  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {hasSelection && (
          <>
            <span className={cn('font-medium text-[color:var(--admin-text-secondary)]', sizeClass, 'flex items-center')}>
              {selectedCount.toLocaleString('ko-KR')}개 선택됨
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={cn(sizeClass, 'gap-1 text-[color:var(--admin-text-muted)] hover:text-[color:var(--admin-text)]')}
              onClick={clearSelection}
            >
              <X className={iconSize} />
              선택 해제
            </Button>
            {renderSelectionToolbar?.({
              selectedRows,
              selectedCount,
              clearSelection,
              table,
            })}
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        {onAddRow && (
          <Button
            variant="outline"
            size="sm"
            className={cn(sizeClass, 'gap-1')}
            onClick={onAddRow}
          >
            <Plus className={iconSize} />
            추가
          </Button>
        )}
        {onSaveAll && (
          <Button
            variant="default"
            size="sm"
            className={cn(sizeClass, 'gap-1')}
            onClick={handleSaveAll}
          >
            <Save className={iconSize} />
            저장
          </Button>
        )}
      </div>
    </div>
  )
}
