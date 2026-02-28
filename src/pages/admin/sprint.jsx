import React, {useState, useEffect, useCallback, useMemo} from 'react'
import ReactECharts from 'echarts-for-react'
import {toast} from 'sonner'
import service from '../../service'
import ShadcnDataTable from '../../components/common/ShadcnDataTable'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select'
import {Skeleton} from '../../components/ui/skeleton'
import AdminPageFrame from '../../components/layout/admin/AdminPageFrame'

export default function SprintPage() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [sprintData, setSprintData] = useState(null)
    const [loading, setLoading] = useState(true)

    const [selectedSprint, setSelectedSprint] = useState(null)
    const [selectedWorker, setSelectedWorker] = useState(null)
    const [sprintDetailData, setSprintDetailData] = useState([])
    const [detailLoading, setDetailLoading] = useState(false)

    const [selectedIssue, setSelectedIssue] = useState(null)
    const [issueWorklogData, setIssueWorklogData] = useState([])
    const [worklogLoading, setWorklogLoading] = useState(false)

    const getYearOptions = () => {
        const currentYear = new Date().getFullYear()
        const years = []
        for (let i = 0; i < 4; i++) {
            years.push(currentYear - i)
        }
        return years
    }

    const loadSprintData = useCallback(async (year) => {
        try {
            setLoading(true)
            const response = await service.sprint.getSprintData(year)
            setSprintData(response.data)
        } catch (error) {
            console.error('스프린트 데이터 로드 실패:', error)
            toast.error('스프린트 데이터를 불러오는데 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadSprintData(selectedYear)
    }, [selectedYear, loadSprintData])

    const loadSprintDetail = useCallback(async (sprintName, worker = null) => {
        try {
            setDetailLoading(true)
            const response = await service.sprint.getSprintDetail(sprintName, worker)
            setSprintDetailData(response.data || [])
            setSelectedSprint(sprintName)
            setSelectedWorker(worker)
        } catch (error) {
            console.error('스프린트 상세 데이터 로드 실패:', error)
            toast.error('스프린트 상세 데이터를 불러오는데 실패했습니다.')
        } finally {
            setDetailLoading(false)
        }
    }, [])

    const loadIssueWorklog = useCallback(async (issueKey) => {
        try {
            setWorklogLoading(true)
            const response = await service.sprint.getIssueWorklog(issueKey)
            setIssueWorklogData(response.data || [])
            setSelectedIssue(issueKey)
        } catch (error) {
            console.error('이슈 작업로그 데이터 로드 실패:', error)
            toast.error('이슈 작업로그 데이터를 불러오는데 실패했습니다.')
        } finally {
            setWorklogLoading(false)
        }
    }, [])

    const handleYearChange = (value) => {
        setSelectedYear(Number(value))
        setSelectedSprint(null)
        setSelectedWorker(null)
        setSprintDetailData([])
        setSelectedIssue(null)
        setIssueWorklogData([])
    }

    const handleSprintClick = (sprintName) => {
        loadSprintDetail(sprintName)
        setSelectedIssue(null)
        setIssueWorklogData([])
    }

    const handleWorkerClick = (worker, sprintName) => {
        loadSprintDetail(sprintName, worker)
        setSelectedIssue(null)
        setIssueWorklogData([])
    }

    const getChartOptions = () => {
        if (!sprintData) return {}
        const {sprints = [], assigneeSummaries = []} = sprintData
        const sprintArray = Array.isArray(sprints) ? sprints : []
        const assigneeArray = Array.isArray(assigneeSummaries) ? assigneeSummaries : []

        const series = assigneeArray.map((assignee, index) => ({
            name: assignee.assignee || '',
            type: 'bar',
            stack: 'total',
            data: sprintArray.map(sprint => assignee.sprintStoryPoints?.[sprint] || 0),
            color: `hsl(${(index * 360) / Math.max(assigneeArray.length, 1)}, 60%, 50%)`
        }))

        return {
            title: {text: `${selectedYear}년 스프린트 스토리포인트 현황`, left: 'center'},
            tooltip: {
                trigger: 'axis',
                axisPointer: {type: 'shadow'},
                formatter: function (params) {
                    let result = `<strong>${params[0].axisValue}</strong><br/>`
                    params.forEach(param => {
                        if (param.value > 0) result += `${param.seriesName}: ${param.value} SP<br/>`
                    })
                    return result
                }
            },
            legend: {top: 30, type: 'scroll'},
            grid: {left: '3%', right: '4%', bottom: '3%', containLabel: true},
            xAxis: {type: 'category', data: sprintArray},
            yAxis: {type: 'value', name: '스토리포인트'},
            series: series
        }
    }

    const getTableData = () => {
        if (!sprintData) return {headers: [], rows: [], sprints: []}
        const {sprints = [], assigneeSummaries = []} = sprintData
        const sprintArray = Array.isArray(sprints) ? sprints : []
        const headers = ['작업자', ...sprintArray, '계']
        const rows = assigneeSummaries.map(assignee => [
            assignee.assignee,
            ...sprintArray.map(sprint => assignee.sprintStoryPoints?.[sprint] || 0),
            assignee.totalStoryPoints || 0
        ])
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
        return {headers, rows, sprints: sprintArray}
    }

    const tableData = getTableData()

    const sprintDetailColumns = useMemo(() => [
        {accessorKey: 'sprint', header: '스프린트', size: 150},
        {accessorKey: 'assignee', header: '작업자', size: 120},
        {
            accessorKey: 'issueKey',
            header: '이슈',
            size: 120,
            cell: ({value}) => {
                const issueKey = value
                if (!issueKey) return null
                return (
                    <a
                        href={`${process.env.JIRA_BROWSE_URL}/${issueKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sky-700 hover:text-sky-800 hover:underline"
                    >
                        {issueKey}
                    </a>
                )
            }
        },
        {accessorKey: 'status', header: '상태', size: 100},
        {accessorKey: 'summary', header: '서머리', size: 300, grow: true},
        {accessorKey: 'startDate', header: '시작일', size: 120},
        {accessorKey: 'totalTimeHours', header: '작업시간', size: 120, headerAlign: 'right', cellAlign: 'right', footerAlign: 'right'},
        {accessorKey: 'storyPoints', header: '스토리포인트', size: 120, headerAlign: 'right', cellAlign: 'right', footerAlign: 'right'}
    ], [])

    const issueWorklogColumns = useMemo(() => [
        {accessorKey: 'issueKey', header: '이슈', size: 120},
        {accessorKey: 'author', header: '작업자', size: 120},
        {accessorKey: 'comment', header: '작업 코멘트', size: 300, grow: true},
        {accessorKey: 'started', header: '작업시작시간', size: 180},
        {accessorKey: 'timeHours', header: '작업시간', size: 120, headerAlign: 'right', cellAlign: 'right', footerAlign: 'right'}
    ], [])

    const convertUTCToKST = (utcTimeString) => {
        if (!utcTimeString) return ''
        try {
            const utcDate = new Date(utcTimeString)
            const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000))
            const year = kstDate.getFullYear()
            const month = String(kstDate.getMonth() + 1).padStart(2, '0')
            const day = String(kstDate.getDate()).padStart(2, '0')
            const hours = String(kstDate.getHours()).padStart(2, '0')
            const minutes = String(kstDate.getMinutes()).padStart(2, '0')
            return `${year}-${month}-${day} ${hours}:${minutes}`
        } catch (error) {
            return utcTimeString
        }
    }

    const sprintDetailRows = sprintDetailData.map((item, index) => ({id: index, ...item}))

    const sprintDetailTotals = useMemo(() => {
        return sprintDetailData.reduce((totals, item) => {
            totals.totalTimeHours += parseFloat(item.totalTimeHours || 0)
            totals.storyPoints += parseFloat(item.storyPoints || 0)
            return totals
        }, {totalTimeHours: 0, storyPoints: 0})
    }, [sprintDetailData])

    const issueWorklogRows = issueWorklogData.map((item, index) => ({
        id: index,
        ...item,
        started: convertUTCToKST(item.started)
    }))

    const issueWorklogTotals = useMemo(() => {
        return issueWorklogData.reduce((totals, item) => {
            totals.timeHours += parseFloat(item.timeHours || 0)
            return totals
        }, {timeHours: 0})
    }, [issueWorklogData])

    return (
        <AdminPageFrame
            actions={(
                <div className="w-44">
                    <Select value={String(selectedYear)} onValueChange={handleYearChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="년도"/>
                        </SelectTrigger>
                        <SelectContent>
                            {getYearOptions().map(year => (
                                <SelectItem key={year} value={String(year)}>
                                    {year}년
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        >

            {loading ? (
                <div className="admin-panel admin-panel-pad flex justify-center items-center min-h-[400px]">
                    <div className="space-y-3 w-full max-w-2xl">
                        <Skeleton className="h-10 w-full"/>
                        <Skeleton className="h-10 w-full"/>
                        <Skeleton className="h-10 w-full"/>
                    </div>
                </div>
            ) : (
                <>
                    {/* 막대 차트 */}
                    <div className="admin-panel admin-panel-pad mb-4">
                        <ReactECharts
                            option={getChartOptions()}
                            style={{height: '500px'}}
                        />
                    </div>

                    {/* 스프린트 테이블 */}
                    <div className="admin-panel overflow-x-auto mb-4">
                        <table className="w-full text-sm">
                            <thead>
                            <tr>
                                {tableData.headers.map((header, index) => {
                                    const isSprintHeader = index > 0 && index < tableData.headers.length - 1
                                    const isSelected = selectedSprint === header
                                    return (
                                        <th
                                            key={index}
                                            className={`border-b border-[color:var(--admin-border)] px-3 py-3 font-bold ${index === 0 ? 'text-left' : 'text-center'} ${isSelected ? 'bg-sky-600/16 text-sky-700' : 'bg-slate-50/80 text-[color:var(--admin-text)]'} ${isSprintHeader ? 'cursor-pointer hover:bg-sky-600/8' : ''}`}
                                            onClick={() => {
                                                if (isSprintHeader) handleSprintClick(header)
                                            }}
                                        >
                                            {header}
                                        </th>
                                    )
                                })}
                            </tr>
                            </thead>
                            <tbody>
                            {tableData.rows.map((row, rowIndex) => {
                                const isTotalRow = rowIndex === tableData.rows.length - 1
                                return (
                                    <tr key={rowIndex} className={isTotalRow ? 'bg-slate-50/90 font-bold text-[color:var(--admin-text)]' : 'text-[color:var(--admin-text-secondary)]'}>
                                        {row.map((cell, cellIndex) => {
                                            const isWorkerCell = cellIndex === 0
                                            const isStoryPointCell = cellIndex > 0 && cellIndex < tableData.headers.length - 1
                                            const isClickableCell = (isWorkerCell || (isStoryPointCell && typeof cell === 'number' && cell > 0)) && !isTotalRow
                                            const isWorkerSelected = isWorkerCell && selectedWorker === cell
                                            const isCellSelected = isStoryPointCell && selectedSprint === tableData.headers[cellIndex] && selectedWorker === row[0]

                                            const bgStyle = (isWorkerSelected || isCellSelected)
                                                ? {backgroundColor: 'rgba(14, 165, 233, 0.12)', color: 'var(--admin-text)'}
                                                : {}

                                            return (
                                                <td
                                                    key={cellIndex}
                                                    className={`border-b border-[color:var(--admin-border)] px-3 py-2 ${cellIndex === 0 ? 'text-left' : 'text-center'} ${isClickableCell ? 'cursor-pointer hover:bg-emerald-500/10' : ''}`}
                                                    style={bgStyle}
                                                    onClick={() => {
                                                        if (isClickableCell) {
                                                            if (isWorkerCell) {
                                                                const worker = cell
                                                                if (tableData.sprints && tableData.sprints.length > 0) {
                                                                    handleWorkerClick(worker, tableData.sprints[0])
                                                                }
                                                            } else if (isStoryPointCell) {
                                                                const worker = row[0]
                                                                const sprint = tableData.headers[cellIndex]
                                                                handleWorkerClick(worker, sprint)
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {typeof cell === 'number' && cell > 0 ? cell.toFixed(2) : cell === 0 ? '-' : cell}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>

                    {/* 스프린트 상세 */}
                    {selectedSprint && (
                        <div className="admin-panel admin-panel-pad mt-4">
                            <h5 className="mb-3 text-lg font-semibold text-[color:var(--admin-text)]">
                                스프린트 상세: {selectedSprint}
                                {selectedWorker && ` - 작업자: ${selectedWorker}`}
                            </h5>
                            {detailLoading ? (
                                <div className="flex justify-center items-center min-h-[200px]">
                                    <div className="space-y-2 w-full">
                                        <Skeleton className="h-8 w-full"/>
                                        <Skeleton className="h-8 w-full"/>
                                        <Skeleton className="h-8 w-full"/>
                                    </div>
                                </div>
                            ) : (
                                <div className="min-w-0">
                                    <ShadcnDataTable
                                        paginationMode="client"
                                        clientSideData={sprintDetailRows}
                                        columns={sprintDetailColumns}
                                        hidePagination={true}
                                        summaryRow={sprintDetailData.length > 0 ? {
                                            sprint: '',
                                            assignee: '',
                                            issueKey: '',
                                            status: '',
                                            summary: '합계',
                                            startDate: '',
                                            totalTimeHours: sprintDetailTotals.totalTimeHours.toFixed(2),
                                            storyPoints: sprintDetailTotals.storyPoints.toFixed(2)
                                        } : undefined}
                                        onRowClick={(params) => {
                                            if (params.id !== 'summary') {
                                                loadIssueWorklog(params.row.issueKey)
                                            }
                                        }}
                                        getRowClassName={(params) => {
                                            if (params.id === 'summary') return 'bg-slate-50/90'
                                            if (params.row.issueKey === selectedIssue) return 'bg-sky-500/10'
                                            const isCompleted = params.row.status === '작업완료'
                                            const noStoryPoints = !params.row.storyPoints || params.row.storyPoints === 0
                                            if (isCompleted && noStoryPoints) return 'bg-red-500/10'
                                            return ''
                                        }}
                                        autoHeight={true}
                                        density="compact"
                                        mobileCardView={false}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* 이슈 작업로그 */}
                    {selectedIssue && (
                        <div className="admin-panel admin-panel-pad mt-4">
                            <h5 className="mb-3 text-lg font-semibold text-[color:var(--admin-text)]">
                                이슈 작업로그: {selectedIssue}
                            </h5>
                            {worklogLoading ? (
                                <div className="flex justify-center items-center min-h-[200px]">
                                    <div className="space-y-2 w-full">
                                        <Skeleton className="h-8 w-full"/>
                                        <Skeleton className="h-8 w-full"/>
                                        <Skeleton className="h-8 w-full"/>
                                    </div>
                                </div>
                            ) : (
                                <div className="min-w-0">
                                    <ShadcnDataTable
                                        paginationMode="client"
                                        clientSideData={issueWorklogRows}
                                        columns={issueWorklogColumns}
                                        hidePagination={true}
                                        summaryRow={issueWorklogData.length > 0 ? {
                                            issueKey: '',
                                            author: '',
                                            comment: '합계',
                                            started: '',
                                            timeHours: issueWorklogTotals.timeHours.toFixed(2)
                                        } : undefined}
                                        autoHeight={true}
                                        density="compact"
                                        mobileCardView={false}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </AdminPageFrame>
    )
}
