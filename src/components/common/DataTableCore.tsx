import React, { type CSSProperties, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  type Column,
  type ColumnDef,
  type ColumnOrderState,
  type Row,
  type RowData,
  type Table,
} from '@tanstack/react-table'
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import EditableCell from './EditableCell'

export const DEFAULT_COLUMN_WIDTH = 160
export const MIN_COLUMN_WIDTH = 60
export const MAX_COLUMN_WIDTH = 9999

export type DataTableAlign = 'left' | 'center' | 'right'
export type DataTableDensity = 'compact' | 'comfortable' | 'spacious'

export const DATA_TABLE_DENSITY_CONFIG = {
  compact: {
    cellPadding: 'px-2 py-1',
    headPadding: 'px-2 py-1.5',
    fontSize: 'text-xs',
    headerFontSize: 'text-xs',
    filterPadding: 1,
    filterMarginBottom: 1,
    stackSpacing: 1,
    textFieldMinWidth: 160,
    paginationPadding: 0.5,
    headerFontSizeMui: '0.8rem',
    bodyFontSizeMui: '0.8rem',
    totalTypographyVariant: 'caption',
    buttonSize: 'small',
  },
  comfortable: {
    cellPadding: 'px-3 py-2',
    headPadding: 'px-3 py-2',
    fontSize: 'text-sm',
    headerFontSize: 'text-sm',
    filterPadding: 2,
    filterMarginBottom: 2,
    stackSpacing: 2,
    textFieldMinWidth: 200,
    paginationPadding: 1,
    headerFontSizeMui: '0.875rem',
    bodyFontSizeMui: '0.875rem',
    totalTypographyVariant: 'body2',
    buttonSize: 'medium',
  },
  spacious: {
    cellPadding: 'px-4 py-3',
    headPadding: 'px-4 py-3',
    fontSize: 'text-base',
    headerFontSize: 'text-sm',
    filterPadding: 3,
    filterMarginBottom: 3,
    stackSpacing: 3,
    textFieldMinWidth: 240,
    paginationPadding: 2,
    headerFontSizeMui: '1rem',
    bodyFontSizeMui: '1rem',
    totalTypographyVariant: 'body1',
    buttonSize: 'medium',
  },
} as const

export interface DataTableCellProps<TData> {
  value: any
  row: TData
}

export interface DataTableFooterProps {
  value: unknown
  summaryRow?: Record<string, unknown> | null
}

export interface DataTableEditableConfig {
  type: 'text' | 'number' | 'select'
  options?: { value: string; label: string }[]
  placeholder?: string
  min?: number
  max?: number
  step?: number
}

export interface EditingCell {
  rowId: string
  columnId: string
}

export interface DataTableColumn<TData = unknown> {
  accessorKey?: string
  id?: string
  header: ReactNode
  cell?: (props: DataTableCellProps<TData>) => ReactNode
  footer?: ReactNode | ((props: DataTableFooterProps) => ReactNode)
  // Initial width before any manual resize. Unsized columns start at 160px.
  size?: number
  // Auto-grow columns absorb remaining width until the user resizes them manually.
  grow?: boolean
  minSize?: number
  maxSize?: number
  // All columns are resizable by default unless explicitly disabled.
  resizable?: boolean
  sortable?: boolean
  headerAlign?: DataTableAlign
  cellAlign?: DataTableAlign
  footerAlign?: DataTableAlign
  mobilePrimary?: boolean
  mobileHidden?: boolean
  mobileLabel?: string
  editable?: DataTableEditableConfig | boolean
}

export interface DataTableRowParams<TData> {
  row: TData
  id: string
}

interface TableColumnMeta {
  headerAlign: DataTableAlign
  cellAlign: DataTableAlign
  footerAlign: DataTableAlign
  grow: boolean
  mobilePrimary?: boolean
  mobileHidden?: boolean
  mobileLabel?: string
  editable?: DataTableEditableConfig | false
}

interface DesktopTableLayout {
  widths: Record<string, number>
  totalWidth: number
}

export interface DataTableCoreProps<TData extends RowData> {
  table: Table<TData>
  rows: Row<TData>[]
  loading?: boolean
  density?: DataTableDensity
  autoHeight?: boolean
  onRowClick?: (params: DataTableRowParams<TData>) => void
  getRowClassName?: (params: DataTableRowParams<TData>) => string
  className?: string
  noDataText?: string
  enableColumnReorder?: boolean
  columnOrder?: ColumnOrderState
  onColumnOrderChange?: (order: ColumnOrderState) => void
  editingCell?: EditingCell | null
  onEditingCellChange?: (cell: EditingCell | null) => void
  onCellValueChange?: (params: { rowId: string; columnId: string; value: unknown; row: TData }) => void
}

const NON_REORDERABLE_COLUMNS = new Set(['__select__', '__actions__'])

function getValueByAccessorKey(record: unknown, accessorKey?: string): unknown {
  if (!accessorKey) return undefined
  return accessorKey.split('.').reduce<unknown>((value, key) => {
    if (value === null || value === undefined || typeof value !== 'object') return undefined
    return (value as Record<string, unknown>)[key]
  }, record)
}

function renderDefaultCellValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

function resolveHeader<TData extends RowData>(header: DataTableColumn<TData>['header']): ColumnDef<TData>['header'] {
  if (typeof header === 'string' || typeof header === 'function') {
    return header as ColumnDef<TData>['header']
  }
  return () => header
}

export function getDataTableColumnId<TData>(column: DataTableColumn<TData>): string {
  return column.id || column.accessorKey || ''
}

export function getDataTableColumnLabel<TData>(column: DataTableColumn<TData>): string {
  if (typeof column.header === 'string' && column.header.trim()) {
    return column.header.trim()
  }
  return column.mobileLabel || column.accessorKey || column.id || '컬럼'
}

export function buildDataTableColumns<TData extends RowData>(
  columns: DataTableColumn<TData>[],
  summaryRow?: Record<string, unknown> | null,
): ColumnDef<TData>[] {
  return columns.map((column) => {
    const accessorKey = column.accessorKey
    const id = getDataTableColumnId(column)
    const cellAlign = column.cellAlign || 'left'
    const footerAlign = column.footerAlign || cellAlign
    const footerValue = accessorKey ? summaryRow?.[accessorKey] : undefined

    const editableConfig: DataTableEditableConfig | false =
      column.editable === true
        ? { type: 'text' }
        : column.editable && typeof column.editable === 'object'
          ? column.editable
          : false

    const sharedColumn = {
      id,
      header: resolveHeader(column.header),
      size: column.size ?? DEFAULT_COLUMN_WIDTH,
      minSize: column.minSize ?? MIN_COLUMN_WIDTH,
      maxSize: column.maxSize ?? MAX_COLUMN_WIDTH,
      enableSorting: column.sortable ?? Boolean(accessorKey),
      enableResizing: column.resizable ?? true,
      meta: {
        headerAlign: column.headerAlign || 'left',
        cellAlign,
        footerAlign,
        grow: Boolean(column.grow),
        mobilePrimary: column.mobilePrimary,
        mobileHidden: column.mobileHidden,
        mobileLabel: column.mobileLabel || getDataTableColumnLabel(column),
        editable: editableConfig,
      } satisfies TableColumnMeta,
      cell: ({ row }) => {
        const value = getValueByAccessorKey(row.original, accessorKey)
        if (column.cell) {
          return column.cell({ value, row: row.original })
        }
        return renderDefaultCellValue(value)
      },
      footer: column.footer
        ? () => {
            if (typeof column.footer === 'function') {
              return column.footer({ value: footerValue, summaryRow })
            }
            return column.footer
          }
        : footerValue !== undefined
          ? () => (
              <span className={cn(
                'font-bold',
                footerAlign === 'right' && 'block text-right',
                footerAlign === 'center' && 'block text-center',
              )}>
                {renderDefaultCellValue(footerValue)}
              </span>
            )
          : undefined,
    }

    if (accessorKey) {
      return {
        ...sharedColumn,
        accessorFn: (row: TData) => getValueByAccessorKey(row, accessorKey),
      } as ColumnDef<TData>
    }

    return sharedColumn as ColumnDef<TData>
  })
}

function computeDesktopTableLayout<TData extends RowData>(
  visibleLeafColumns: Column<TData, unknown>[],
  containerWidth: number,
  autoGrowDisabledIds: Set<string>,
): DesktopTableLayout {
  const widths: Record<string, number> = {}

  if (visibleLeafColumns.length === 0) {
    return { widths, totalWidth: 0 }
  }

  const currentWidths = visibleLeafColumns.map((column) => {
    const meta = column.columnDef.meta as TableColumnMeta | undefined
    return {
      id: column.id,
      width: Math.max(column.getSize(), 0),
      grow: Boolean(meta?.grow) && !autoGrowDisabledIds.has(column.id),
    }
  })

  const currentTotalWidth = currentWidths.reduce((sum, column) => sum + column.width, 0)
  const activeGrowColumns = currentWidths.filter((column) => column.grow)
  const extraWidth = activeGrowColumns.length > 0
    ? Math.max(Math.floor(containerWidth) - currentTotalWidth, 0)
    : 0
  const totalGrowBaseWidth = activeGrowColumns.reduce((sum, column) => sum + column.width, 0)

  currentWidths.forEach((column) => {
    widths[column.id] = column.width
  })

  let allocatedGrowWidth = 0
  activeGrowColumns.forEach((column, index) => {
    if (extraWidth <= 0) return

    const isLastGrowColumn = index === activeGrowColumns.length - 1
    const growShare = isLastGrowColumn
      ? extraWidth - allocatedGrowWidth
      : totalGrowBaseWidth > 0
        ? Math.floor(extraWidth * (column.width / totalGrowBaseWidth))
        : Math.floor(extraWidth / activeGrowColumns.length)

    widths[column.id] += growShare
    allocatedGrowWidth += growShare
  })

  return {
    widths,
    totalWidth: currentTotalWidth + extraWidth,
  }
}

function getHeaderWidth<TData extends RowData>(
  header: ReturnType<Table<TData>['getHeaderGroups']>[number]['headers'][number],
  widths: Record<string, number>,
): number {
  const leafHeaders = header.getLeafHeaders()
  if (leafHeaders.length === 0) return 0

  return leafHeaders.reduce((sum, leafHeader) => {
    return sum + (widths[leafHeader.column.id] ?? leafHeader.column.getSize())
  }, 0)
}

export default function DataTableCore<TData extends RowData>({
  table,
  rows,
  loading = false,
  density = 'comfortable',
  autoHeight = false,
  onRowClick,
  getRowClassName,
  className,
  noDataText = '데이터가 없습니다',
  enableColumnReorder = true,
  columnOrder = [],
  onColumnOrderChange,
  editingCell = null,
  onEditingCellChange,
  onCellValueChange,
}: DataTableCoreProps<TData>) {
  const densityConfig = DATA_TABLE_DENSITY_CONFIG[density]
  const tableContainerRef = useRef<HTMLDivElement | null>(null)
  const justResizedRef = useRef(false)
  const [tableContainerWidth, setTableContainerWidth] = useState(0)
  const [autoGrowDisabledIds, setAutoGrowDisabledIds] = useState<Record<string, true>>({})

  const allLeafColumnIdsKey = table.getAllLeafColumns().map((column) => column.id).join('|')
  const autoGrowDisabledSet = useMemo(() => new Set(Object.keys(autoGrowDisabledIds)), [autoGrowDisabledIds])
  const visibleLeafColumns = table.getVisibleLeafColumns()

  useEffect(() => {
    const allLeafColumnIds = new Set(table.getAllLeafColumns().map((column) => column.id))
    setAutoGrowDisabledIds((previous) => {
      const nextEntries = Object.entries(previous).filter(([columnId]) => allLeafColumnIds.has(columnId))
      if (nextEntries.length === Object.keys(previous).length) {
        return previous
      }
      return Object.fromEntries(nextEntries)
    })
  }, [allLeafColumnIdsKey, table])

  useEffect(() => {
    const container = tableContainerRef.current
    if (!container) return

    const updateWidth = (nextWidth: number) => {
      const normalizedWidth = Math.max(Math.floor(nextWidth), 0)
      setTableContainerWidth((previous) => (previous === normalizedWidth ? previous : normalizedWidth))
    }

    updateWidth(container.clientWidth)

    if (typeof ResizeObserver === 'undefined') return

    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? container.clientWidth
      updateWidth(nextWidth)
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  const desktopTableLayout = useMemo(() => {
    return computeDesktopTableLayout(visibleLeafColumns, tableContainerWidth, autoGrowDisabledSet)
  }, [autoGrowDisabledSet, table.getState().columnSizing, tableContainerWidth, visibleLeafColumns])

  const hasSummaryRow = useMemo(() => {
    return table.getFooterGroups().some((footerGroup) => {
      return footerGroup.headers.some((header) => !header.isPlaceholder && Boolean(header.column.columnDef.footer))
    })
  }, [table])

  const handleResizeStart = useCallback((
    header: ReturnType<Table<TData>['getHeaderGroups']>[number]['headers'][number],
    event: React.MouseEvent | React.TouchEvent,
  ) => {
    const meta = header.column.columnDef.meta as TableColumnMeta | undefined
    if (meta?.grow) {
      setAutoGrowDisabledIds((previous) => {
        if (previous[header.column.id]) return previous
        return { ...previous, [header.column.id]: true }
      })
    }

    justResizedRef.current = true
    header.getResizeHandler()(event)

    const reset = () => {
      setTimeout(() => {
        justResizedRef.current = false
      }, 0)
      document.removeEventListener('mouseup', reset)
      document.removeEventListener('touchend', reset)
      document.removeEventListener('touchcancel', reset)
    }

    document.addEventListener('mouseup', reset, { once: true })
    document.addEventListener('touchend', reset, { once: true })
    document.addEventListener('touchcancel', reset, { once: true })
  }, [])

  const SortIcon = ({ column }: { column: ReturnType<Table<TData>['getAllColumns']>[number] }) => {
    if (!column.getCanSort()) return null
    if (column.getIsSorted() === 'asc') return <ArrowUp className="ml-1 h-3 w-3 shrink-0" />
    if (column.getIsSorted() === 'desc') return <ArrowDown className="ml-1 h-3 w-3 shrink-0" />
    return <ArrowUpDown className="ml-1 h-3 w-3 shrink-0 opacity-40" />
  }

  // Editable cell content renderer
  const renderCellContent = useCallback((
    cell: ReturnType<Row<TData>['getVisibleCells']>[number],
    row: Row<TData>,
  ) => {
    const meta = cell.column.columnDef.meta as TableColumnMeta | undefined
    const editableConfig = meta?.editable

    if (!editableConfig || !onEditingCellChange || !onCellValueChange) {
      return flexRender(cell.column.columnDef.cell, cell.getContext())
    }

    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === cell.column.id

    return (
      <EditableCell
        value={getValueByAccessorKey(row.original, cell.column.id)}
        config={editableConfig}
        isEditing={isEditing}
        onStartEdit={() => onEditingCellChange({ rowId: row.id, columnId: cell.column.id })}
        onCommit={(newValue) => {
          onCellValueChange({ rowId: row.id, columnId: cell.column.id, value: newValue, row: row.original })
          onEditingCellChange(null)
        }}
        onCancel={() => onEditingCellChange(null)}
        readContent={flexRender(cell.column.columnDef.cell, cell.getContext())}
      />
    )
  }, [editingCell, onEditingCellChange, onCellValueChange])

  // DnD: sensors and handler
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {}),
  )

  const reorderableColumnIds = useMemo(() => {
    return columnOrder.filter((id) => !NON_REORDERABLE_COLUMNS.has(id))
  }, [columnOrder])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!active || !over || active.id === over.id || !onColumnOrderChange) return

    const oldIndex = columnOrder.indexOf(active.id as string)
    const newIndex = columnOrder.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    onColumnOrderChange(arrayMove(columnOrder, oldIndex, newIndex))
  }, [columnOrder, onColumnOrderChange])

  // DraggableHeader: inner component with access to closure
  const DraggableHeader = useCallback(({
    header,
    headerWidth,
  }: {
    header: ReturnType<Table<TData>['getHeaderGroups']>[number]['headers'][number]
    headerWidth: number
  }) => {
    const isReorderable = enableColumnReorder && !NON_REORDERABLE_COLUMNS.has(header.column.id)
    const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({
      id: header.column.id,
      disabled: !isReorderable,
    })
    const meta = header.column.columnDef.meta as TableColumnMeta | undefined
    const align = meta?.headerAlign || 'left'

    const style: CSSProperties = {
      width: headerWidth,
      minWidth: headerWidth,
      opacity: isDragging ? 0.8 : 1,
      position: 'relative',
      transform: CSS.Translate.toString(transform),
      transition: 'width transform',
      whiteSpace: 'nowrap',
      zIndex: isDragging ? 1 : 0,
    }

    return (
      <th
        ref={setNodeRef}
        colSpan={header.colSpan}
        className={cn(
          'select-none border-b border-[color:var(--admin-border)] font-bold text-[color:var(--admin-text-secondary)]',
          densityConfig.headPadding,
          densityConfig.headerFontSize,
          align === 'left' && 'text-left',
          align === 'center' && 'text-center',
          align === 'right' && 'text-right',
          header.column.getCanSort() && 'cursor-pointer',
          isReorderable && !isDragging && 'cursor-grab',
          isDragging && 'cursor-grabbing',
        )}
        style={style}
        onClick={(event) => {
          if (justResizedRef.current) return
          header.column.getToggleSortingHandler()?.(event)
        }}
      >
        <div
          className={cn(
            'flex items-center',
            align === 'center' && 'justify-center',
            align === 'right' && 'justify-end',
          )}
          {...(isReorderable ? { ...attributes, ...listeners } : {})}
        >
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
          <SortIcon column={header.column} />
        </div>

        {header.column.getCanResize() && (
          <div
            onMouseDown={(event) => {
              event.stopPropagation()
              handleResizeStart(header, event)
            }}
            onTouchStart={(event) => {
              event.stopPropagation()
              handleResizeStart(header, event)
            }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
              'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
              'bg-slate-300 hover:bg-sky-500/70',
              header.column.getIsResizing() && 'bg-sky-500',
            )}
          />
        )}
      </th>
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [densityConfig, enableColumnReorder, handleResizeStart])

  // DragAlongCell: inner component for body cells during column reorder
  const DragAlongCell = useCallback(({
    cell,
    cellWidth,
    cellClassName,
    row,
  }: {
    cell: ReturnType<Row<TData>['getVisibleCells']>[number]
    cellWidth: number
    cellClassName: string
    row: Row<TData>
  }) => {
    const isEditingThisCell = editingCell?.rowId === row.id && editingCell?.columnId === cell.column.id
    const { isDragging, setNodeRef, transform } = useSortable({
      id: cell.column.id,
      disabled: !enableColumnReorder || NON_REORDERABLE_COLUMNS.has(cell.column.id) || isEditingThisCell,
    })

    const style: CSSProperties = {
      width: cellWidth,
      minWidth: cellWidth,
      opacity: isDragging ? 0.8 : 1,
      position: 'relative',
      transform: CSS.Translate.toString(transform),
      transition: 'width transform',
      zIndex: isDragging ? 1 : 0,
    }

    return (
      <td
        ref={setNodeRef}
        className={cellClassName}
        style={style}
      >
        {renderCellContent(cell, row)}
      </td>
    )
  }, [enableColumnReorder, editingCell, renderCellContent])

  const tableContent = (
    <div
      ref={tableContainerRef}
      className={cn(
        'relative flex-1 overflow-auto rounded-md border border-[color:var(--admin-border)] bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]',
        !autoHeight && 'min-h-0',
        className,
      )}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
        </div>
      )}

      <table
        className="caption-bottom border-collapse table-fixed"
        style={{ width: desktopTableLayout.totalWidth }}
      >
        <colgroup>
          {visibleLeafColumns.map((column) => {
            const width = desktopTableLayout.widths[column.id] ?? column.getSize()
            return <col key={column.id} style={{ width, minWidth: width }} />
          })}
        </colgroup>

        <thead className="sticky top-0 z-[1] bg-white/95 backdrop-blur-xl">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {enableColumnReorder ? (
                <SortableContext items={reorderableColumnIds} strategy={horizontalListSortingStrategy}>
                  {headerGroup.headers.map((header) => {
                    const headerWidth = getHeaderWidth(header, desktopTableLayout.widths)
                    return (
                      <DraggableHeader
                        key={header.id}
                        header={header}
                        headerWidth={headerWidth}
                      />
                    )
                  })}
                </SortableContext>
              ) : (
                headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as TableColumnMeta | undefined
                  const align = meta?.headerAlign || 'left'
                  const headerWidth = getHeaderWidth(header, desktopTableLayout.widths)

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'relative select-none whitespace-nowrap border-b border-[color:var(--admin-border)] font-bold text-[color:var(--admin-text-secondary)]',
                        densityConfig.headPadding,
                        densityConfig.headerFontSize,
                        align === 'left' && 'text-left',
                        align === 'center' && 'text-center',
                        align === 'right' && 'text-right',
                        header.column.getCanSort() && 'cursor-pointer',
                      )}
                      style={{
                        width: headerWidth,
                        minWidth: headerWidth,
                      }}
                      onClick={(event) => {
                        if (justResizedRef.current) return
                        header.column.getToggleSortingHandler()?.(event)
                      }}
                    >
                      <div className={cn(
                        'flex items-center',
                        align === 'center' && 'justify-center',
                        align === 'right' && 'justify-end',
                      )}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon column={header.column} />

                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={(event) => handleResizeStart(header, event)}
                            onTouchStart={(event) => handleResizeStart(header, event)}
                            onClick={(event) => event.stopPropagation()}
                            className={cn(
                              'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                              'bg-slate-300 hover:bg-sky-500/70',
                              header.column.getIsResizing() && 'bg-sky-500',
                            )}
                          />
                        )}
                      </div>
                    </th>
                  )
                })
              )}
            </tr>
          ))}
        </thead>

        <tbody>
          {rows.length === 0 && !loading ? (
            <tr>
              <td
                colSpan={visibleLeafColumns.length || 1}
                className={cn(
                  'py-8 text-center text-[color:var(--admin-text-faint)]',
                  densityConfig.fontSize,
                )}
              >
                {noDataText}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const rowClassName = getRowClassName?.({ row: row.original, id: row.id }) || ''

              return (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick({ row: row.original, id: row.id }) : undefined}
                  className={cn(
                    'border-b border-[color:var(--admin-border)] transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-sky-600/6' : 'hover:bg-slate-50/70',
                    rowClassName,
                  )}
                >
                  {enableColumnReorder ? (
                    <SortableContext items={reorderableColumnIds} strategy={horizontalListSortingStrategy}>
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as TableColumnMeta | undefined
                        const align = meta?.cellAlign || 'left'
                        const cellWidth = desktopTableLayout.widths[cell.column.id] ?? cell.column.getSize()

                        return (
                          <DragAlongCell
                            key={cell.id}
                            cell={cell}
                            cellWidth={cellWidth}
                            cellClassName={cn(
                              'align-middle text-[color:var(--admin-text)]',
                              densityConfig.cellPadding,
                              densityConfig.fontSize,
                              align === 'center' && 'text-center',
                              align === 'right' && 'text-right',
                            )}
                            row={row}
                          />
                        )
                      })}
                    </SortableContext>
                  ) : (
                    row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as TableColumnMeta | undefined
                      const align = meta?.cellAlign || 'left'
                      const cellWidth = desktopTableLayout.widths[cell.column.id] ?? cell.column.getSize()

                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            'align-middle text-[color:var(--admin-text)]',
                            densityConfig.cellPadding,
                            densityConfig.fontSize,
                            align === 'center' && 'text-center',
                            align === 'right' && 'text-right',
                          )}
                          style={{
                            width: cellWidth,
                            minWidth: cellWidth,
                          }}
                        >
                          {renderCellContent(cell, row)}
                        </td>
                      )
                    })
                  )}
                </tr>
              )
            })
          )}
        </tbody>

        {hasSummaryRow && (
          <tfoot className="border-t-2 border-[color:var(--admin-border-strong)] bg-slate-50/90 font-bold text-[color:var(--admin-text)]">
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as TableColumnMeta | undefined
                  const align = meta?.footerAlign || meta?.cellAlign || 'left'
                  const footerWidth = getHeaderWidth(header, desktopTableLayout.widths)

                  return (
                    <td
                      key={header.id}
                      className={cn(
                        'font-bold',
                        densityConfig.cellPadding,
                        densityConfig.fontSize,
                        align === 'center' && 'text-center',
                        align === 'right' && 'text-right',
                      )}
                      style={{
                        width: footerWidth,
                        minWidth: footerWidth,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.footer, header.getContext())}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tfoot>
        )}
      </table>
    </div>
  )

  if (enableColumnReorder) {
    return (
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        {tableContent}
      </DndContext>
    )
  }

  return tableContent
}
