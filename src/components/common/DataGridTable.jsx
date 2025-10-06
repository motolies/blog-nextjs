import React, {useState, useEffect, useRef, useCallback} from 'react'
import {DataGrid, useGridApiContext, useGridSelector, gridPageCountSelector} from '@mui/x-data-grid'
import {Box, TextField, Button, Stack, Paper, Typography, Pagination} from '@mui/material'
import {Search as SearchIcon, Refresh as RefreshIcon} from '@mui/icons-material'

/**
 * 천 단위 콤마가 적용된 커스텀 페이지네이션
 */
function CustomPagination() {
  const apiRef = useGridApiContext()
  const pageCount = useGridSelector(apiRef, gridPageCountSelector)
  const {page, pageSize} = apiRef.current.state.pagination.paginationModel
  const rowCount = apiRef.current.state.pagination.rowCount

  return (
    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1}}>
      <Typography variant="body2" sx={{color: 'text.secondary'}}>
        총 {rowCount.toLocaleString('ko-KR')}개
      </Typography>
      <Pagination
        count={pageCount}
        page={page + 1}
        onChange={(e, newPage) => apiRef.current.setPage(newPage - 1)}
        color="primary"
        showFirstButton
        showLastButton
      />
    </Box>
  )
}

/**
 * MUI DataGrid 기반 공통 테이블 컴포넌트
 *
 * @param {Object} props
 * @param {Array} props.columns - DataGrid 컬럼 정의
 * @param {Function} props.fetchData - 데이터 조회 함수 (searchRequest) => Promise<PageResponse>
 * @param {Array} props.searchFields - 검색 필드 정의 [{name, label, type}]
 * @param {Object} props.defaultSearchParams - 기본 검색 조건
 * @param {number} props.defaultPageSize - 기본 페이지 크기 (default: 10)
 */
export default function DataGridTable({
  columns,
  fetchData,
  searchFields = [],
  defaultSearchParams = {},
  defaultPageSize = 10
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: defaultPageSize,
  })
  const [sortModel, setSortModel] = useState([])
  const [rowCount, setRowCount] = useState(0)
  const [searchParams, setSearchParams] = useState(defaultSearchParams)
  const [searchInputs, setSearchInputs] = useState(defaultSearchParams)

  // Race condition 방지를 위한 요청 시퀀스 추적
  const requestRef = useRef(0)

  // 페이지, 정렬, 검색 조건 변경 시 데이터 로드
  useEffect(() => {
    const currentRequest = ++requestRef.current

    const loadData = async () => {
      setLoading(true)
      try {
        // orderBy 변환: MUI sortModel -> Backend OrderBy
        const orderBy = sortModel.map(s => ({
          column: s.field,
          direction: s.sort === 'asc' ? 'ASCENDING' : 'DESCENDING'
        }))

        const response = await fetchData({
          page: paginationModel.page,
          pageSize: paginationModel.pageSize,
          orderBy,
          ...searchParams
        })

        // 최신 요청만 적용 (이전 요청 응답 무시)
        if (currentRequest === requestRef.current) {
          setRows(response.list || [])
          setRowCount(response.totalCount || 0)
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error)
        if (currentRequest === requestRef.current) {
          setRows([])
          setRowCount(0)
        }
      } finally {
        if (currentRequest === requestRef.current) {
          setLoading(false)
        }
      }
    }

    loadData()
  }, [paginationModel.page, paginationModel.pageSize, sortModel, searchParams])

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
    setPaginationModel(prev => ({...prev, page: 0})) // 검색 시 첫 페이지로
  }

  // 검색 초기화
  const handleReset = () => {
    setSearchInputs(defaultSearchParams)
    setSearchParams(defaultSearchParams)
    setPaginationModel(prev => ({...prev, page: 0}))
  }

  // Enter 키 검색
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // flex 컬럼이 하나도 없으면 마지막 컬럼에 flex:1 적용해 남는 폭을 흡수
  const normalizedColumns = React.useMemo(() => {
    if (!Array.isArray(columns) || columns.length === 0) return columns

    // 1) 정렬 일관성: headerAlign 기본값을 center로 설정, 숫자는 기본 우측정렬
    const withAlign = columns.map((col) => {
      if (!col) return col
      const next = { ...col }
      // 숫자형 기본 우측 정렬(align 미지정 시)
      if (!next.align && next.type === 'number') {
        next.align = 'right'
      }
      // headerAlign 미지정 시 기본값을 'center'로 설정
      if (!next.headerAlign) {
        next.headerAlign = 'center'
      }
      return next
    })

    // 2) flex 컬럼이 하나도 없으면 마지막 컬럼에 flex:1 적용해 남는 폭 흡수
    const hasFlex = withAlign.some(col => col && typeof col.flex === 'number' && col.flex > 0)
    if (hasFlex) return withAlign
    const clone = withAlign.slice()
    const last = { ...clone[clone.length - 1] }
    if (!last.minWidth) {
      last.minWidth = last.width || 160
    }
    last.flex = 1
    delete last.width // flex 우선 적용
    clone[clone.length - 1] = last
    return clone
  }, [columns])

  return (
    <Box sx={{height: '100%', width: '100%', display: 'flex', flexDirection: 'column'}}>
      {/* 검색 필터 */}
      {searchFields.length > 0 && (
        <Paper sx={{p: 2, mb: 2}}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {searchFields.map(field => (
              <TextField
                key={field.name}
                label={field.label}
                size="small"
                type={field.type || 'text'}
                value={searchInputs[field.name] || ''}
                onChange={(e) => handleSearchInputChange(field.name, e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{minWidth: 200}}
              />
            ))}
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              검색
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
            >
              초기화
            </Button>
          </Stack>
        </Paper>
      )}

      {/* DataGrid */}
      <Paper sx={{flex: 1, display: 'flex', minHeight: 0}}>
        <DataGrid
          rows={rows}
          columns={normalizedColumns}
          loading={loading}
          rowCount={rowCount}
          paginationModel={paginationModel}
          paginationMode="server"
          sortingMode="server"
          onPaginationModelChange={setPaginationModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          disableColumnReorder={true}
          columnBuffer={3}
          disableExtendRowFullWidth
          scrollbarSize={12}
          slots={{
            pagination: CustomPagination,
          }}
          sx={{
            width: '100%',
            // 수평 스크롤 표시 상태 변화에도 레이아웃 안정화
            scrollbarGutter: 'stable both-edges',
            '& .MuiDataGrid-cell': {
              fontSize: '0.875rem',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              fontSize: '0.875rem',
            },
            // 헤더 텍스트 볼드 처리 (실제 텍스트 요소)
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
            },
            // Cell 클릭 시 Row 전체에 연한 파랑 배경 (Cell보다 연한 색상)
            '& .MuiDataGrid-row': {
              '&:has(.MuiDataGrid-cell:focus), &:has(.MuiDataGrid-cell:focus-within)': {
                backgroundColor: '#e2f1fd',
              },
            },
            // Cell 포커스 시 진한 파랑 배경
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
              backgroundColor: '#bae0fd',
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        />
      </Paper>
    </Box>
  )
}
