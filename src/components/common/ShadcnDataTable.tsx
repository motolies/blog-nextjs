import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DynamicSearchFields from './DynamicSearchFields'
import DataTableCore, {
  DATA_TABLE_DENSITY_CONFIG,
  DEFAULT_COLUMN_WIDTH,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  buildDataTableColumns,
  type DataTableColumn,
  type DataTableDensity,
  type DataTableEditableConfig,
  type EditingCell,
} from './DataTableCore'
import DataTableToolbar from './DataTableToolbar'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnOrderState,
  type ColumnSizingState,
  type PaginationState,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type { DataTableColumn, DataTableEditableConfig } from './DataTableCore'

const HIDDEN_PAGE_SIZE = 100000
const DESKTOP_PAGINATION_MEDIA_QUERY = '(min-width: 640px)'
const MOBILE_PAGE_BUTTON_BUDGET = 5
const MIN_DESKTOP_PAGE_BUTTON_BUDGET = 5
const MAX_DESKTOP_PAGE_BUTTON_BUDGET = 15
const PAGINATION_SLOT_WIDTH = 32
const PAGINATION_RESERVED_SLOT_COUNT = 6

function clampToOddBudget(value: number, min: number, max: number): number {
  const bounded = Math.max(min, Math.min(max, value))
  if (bounded % 2 === 1) {
    return bounded
  }
  return Math.max(min, bounded - 1)
}

function getResponsivePageButtonBudget(containerWidth: number): number {
  if (containerWidth <= 0) {
    return MIN_DESKTOP_PAGE_BUTTON_BUDGET
  }

  const rawBudget = Math.floor(containerWidth / PAGINATION_SLOT_WIDTH) - PAGINATION_RESERVED_SLOT_COUNT
  return clampToOddBudget(
    rawBudget,
    MIN_DESKTOP_PAGE_BUTTON_BUDGET,
    MAX_DESKTOP_PAGE_BUTTON_BUDGET,
  )
}

function buildPageWindow(
  currentPage: number,
  totalPages: number,
  visiblePageButtonBudget: number,
): (number | '...')[] {
  if (totalPages <= 1) {
    return [1]
  }

  const boundedBudget = Math.max(visiblePageButtonBudget, MOBILE_PAGE_BUTTON_BUDGET)
  if (totalPages <= boundedBudget) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const interiorBudget = boundedBudget - 2
  let start = Math.max(2, currentPage - Math.floor(interiorBudget / 2))
  let end = start + interiorBudget - 1

  if (end > totalPages - 1) {
    end = totalPages - 1
    start = Math.max(2, end - interiorBudget + 1)
  }

  const pageWindow: (number | '...')[] = [1]

  if (start > 2) {
    pageWindow.push('...')
  }

  for (let page = start; page <= end; page += 1) {
    pageWindow.push(page)
  }

  if (end < totalPages - 1) {
    pageWindow.push('...')
  }

  pageWindow.push(totalPages)

  return pageWindow
}

export interface SearchField {
  name?: string
  label?: string
  type?: string
  pinned?: boolean
  options?: { value: string | number | boolean; label: string }[]
  fromName?: string
  toName?: string
  fromLabel?: string
  toLabel?: string
  defaultValue?: unknown
}

export interface OrderBy {
  column: string
  direction: 'ASCENDING' | 'DESCENDING'
}

export interface SearchRequest {
  page: number
  pageSize: number
  orderBy: OrderBy[]
  [key: string]: unknown
}

export interface PageResponse<T> {
  list: T[]
  totalCount: number
}

export interface ShadcnDataTableProps<TData extends RowData> {
  columns: DataTableColumn<TData>[]
  fetchData?: (params: SearchRequest) => Promise<PageResponse<TData>>
  searchFields?: SearchField[]
  defaultSearchParams?: Record<string, unknown>
  defaultPageSize?: number
  paginationMode?: 'server' | 'client'
  clientSideData?: TData[]
  hidePagination?: boolean
  summaryRow?: Record<string, unknown> | null
  onRowClick?: (params: { row: TData; id: string }) => void
  getRowClassName?: (params: { row: TData; id: string }) => string
  autoHeight?: boolean
  density?: DataTableDensity
  enableRowActions?: boolean
  renderRowActions?: (props: { row: Row<TData> }) => ReactNode
  positionActionsColumn?: 'first' | 'last'
  actionsColumnSize?: number
  enableDynamicSearch?: boolean
  mobileCardView?: boolean
  // Column reordering
  enableColumnReorder?: boolean
  // Row selection
  enableRowSelection?: boolean
  onRowSelectionChange?: (selectedRows: TData[]) => void
  renderSelectionToolbar?: (props: {
    selectedRows: TData[]
    selectedCount: number
    clearSelection: () => void
    table: Table<TData>
  }) => ReactNode
  // Toolbar
  enableToolbar?: boolean
  onAddRow?: () => void
  onSaveAll?: (data: TData[]) => void | Promise<void>
  renderToolbar?: (props: {
    table: Table<TData>
    data: TData[]
    addRow: (() => void) | undefined
    saveAll: (() => void) | undefined
  }) => ReactNode
  getRowId?: (row: TData, index: number) => string
  isRowModified?: (row: TData) => boolean
  // Inline editing
  onCellEdit?: (params: { rowId: string; columnId: string; value: unknown; row: TData }) => void
}

interface TableColumnMeta {
  headerAlign?: 'left' | 'center' | 'right'
  cellAlign?: 'left' | 'center' | 'right'
  footerAlign?: 'left' | 'center' | 'right'
  grow?: boolean
  mobilePrimary?: boolean
  mobileHidden?: boolean
  mobileLabel?: string
  editable?: DataTableEditableConfig | false
}

export default function ShadcnDataTable<TData extends RowData>({
  columns: columnsProp,
  fetchData,
  searchFields = [],
  defaultSearchParams = {},
  defaultPageSize = 10,
  paginationMode = 'server',
  clientSideData = [],
  hidePagination = false,
  summaryRow = null,
  onRowClick,
  getRowClassName,
  autoHeight = false,
  density = 'comfortable',
  enableRowActions = false,
  renderRowActions,
  positionActionsColumn = 'last',
  actionsColumnSize = 80,
  enableDynamicSearch = false,
  mobileCardView = true,
  enableColumnReorder = true,
  enableRowSelection = false,
  onRowSelectionChange,
  renderSelectionToolbar,
  enableToolbar = false,
  onAddRow,
  onSaveAll,
  renderToolbar,
  getRowId,
  isRowModified,
  onCellEdit,
}: ShadcnDataTableProps<TData>) {
  const densityConfig = DATA_TABLE_DENSITY_CONFIG[density]
  const showMobileCards = mobileCardView
  const [data, setData] = useState<TData[]>([])
  const [loading, setLoading] = useState(false)
  const [rowCount, setRowCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [manualWidths, setManualWidths] = useState<ColumnSizingState>({})
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: hidePagination ? HIDDEN_PAGE_SIZE : defaultPageSize,
  })
  const [searchParams, setSearchParams] = useState<Record<string, unknown>>(defaultSearchParams)
  const [searchInputs, setSearchInputs] = useState<Record<string, unknown>>(defaultSearchParams)
  const [paginationViewportWidth, setPaginationViewportWidth] = useState(0)
  const [isDesktopPagination, setIsDesktopPagination] = useState(false)
  const requestRef = useRef(0)
  const paginationViewportRef = useRef<HTMLDivElement | null>(null)

  const handleSearchInputChange = useCallback((fieldName: string, value: unknown) => {
    setSearchInputs((previous) => ({ ...previous, [fieldName]: value }))
  }, [])

  const handleSearch = useCallback(() => {
    setSearchParams(searchInputs)
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }, [searchInputs])

  const handleReset = useCallback(() => {
    setSearchInputs(defaultSearchParams)
    setSearchParams(defaultSearchParams)
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  useEffect(() => {
    if (paginationMode !== 'server' || !fetchData) return

    const currentRequest = ++requestRef.current

    const loadData = async () => {
      setLoading(true)
      try {
        const orderBy: OrderBy[] = sorting.map((sort) => ({
          column: sort.id,
          direction: sort.desc ? 'DESCENDING' : 'ASCENDING',
        }))

        const response = await fetchData({
          page: pagination.pageIndex,
          pageSize: pagination.pageSize,
          orderBy,
          ...searchParams,
        })

        if (currentRequest === requestRef.current) {
          setData(response.list || [])
          setRowCount(response.totalCount || 0)
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error)
        if (currentRequest === requestRef.current) {
          setData([])
          setRowCount(0)
        }
      } finally {
        if (currentRequest === requestRef.current) {
          setLoading(false)
        }
      }
    }

    loadData()
  }, [fetchData, pagination.pageIndex, pagination.pageSize, paginationMode, searchParams, sorting])

  useEffect(() => {
    if (paginationMode !== 'client') return

    const totalPages = Math.max(Math.ceil(clientSideData.length / pagination.pageSize), 1)
    if (pagination.pageIndex > totalPages - 1) {
      setPagination((previous) => ({
        ...previous,
        pageIndex: totalPages - 1,
      }))
    }
  }, [clientSideData.length, pagination.pageIndex, pagination.pageSize, paginationMode])

  useEffect(() => {
    if (hidePagination || typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(DESKTOP_PAGINATION_MEDIA_QUERY)
    const updateDesktopPagination = () => {
      setIsDesktopPagination((previous) => (
        previous === mediaQuery.matches ? previous : mediaQuery.matches
      ))
    }

    updateDesktopPagination()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateDesktopPagination)
      return () => mediaQuery.removeEventListener('change', updateDesktopPagination)
    }

    mediaQuery.addListener(updateDesktopPagination)
    return () => mediaQuery.removeListener(updateDesktopPagination)
  }, [hidePagination])

  useEffect(() => {
    if (hidePagination) return

    const viewport = paginationViewportRef.current
    if (!viewport) return

    const updateViewportWidth = (nextWidth: number) => {
      const normalizedWidth = Math.max(Math.floor(nextWidth), 0)
      setPaginationViewportWidth((previous) => (
        previous === normalizedWidth ? previous : normalizedWidth
      ))
    }

    updateViewportWidth(viewport.clientWidth)

    if (typeof ResizeObserver === 'undefined') return

    const resizeObserver = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? viewport.clientWidth
      updateViewportWidth(nextWidth)
    })

    resizeObserver.observe(viewport)
    return () => resizeObserver.disconnect()
  }, [hidePagination])

  const columns = useMemo(() => {
    let adapted = buildDataTableColumns<TData>(columnsProp, summaryRow)

    if (enableRowSelection) {
      const selectColumn: ColumnDef<TData> = {
        id: '__select__',
        size: 40,
        minSize: 40,
        maxSize: 40,
        enableSorting: false,
        enableResizing: false,
        enableHiding: false,
        header: ({ table: t }) => (
          <Checkbox
            checked={t.getIsAllPageRowsSelected() ? true : t.getIsSomePageRowsSelected() ? 'indeterminate' : false}
            onCheckedChange={(value) => t.toggleAllPageRowsSelected(!!value)}
            aria-label="전체 선택"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
            aria-label="행 선택"
          />
        ),
        meta: {
          headerAlign: 'center',
          cellAlign: 'center',
          footerAlign: 'center',
          grow: false,
          mobileHidden: true,
          mobileLabel: '선택',
        } satisfies TableColumnMeta,
      }
      adapted = [selectColumn, ...adapted]
    }

    if (enableRowActions && renderRowActions) {
      const actionsColumn: ColumnDef<TData> = {
        id: '__actions__',
        header: '',
        size: actionsColumnSize,
        minSize: actionsColumnSize,
        maxSize: actionsColumnSize,
        enableSorting: false,
        enableResizing: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            {renderRowActions({ row })}
          </div>
        ),
        meta: {
          headerAlign: 'center',
          cellAlign: 'center',
          footerAlign: 'center',
          grow: false,
          mobileHidden: true,
          mobileLabel: '작업',
        } satisfies TableColumnMeta,
      }

      return positionActionsColumn === 'first'
        ? [actionsColumn, ...adapted]
        : [...adapted, actionsColumn]
    }

    return adapted
  }, [columnsProp, enableRowActions, enableRowSelection, positionActionsColumn, renderRowActions, summaryRow])

  const tableData = paginationMode === 'client' ? clientSideData : data
  const totalRows = paginationMode === 'server' ? rowCount : clientSideData.length
  const pageCount = Math.max(Math.ceil(totalRows / pagination.pageSize), 1)

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      pagination,
      columnVisibility,
      columnSizing: manualWidths,
      ...(enableColumnReorder ? { columnOrder } : {}),
      ...(enableRowSelection ? { rowSelection } : {}),
    },
    manualPagination: paginationMode === 'server',
    manualSorting: paginationMode === 'server',
    pageCount: paginationMode === 'server' ? pageCount : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: paginationMode === 'client' ? getSortedRowModel() : undefined,
    getPaginationRowModel: paginationMode === 'client' ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setManualWidths,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    defaultColumn: {
      size: DEFAULT_COLUMN_WIDTH,
      minSize: MIN_COLUMN_WIDTH,
      maxSize: MAX_COLUMN_WIDTH,
    },
    ...(enableColumnReorder ? { onColumnOrderChange: setColumnOrder } : {}),
    ...(enableRowSelection ? {
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
    } : {}),
    ...(getRowId ? { getRowId } : {}),
  })

  // columnOrder 초기화
  useEffect(() => {
    if (!enableColumnReorder) return
    const ids = columns.map((col) => col.id ?? '').filter(Boolean)
    setColumnOrder((prev) => {
      if (prev.length > 0 && prev.length === ids.length && prev.every((id, i) => ids.includes(id))) {
        return prev
      }
      return ids
    })
  }, [columns, enableColumnReorder])

  // rowSelection 변경 시 외부 콜백 호출
  useEffect(() => {
    if (!enableRowSelection || !onRowSelectionChange) return
    const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
    onRowSelectionChange(selectedRows)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection])

  // 페이지 전환 시 편집 모드 해제
  useEffect(() => {
    setEditingCell(null)
  }, [pagination.pageIndex])

  const handleCellValueChange = useCallback((params: {
    rowId: string
    columnId: string
    value: unknown
    row: TData
  }) => {
    onCellEdit?.(params)
  }, [onCellEdit])

  const rows = table.getRowModel().rows
  const currentPage = pagination.pageIndex + 1
  const totalPages = paginationMode === 'client'
    ? Math.max(table.getPageCount(), 1)
    : pageCount
  const visiblePageButtonBudget = useMemo(() => {
    if (!isDesktopPagination) {
      return MOBILE_PAGE_BUTTON_BUDGET
    }

    return getResponsivePageButtonBudget(paginationViewportWidth)
  }, [isDesktopPagination, paginationViewportWidth])

  const goToPage = useCallback((page: number) => {
    setPagination((previous) => ({
      ...previous,
      pageIndex: Math.min(Math.max(0, page - 1), totalPages - 1),
    }))
  }, [totalPages])

  const pageNumbers = useMemo(() => {
    return buildPageWindow(currentPage, totalPages, visiblePageButtonBudget)
  }, [currentPage, totalPages, visiblePageButtonBudget])

  const searchSpacingConfig = {
    filterPadding: densityConfig.filterPadding,
    filterMarginBottom: densityConfig.filterMarginBottom,
    stackSpacing: densityConfig.stackSpacing,
    textFieldMinWidth: densityConfig.textFieldMinWidth,
    paginationPadding: densityConfig.paginationPadding,
    headerFontSize: densityConfig.headerFontSizeMui,
    bodyFontSize: densityConfig.bodyFontSizeMui,
    defaultDensity: density,
    totalTypographyVariant: densityConfig.totalTypographyVariant,
    buttonSize: densityConfig.buttonSize,
  }

  return (
    <div className="flex h-full w-full flex-col">
      {searchFields.length > 0 && (
        <DynamicSearchFields
          searchFields={searchFields as any[]}
          searchInputs={searchInputs}
          defaultSearchParams={defaultSearchParams}
          onInputChange={handleSearchInputChange}
          onSearch={handleSearch}
          onReset={handleReset}
          onKeyPress={handleKeyPress}
          spacingConfig={searchSpacingConfig}
          enableDynamic={enableDynamicSearch}
        />
      )}

      {(enableToolbar || (enableRowSelection && Object.keys(rowSelection).length > 0)) && (
        <DataTableToolbar
          enableRowSelection={enableRowSelection}
          selectedRows={table.getSelectedRowModel().rows.map((r) => r.original)}
          selectedCount={Object.keys(rowSelection).length}
          clearSelection={() => setRowSelection({})}
          renderSelectionToolbar={renderSelectionToolbar}
          onAddRow={onAddRow}
          onSaveAll={onSaveAll}
          data={tableData}
          renderToolbar={renderToolbar}
          table={table}
          density={density}
        />
      )}

      <div className="mb-1 flex justify-end">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
              <Settings2 className="h-3 w-3" />
              컬럼 설정
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="max-h-80 w-48 overflow-auto">
            <DropdownMenuLabel className="text-xs">컬럼 표시 설정</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide() && column.id !== '__actions__' && column.id !== '__select__')
              .map((column) => {
                const headerLabel = typeof column.columnDef.header === 'string'
                  ? column.columnDef.header.trim()
                  : ''
                const label = headerLabel || column.id
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="text-xs"
                    checked={column.getIsVisible()}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showMobileCards && (
        <div className="md:hidden">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center rounded-[1.15rem] border border-[color:var(--admin-border)] bg-white/72 dark:bg-[rgba(40,44,52,0.72)]">
              <Loader2 className="h-6 w-6 animate-spin text-sky-600 dark:text-[#61afef]" />
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-[1.15rem] border border-[color:var(--admin-border)] bg-white/84 px-4 py-8 text-center text-sm text-[color:var(--admin-text-faint)] dark:bg-[rgba(40,44,52,0.84)]">
              데이터가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => {
                const rowClassName = getRowClassName?.({ row: row.original, id: row.id }) || ''
                const visibleCells = row.getVisibleCells()
                const actionCell = visibleCells.find((cell) => cell.column.id === '__actions__')
                const contentCells = visibleCells.filter((cell) => {
                  const meta = cell.column.columnDef.meta as TableColumnMeta | undefined
                  return cell.column.id !== '__actions__' && !meta?.mobileHidden
                })
                const primaryCell =
                  contentCells.find((cell) => (cell.column.columnDef.meta as TableColumnMeta | undefined)?.mobilePrimary) ||
                  contentCells[0]
                const secondaryCells = contentCells.filter((cell) => cell.id !== primaryCell?.id)

                return (
                  <article
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick({ row: row.original, id: row.id }) : undefined}
                    className={cn(
                      'rounded-[1.15rem] border border-[color:var(--admin-border)] bg-white/92 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] dark:bg-[rgba(40,44,52,0.92)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.15)]',
                      onRowClick && 'cursor-pointer',
                      rowClassName,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {primaryCell ? (
                          <>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--admin-text-faint)]">
                              {((primaryCell.column.columnDef.meta as TableColumnMeta | undefined)?.mobileLabel) || '항목'}
                            </p>
                            <div className="mt-1 text-sm font-semibold text-[color:var(--admin-text)] [&_div]:text-inherit [&_span]:text-inherit">
                              {flexRender(primaryCell.column.columnDef.cell, primaryCell.getContext())}
                            </div>
                          </>
                        ) : null}
                      </div>

                      {actionCell ? (
                        <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
                          {flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
                        </div>
                      ) : null}
                    </div>

                    {secondaryCells.length > 0 ? (
                      <dl className="mt-4 space-y-2">
                        {secondaryCells.map((cell) => {
                          const meta = cell.column.columnDef.meta as TableColumnMeta | undefined
                          return (
                            <div
                              key={cell.id}
                              className="grid grid-cols-[6.25rem_minmax(0,1fr)] items-start gap-3 rounded-2xl bg-slate-50/80 px-3 py-2 dark:bg-[rgba(33,37,43,0.8)]"
                            >
                              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--admin-text-faint)]">
                                {meta?.mobileLabel || '값'}
                              </dt>
                              <dd className="min-w-0 text-sm text-[color:var(--admin-text-secondary)] [&_div]:text-inherit [&_span]:text-inherit">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </dd>
                            </div>
                          )
                        })}
                      </dl>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      <DataTableCore
        table={table}
        rows={rows}
        loading={loading}
        density={density}
        autoHeight={autoHeight}
        onRowClick={onRowClick}
        getRowClassName={getRowClassName}
        className={showMobileCards ? 'hidden md:block' : undefined}
        enableColumnReorder={enableColumnReorder}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        editingCell={editingCell}
        onEditingCellChange={onCellEdit ? setEditingCell : undefined}
        onCellValueChange={onCellEdit ? handleCellValueChange : undefined}
      />

      {!hidePagination && (
        <div className="mt-1 flex flex-col gap-2 py-1 md:flex-row md:items-center md:justify-between">
          <span className="shrink-0 text-xs text-[color:var(--admin-text-muted)]">
            총 {totalRows.toLocaleString('ko-KR')}개
          </span>
          <div
            ref={paginationViewportRef}
            className="flex min-w-0 justify-center sm:w-full sm:justify-end md:w-auto md:flex-1"
          >
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => goToPage(1)}
                disabled={currentPage <= 1}
              >
                <ChevronFirst className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              {pageNumbers.map((page, index) => (
                page === '...'
                  ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-1 text-xs text-[color:var(--admin-text-faint)]"
                      >
                        …
                      </span>
                    )
                  : (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="icon"
                        className="h-7 w-7 text-xs"
                        onClick={() => goToPage(page as number)}
                      >
                        {page}
                      </Button>
                    )
              ))}

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage >= totalPages}
              >
                <ChevronLast className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
