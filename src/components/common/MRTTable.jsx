import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react'
import {
  MaterialReactTable,
  useMaterialReactTable
} from 'material-react-table'
import {MRT_Localization_KO} from 'material-react-table/locales/ko'
import {Box, TextField, Button, Stack, Paper, Typography, Pagination} from '@mui/material'
import {Search as SearchIcon, Refresh as RefreshIcon} from '@mui/icons-material'
import dynamic from 'next/dynamic'

const DateRangePicker = dynamic(() => import('./DateRangePicker'), {ssr: false})

const SPACING_CONFIG = {
  s: {
    filterPadding: 1, filterMarginBottom: 1, stackSpacing: 1,
    textFieldMinWidth: 160, paginationPadding: 0.5,
    headerFontSize: '0.8rem', bodyFontSize: '0.8rem',
    defaultDensity: 'compact',
    totalTypographyVariant: 'caption', buttonSize: 'small',
  },
  m: {
    filterPadding: 2, filterMarginBottom: 2, stackSpacing: 2,
    textFieldMinWidth: 200, paginationPadding: 1,
    headerFontSize: '0.875rem', bodyFontSize: '0.875rem',
    defaultDensity: 'comfortable',
    totalTypographyVariant: 'body2', buttonSize: 'medium',
  },
  l: {
    filterPadding: 3, filterMarginBottom: 3, stackSpacing: 3,
    textFieldMinWidth: 240, paginationPadding: 2,
    headerFontSize: '1rem', bodyFontSize: '1rem',
    defaultDensity: 'spacious',
    totalTypographyVariant: 'body1', buttonSize: 'medium',
  },
}

/**
 * Material React Table 기반 공통 테이블 컴포넌트
 *
 * @param {Object} props
 * @param {Array} props.columns - MRT 컬럼 정의 (accessorKey, header, Cell 등)
 * @param {Function} props.fetchData - 데이터 조회 함수 (searchRequest) => Promise<PageResponse> (서버 모드에서 필수)
 * @param {Array} props.searchFields - 검색 필드 정의 [{name, label, type}]
 * @param {Object} props.defaultSearchParams - 기본 검색 조건
 * @param {number} props.defaultPageSize - 기본 페이지 크기 (default: 10)
 * @param {'server'|'client'} props.paginationMode - 페이지네이션 모드 (default: 'server')
 * @param {Array} props.clientSideData - 클라이언트 모드에서 사용할 데이터
 * @param {boolean} props.hidePagination - 페이지네이션 숨김 여부 (default: false)
 * @param {Object} props.summaryRow - 합계 행 데이터 (Footer로 렌더링)
 * @param {Function} props.onRowClick - 행 클릭 핸들러
 * @param {Function} props.getRowClassName - 행 클래스명 지정 함수 (sx 스타일 반환)
 * @param {Object} props.tableSx - 테이블 커스텀 스타일
 * @param {boolean} props.autoHeight - 자동 높이 설정 (default: false)
 * @param {'s'|'m'|'l'} props.spacing - 컴포넌트 여백 크기 (default: 's')
 * @param {'compact'|'comfortable'|'spacious'} props.density - 테이블 밀도 (default: spacing에 연동)
 * @param {boolean} props.enableRowActions - 행 액션 활성화 (default: false)
 * @param {Function} props.renderRowActions - 행 액션 렌더링 함수
 * @param {string} props.positionActionsColumn - 액션 컬럼 위치 ('first' | 'last')
 */
export default function MRTTable({
  columns,
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
  tableSx = {},
  autoHeight = false,
  spacing = 's',
  density,
  enableRowActions = false,
  renderRowActions,
  positionActionsColumn = 'last'
}) {
  const spacingConfig = SPACING_CONFIG[spacing] || SPACING_CONFIG.s
  const resolvedDensity = density || spacingConfig.defaultDensity
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: hidePagination ? 100 : defaultPageSize,
  })
  const [sorting, setSorting] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchParams, setSearchParams] = useState(defaultSearchParams)
  const [searchInputs, setSearchInputs] = useState(defaultSearchParams)

  // Race condition 방지를 위한 요청 시퀀스 추적
  const requestRef = useRef(0)

  // 클라이언트 모드: clientSideData 변경 시 데이터 설정
  useEffect(() => {
    if (paginationMode !== 'client') return
    setData([...clientSideData])
    setRowCount(clientSideData.length)
    setLoading(false)
  }, [paginationMode, clientSideData])

  // 서버 모드: 페이지, 정렬, 검색 조건 변경 시 데이터 로드
  useEffect(() => {
    if (paginationMode !== 'server') return

    const currentRequest = ++requestRef.current

    const loadData = async () => {
      setLoading(true)
      try {
        // orderBy 변환: MRT sorting -> Backend OrderBy
        const orderBy = sorting.map(s => ({
          column: s.id,
          direction: s.desc ? 'DESCENDING' : 'ASCENDING'
        }))

        const response = await fetchData({
          page: pagination.pageIndex,
          pageSize: pagination.pageSize,
          orderBy,
          ...searchParams
        })

        // 최신 요청만 적용 (이전 요청 응답 무시)
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
  }, [paginationMode, pagination.pageIndex, pagination.pageSize, sorting, searchParams, fetchData])

  // 검색 입력 핸들러
  const handleSearchInputChange = (fieldName, value) => {
    setSearchInputs(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  // 검색 버튼 클릭
  const handleSearch = () => {
    setSearchParams(searchInputs)
    setPagination(prev => ({...prev, pageIndex: 0})) // 검색 시 첫 페이지로
  }

  // 검색 초기화
  const handleReset = () => {
    setSearchInputs(defaultSearchParams)
    setSearchParams(defaultSearchParams)
    setPagination(prev => ({...prev, pageIndex: 0}))
  }

  // Enter 키 검색
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 컬럼 정규화: headerAlign 기본값 center, 숫자 우측정렬
  const normalizedColumns = useMemo(() => {
    if (!Array.isArray(columns) || columns.length === 0) return columns

    return columns.map((col) => {
      if (!col) return col
      const next = {...col}

      // muiTableHeadCellProps로 헤더 스타일 설정
      if (!next.muiTableHeadCellProps) {
        next.muiTableHeadCellProps = {align: 'center'}
      }

      // 숫자형 기본 우측 정렬
      if (!next.muiTableBodyCellProps && (next.type === 'number' || next.accessorKey?.toLowerCase().includes('amount') || next.accessorKey?.toLowerCase().includes('count') || next.accessorKey?.toLowerCase().includes('hours') || next.accessorKey?.toLowerCase().includes('points'))) {
        next.muiTableBodyCellProps = {align: 'right'}
      }

      return next
    })
  }, [columns])

  // Footer 컬럼 생성 (summaryRow가 있을 때)
  const columnsWithFooter = useMemo(() => {
    if (!summaryRow) return normalizedColumns

    return normalizedColumns.map((col) => {
      if (!col) return col
      const key = col.accessorKey || col.id
      if (summaryRow[key] !== undefined) {
        // muiTableBodyCellProps에서 align 설정 가져오기
        const bodyAlign = col.muiTableBodyCellProps?.align
        return {
          ...col,
          // Footer 셀에도 동일한 정렬 적용
          muiTableFooterCellProps: {
            ...col.muiTableFooterCellProps,
            align: bodyAlign || col.muiTableFooterCellProps?.align || 'left'
          },
          Footer: () => (
            <Box sx={{fontWeight: 'bold'}}>
              {summaryRow[key]}
            </Box>
          )
        }
      }
      return col
    })
  }, [normalizedColumns, summaryRow])

  // MRT 테이블 설정
  const table = useMaterialReactTable({
    columns: columnsWithFooter,
    data,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableTopToolbar: false,
    enableBottomToolbar: !hidePagination,
    enablePagination: !hidePagination,
    enableSorting: true,
    enableRowSelection: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableHiding: false,

    // 서버/클라이언트 모드 설정
    manualPagination: paginationMode === 'server',
    manualSorting: paginationMode === 'server',
    rowCount: paginationMode === 'server' ? rowCount : undefined,

    // 상태
    state: {
      isLoading: loading,
      pagination,
      sorting,
      density: resolvedDensity
    },

    // 이벤트 핸들러
    onPaginationChange: setPagination,
    onSortingChange: setSorting,

    // 행 액션
    enableRowActions,
    renderRowActions,
    positionActionsColumn,

    // 행 클릭 및 스타일
    muiTableBodyRowProps: ({row}) => ({
      onClick: onRowClick ? (event) => onRowClick({row: row.original, id: row.id}) : undefined,
      sx: {
        cursor: onRowClick ? 'pointer' : 'default',
        ...(getRowClassName ? getRowClassName({row: row.original, id: row.id}) : {})
      }
    }),

    // 스타일링
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: 0,
        ...tableSx
      }
    },
    muiTableContainerProps: {
      sx: autoHeight ? {} : {maxHeight: '100%'}
    },
    muiTableProps: {
      sx: {
        '& .MuiTableHead-root': {
          backgroundColor: '#f5f5f5',
        },
        '& .MuiTableHead-root .MuiTableCell-root': {
          fontWeight: 700,
          fontSize: spacingConfig.headerFontSize,
        },
        '& .MuiTableBody-root .MuiTableCell-root': {
          fontSize: spacingConfig.bodyFontSize,
        },
        '& .MuiTableBody-root .MuiTableRow-root:hover': {
          backgroundColor: '#f5f5f5 !important',
        },
        '& .MuiTableFooter-root': {
          backgroundColor: '#f5f5f5',
        },
        '& .MuiTableFooter-root .MuiTableCell-root': {
          fontWeight: 700,
          borderTop: '2px solid rgba(224, 224, 224, 1)',
        }
      }
    },
    muiPaginationProps: {
      showRowsPerPage: true,
      rowsPerPageOptions: [10, 25, 50, 100]
    },

    // 페이지네이션 렌더링
    renderBottomToolbar: hidePagination ? () => null : ({table}) => {
      const {pageIndex, pageSize} = table.getState().pagination
      const totalRows = paginationMode === 'server' ? rowCount : data.length
      const pageCount = Math.ceil(totalRows / pageSize)

      return (
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: spacingConfig.paginationPadding}}>
          <Typography variant={spacingConfig.totalTypographyVariant} sx={{color: 'text.secondary'}}>
            총 {totalRows.toLocaleString('ko-KR')}개
          </Typography>
          <Pagination
            count={pageCount}
            page={pageIndex + 1}
            onChange={(e, newPage) => setPagination(prev => ({...prev, pageIndex: newPage - 1}))}
            color="primary"
            size={spacingConfig.buttonSize === 'small' ? 'small' : 'medium'}
            showFirstButton
            showLastButton
          />
        </Box>
      )
    },

    // 한국어 로케일
    localization: MRT_Localization_KO
  })

  return (
    <Box sx={{height: '100%', width: '100%', display: 'flex', flexDirection: 'column'}}>
      {/* 검색 필터 */}
      {searchFields.length > 0 && (
        <Paper sx={{p: spacingConfig.filterPadding, mb: spacingConfig.filterMarginBottom}}>
          <Stack direction="row" spacing={spacingConfig.stackSpacing} flexWrap="wrap" useFlexGap>
            {searchFields.map(field => {
              if (field.type === 'dateRange') {
                return (
                  <DateRangePicker
                    key={field.fromName}
                    fromValue={searchInputs[field.fromName] || ''}
                    toValue={searchInputs[field.toName] || ''}
                    onFromChange={(val) => handleSearchInputChange(field.fromName, val)}
                    onToChange={(val) => handleSearchInputChange(field.toName, val)}
                    fromLabel={field.fromLabel}
                    toLabel={field.toLabel}
                    size="small"
                  />
                )
              }
              return (
                <TextField
                  key={field.name}
                  label={field.label}
                  size="small"
                  type={field.type || 'text'}
                  value={searchInputs[field.name] || ''}
                  onChange={(e) => handleSearchInputChange(field.name, e.target.value)}
                  onKeyPress={handleKeyPress}
                  sx={{minWidth: spacingConfig.textFieldMinWidth}}
                />
              )
            })}
            <Button
              variant="contained"
              size={spacingConfig.buttonSize}
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              검색
            </Button>
            <Button
              variant="outlined"
              size={spacingConfig.buttonSize}
              startIcon={<RefreshIcon />}
              onClick={handleReset}
            >
              초기화
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Material React Table */}
      <Paper sx={{flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0}}>
        <MaterialReactTable table={table} />
      </Paper>
    </Box>
  )
}
