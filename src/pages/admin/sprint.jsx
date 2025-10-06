import React, { useState, useEffect, useCallback } from 'react'
import {
    Box,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    CircularProgress
} from '@mui/material'
import ReactECharts from 'echarts-for-react'
import { useSnackbar } from 'notistack'
import service from '../../service'
import DataGridTable from '../../components/common/DataGridTable'

export default function SprintPage() {
    const { enqueueSnackbar } = useSnackbar()
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [sprintData, setSprintData] = useState(null)
    const [loading, setLoading] = useState(true)

    // 스프린트 상세 관련 상태
    const [selectedSprint, setSelectedSprint] = useState(null)
    const [selectedWorker, setSelectedWorker] = useState(null)
    const [sprintDetailData, setSprintDetailData] = useState([])
    const [detailLoading, setDetailLoading] = useState(false)

    // 이슈 작업로그 관련 상태
    const [selectedIssue, setSelectedIssue] = useState(null)
    const [issueWorklogData, setIssueWorklogData] = useState([])
    const [worklogLoading, setWorklogLoading] = useState(false)

    // 과거 3년부터 올해까지의 년도 목록 생성
    const getYearOptions = () => {
        const currentYear = new Date().getFullYear()
        const years = []
        for (let i = 0; i < 4; i++) {
            years.push(currentYear - i)
        }
        return years
    }

    // 스프린트 데이터 로드
    const loadSprintData = useCallback(async (year) => {
        try {
            setLoading(true)
            const response = await service.sprint.getSprintData(year)
            setSprintData(response.data)
        } catch (error) {
            console.error('스프린트 데이터 로드 실패:', error)
            enqueueSnackbar('스프린트 데이터를 불러오는데 실패했습니다.', { variant: 'error' })
        } finally {
            setLoading(false)
        }
    }, [enqueueSnackbar])

    useEffect(() => {
        loadSprintData(selectedYear)
    }, [selectedYear, loadSprintData])

    // 스프린트 상세 데이터 로드
    const loadSprintDetail = useCallback(async (sprintName, worker = null) => {
        try {
            setDetailLoading(true)
            const response = await service.sprint.getSprintDetail(sprintName, worker)
            setSprintDetailData(response.data || [])
            setSelectedSprint(sprintName)
            setSelectedWorker(worker)
        } catch (error) {
            console.error('스프린트 상세 데이터 로드 실패:', error)
            enqueueSnackbar('스프린트 상세 데이터를 불러오는데 실패했습니다.', { variant: 'error' })
        } finally {
            setDetailLoading(false)
        }
    }, [enqueueSnackbar])

    // 이슈 작업로그 데이터 로드
    const loadIssueWorklog = useCallback(async (issueKey) => {
        try {
            setWorklogLoading(true)
            const response = await service.sprint.getIssueWorklog(issueKey)
            setIssueWorklogData(response.data || [])
            setSelectedIssue(issueKey)
        } catch (error) {
            console.error('이슈 작업로그 데이터 로드 실패:', error)
            enqueueSnackbar('이슈 작업로그 데이터를 불러오는데 실패했습니다.', { variant: 'error' })
        } finally {
            setWorklogLoading(false)
        }
    }, [enqueueSnackbar])

    // 년도 선택 이벤트
    const handleYearChange = (event) => {
        setSelectedYear(event.target.value)
        // 년도 변경시 상세 데이터 초기화
        setSelectedSprint(null)
        setSelectedWorker(null)
        setSprintDetailData([])
        setSelectedIssue(null)
        setIssueWorklogData([])
    }

    // 스프린트명 클릭 이벤트
    const handleSprintClick = (sprintName) => {
        loadSprintDetail(sprintName)
        setSelectedIssue(null)
        setIssueWorklogData([])
    }

    // 작업자명 클릭 이벤트
    const handleWorkerClick = (worker, sprintName) => {
        loadSprintDetail(sprintName, worker)
        setSelectedIssue(null)
        setIssueWorklogData([])
    }


    // ECharts 옵션 생성
    const getChartOptions = () => {
        if (!sprintData) return {}

        const { sprints = [], assigneeSummaries = [], sprintTotals } = sprintData

        // sprints와 assigneeSummaries가 배열인지 확인
        const sprintArray = Array.isArray(sprints) ? sprints : []
        const assigneeArray = Array.isArray(assigneeSummaries) ? assigneeSummaries : []

        // 막대차트를 위한 시리즈 데이터 생성
        const series = assigneeArray.map((assignee, index) => ({
            name: assignee.assignee || '',
            type: 'bar',
            stack: 'total',
            data: sprintArray.map(sprint => assignee.sprintStoryPoints?.[sprint] || 0),
            color: `hsl(${(index * 360) / Math.max(assigneeArray.length, 1)}, 60%, 50%)`
        }))

        return {
            title: {
                text: `${selectedYear}년 스프린트 스토리포인트 현황`,
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                formatter: function(params) {
                    let result = `<strong>${params[0].axisValue}</strong><br/>`
                    params.forEach(param => {
                        if (param.value > 0) {
                            result += `${param.seriesName}: ${param.value} SP<br/>`
                        }
                    })
                    return result
                }
            },
            legend: {
                top: 30,
                type: 'scroll'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: sprintArray
            },
            yAxis: {
                type: 'value',
                name: '스토리포인트'
            },
            series: series
        }
    }

    // 테이블 데이터 생성
    const getTableData = () => {
        if (!sprintData) return { headers: [], rows: [], sprints: [] }

        const { sprints = [], assigneeSummaries = [] } = sprintData

        // sprints가 배열인지 확인
        const sprintArray = Array.isArray(sprints) ? sprints : []

        const headers = ['작업자', ...sprintArray, '계']
        const rows = assigneeSummaries.map(assignee => [
            assignee.assignee,
            ...sprintArray.map(sprint => assignee.sprintStoryPoints?.[sprint] || 0),
            assignee.totalStoryPoints || 0
        ])

        // 스프린트 합계 행 추가
        const sprintTotalsRow = [
            '스프린트 합계',
            ...sprintArray.map(sprint => {
                return assigneeSummaries.reduce((total, assignee) => {
                    return total + (assignee.sprintStoryPoints?.[sprint] || 0)
                }, 0)
            }),
            assigneeSummaries.reduce((total, assignee) => total + (assignee.totalStoryPoints || 0), 0)
        ]
        rows.push(sprintTotalsRow)

        return { headers, rows, sprints: sprintArray }
    }

    const tableData = getTableData()

    // 스프린트 상세 DataGrid 컬럼 정의
    const sprintDetailColumns = [
        { field: 'sprint', headerName: '스프린트', width: 150, headerAlign: 'left', align: 'left' },
        { field: 'assignee', headerName: '작업자', width: 120, headerAlign: 'left', align: 'left' },
        { field: 'issueKey', headerName: '이슈', width: 120, headerAlign: 'left', align: 'left' },
        { field: 'status', headerName: '상태', width: 100, headerAlign: 'left', align: 'left' },
        { field: 'summary', headerName: '서머리', width: 300, flex: 1, headerAlign: 'left', align: 'left' },
        { field: 'startDate', headerName: '시작일', width: 120, headerAlign: 'left', align: 'left' },
        { field: 'totalTimeHours', headerName: '작업시간', width: 120, type: 'number', headerAlign: 'right', align: 'right' },
        { field: 'storyPoints', headerName: '스토리포인트', width: 120, type: 'number', headerAlign: 'right', align: 'right' }
    ]

    // 이슈 작업로그 DataGrid 컬럼 정의
    const issueWorklogColumns = [
        { field: 'issueKey', headerName: '이슈', width: 120, headerAlign: 'left', align: 'left' },
        { field: 'author', headerName: '작업자', width: 120, headerAlign: 'left', align: 'left' },
        { field: 'comment', headerName: '작업 코멘트', width: 300, flex: 1, headerAlign: 'left', align: 'left' },
        { field: 'started', headerName: '작업시작시간', width: 180, headerAlign: 'left', align: 'left' },
        { field: 'timeHours', headerName: '작업시간', width: 120, type: 'number', headerAlign: 'right', align: 'right' }
    ]

    // UTC를 KST로 변환하는 함수
    const convertUTCToKST = (utcTimeString) => {
        if (!utcTimeString) return ''
        try {
            const utcDate = new Date(utcTimeString)
            // UTC에 9시간을 더해서 KST로 변환
            const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))

            const year = kstDate.getFullYear()
            const month = String(kstDate.getMonth() + 1).padStart(2, '0')
            const day = String(kstDate.getDate()).padStart(2, '0')
            const hours = String(kstDate.getHours()).padStart(2, '0')
            const minutes = String(kstDate.getMinutes()).padStart(2, '0')

            return `${year}-${month}-${day} ${hours}:${minutes}`
        } catch (error) {
            console.error('시간 변환 오류:', error)
            return utcTimeString
        }
    }

    // DataGrid 행 데이터 준비 (id 추가)
    const sprintDetailRows = sprintDetailData.map((item, index) => ({
        id: index,
        ...item
    }))

    // 스프린트 상세 합계 계산
    const sprintDetailTotals = sprintDetailData.reduce((totals, item) => {
        totals.totalTimeHours += parseFloat(item.totalTimeHours || 0)
        totals.storyPoints += parseFloat(item.storyPoints || 0)
        return totals
    }, { totalTimeHours: 0, storyPoints: 0 })

    const issueWorklogRows = issueWorklogData.map((item, index) => ({
        id: index,
        ...item,
        started: convertUTCToKST(item.started) // UTC를 KST로 변환
    }))

    return (
        <Box sx={{ m: 2 }}>
            <Typography variant="h4" gutterBottom>
                스프린트 보고서
            </Typography>
            
            {/* 년도 선택 */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>년도</InputLabel>
                        <Select
                            value={selectedYear}
                            label="년도"
                            onChange={handleYearChange}
                        >
                            {getYearOptions().map(year => (
                                <MenuItem key={year} value={year}>
                                    {year}년
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* 막대 차트 */}
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, mb: 3 }}>
                                <ReactECharts
                                    option={getChartOptions()}
                                    style={{ height: '500px' }}
                                />
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* 스프린트 테이블 */}
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TableContainer component={Paper}>
                                <Table sx={{ minWidth: 650 }} size="small">
                                    <TableHead>
                                        <TableRow>
                                            {tableData.headers.map((header, index) => (
                                                <TableCell
                                                    key={index}
                                                    align={index === 0 ? 'left' : 'center'}
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        backgroundColor: selectedSprint === header ? '#1976d2' : '#f5f5f5',
                                                        color: selectedSprint === header ? 'white' : 'inherit',
                                                        cursor: index > 0 && index < tableData.headers.length - 1 ? 'pointer' : 'default',
                                                        '&:hover': index > 0 && index < tableData.headers.length - 1 ? {
                                                            backgroundColor: selectedSprint === header ? '#1565c0' : '#e8f5e8'
                                                        } : {}
                                                    }}
                                                    onClick={() => {
                                                        if (index > 0 && index < tableData.headers.length - 1) {
                                                            handleSprintClick(header)
                                                        }
                                                    }}
                                                >
                                                    {header}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tableData.rows.map((row, rowIndex) => (
                                            <TableRow
                                                key={rowIndex}
                                                sx={{
                                                    backgroundColor: rowIndex === tableData.rows.length - 1 ? '#f0f0f0' : 'inherit',
                                                    fontWeight: rowIndex === tableData.rows.length - 1 ? 'bold' : 'normal'
                                                }}
                                            >
                                                {row.map((cell, cellIndex) => {
                                                    const isWorkerCell = cellIndex === 0
                                                    const isStoryPointCell = cellIndex > 0 && cellIndex < tableData.headers.length - 1
                                                    const isTotalRow = rowIndex === tableData.rows.length - 1
                                                    const isClickableCell = (isWorkerCell || (isStoryPointCell && typeof cell === 'number' && cell > 0)) && !isTotalRow

                                                    return (
                                                        <TableCell
                                                            key={cellIndex}
                                                            align={cellIndex === 0 ? 'left' : 'center'}
                                                            sx={{
                                                                fontWeight: isTotalRow ? 'bold' : 'normal',
                                                                backgroundColor: (() => {
                                                                    if (isTotalRow) return 'inherit'
                                                                    if (isWorkerCell && selectedWorker === cell) return '#1976d2'
                                                                    if (isStoryPointCell && selectedSprint === tableData.headers[cellIndex] && selectedWorker === row[0]) return '#1976d2'
                                                                    return 'inherit'
                                                                })(),
                                                                color: (() => {
                                                                    if (isTotalRow) return 'inherit'
                                                                    if (isWorkerCell && selectedWorker === cell) return 'white'
                                                                    if (isStoryPointCell && selectedSprint === tableData.headers[cellIndex] && selectedWorker === row[0]) return 'white'
                                                                    return 'inherit'
                                                                })(),
                                                                cursor: isClickableCell ? 'pointer' : 'default',
                                                                '&:hover': isClickableCell ? {
                                                                    backgroundColor: (() => {
                                                                        if (isWorkerCell && selectedWorker === cell) return '#1565c0'
                                                                        if (isStoryPointCell && selectedSprint === tableData.headers[cellIndex] && selectedWorker === row[0]) return '#1565c0'
                                                                        return '#e8f5e8'
                                                                    })()
                                                                } : {}
                                                            }}
                                                            onClick={() => {
                                                                if (isClickableCell) {
                                                                    if (isWorkerCell) {
                                                                        // 작업자명 클릭시 첫 번째 스프린트로 필터링
                                                                        const worker = cell
                                                                        if (tableData.sprints && tableData.sprints.length > 0) {
                                                                            handleWorkerClick(worker, tableData.sprints[0])
                                                                        }
                                                                    } else if (isStoryPointCell) {
                                                                        // 스토리포인트 셀 클릭시 해당 스프린트+작업자 조합으로 필터링
                                                                        const worker = row[0] // 첫 번째 컬럼이 작업자명
                                                                        const sprint = tableData.headers[cellIndex] // 해당 컬럼의 스프린트명
                                                                        handleWorkerClick(worker, sprint)
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            {typeof cell === 'number' && cell > 0 ? cell.toFixed(2) : cell === 0 ? '-' : cell}
                                                        </TableCell>
                                                    )
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </Grid>

                    {/* 스프린트 상세 데이터 그리드 */}
                    {selectedSprint && (
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                        스프린트 상세: {selectedSprint}
                                        {selectedWorker && ` - 작업자: ${selectedWorker}`}
                                    </Typography>
                                    {detailLoading ? (
                                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                                            <CircularProgress />
                                        </Box>
                                    ) : (
                                        <Box sx={{ minWidth: 0, width: '85vw', mx: 'auto' }}>
                                            <DataGridTable
                                                paginationMode="client"
                                                clientSideData={sprintDetailRows}
                                                columns={sprintDetailColumns}
                                                hidePagination={true}
                                                summaryRow={{
                                                    sprint: '',
                                                    assignee: '',
                                                    issueKey: '',
                                                    status: '',
                                                    summary: '합계',
                                                    startDate: '',
                                                    totalTimeHours: sprintDetailTotals.totalTimeHours.toFixed(2),
                                                    storyPoints: sprintDetailTotals.storyPoints.toFixed(2)
                                                }}
                                                onRowClick={(params) => {
                                                    // 합계 로우는 클릭 불가
                                                    if (params.row.id !== 'summary') {
                                                        loadIssueWorklog(params.row.issueKey)
                                                    }
                                                }}
                                                getRowClassName={(params) => {
                                                    if (params.row.id === 'summary') return 'total-row'
                                                    if (params.row.issueKey === selectedIssue) return 'selected-issue-row'
                                                    return ''
                                                }}
                                                autoHeight={true}
                                                density="compact"

                                            />
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {/* 이슈 작업로그 데이터 그리드 */}
                    {selectedIssue && (
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        이슈 작업로그: {selectedIssue}
                                    </Typography>
                                    {worklogLoading ? (
                                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                                            <CircularProgress />
                                        </Box>
                                    ) : (
                                        <Box sx={{ minWidth: 0, width: '85vw', mx: 'auto' }}>
                                            <DataGridTable
                                                paginationMode="client"
                                                clientSideData={issueWorklogRows}
                                                columns={issueWorklogColumns}
                                                hidePagination={true}
                                                autoHeight={true}
                                                density="compact"

                                            />
                                        </Box>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                </>
            )}
        </Box>
    )
}
