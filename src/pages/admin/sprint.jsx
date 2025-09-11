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

export default function SprintPage() {
    const { enqueueSnackbar } = useSnackbar()
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [sprintData, setSprintData] = useState(null)
    const [loading, setLoading] = useState(true)

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

    // 년도 선택 이벤트
    const handleYearChange = (event) => {
        setSelectedYear(event.target.value)
    }

    // ECharts 옵션 생성
    const getChartOptions = () => {
        if (!sprintData) return {}

        const { sprints, assigneeSummaries, sprintTotals } = sprintData
        
        // 막대차트를 위한 시리즈 데이터 생성
        const series = assigneeSummaries.map((assignee, index) => ({
            name: assignee.assignee,
            type: 'bar',
            stack: 'total',
            data: sprints.map(sprint => assignee.sprintStoryPoints[sprint] || 0),
            color: `hsl(${(index * 360) / assigneeSummaries.length}, 60%, 50%)`
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
                data: sprints
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
        if (!sprintData) return { headers: [], rows: [] }

        const { sprints, assigneeSummaries } = sprintData
        
        const headers = ['작업자', ...sprints, '계']
        const rows = assigneeSummaries.map(assignee => [
            assignee.assignee,
            ...sprints.map(sprint => assignee.sprintStoryPoints[sprint] || 0),
            assignee.totalStoryPoints
        ])

        // 스프린트 합계 행 추가
        const sprintTotalsRow = [
            '스프린트 합계',
            ...sprints.map(sprint => {
                return assigneeSummaries.reduce((total, assignee) => {
                    return total + (assignee.sprintStoryPoints[sprint] || 0)
                }, 0)
            }),
            assigneeSummaries.reduce((total, assignee) => total + assignee.totalStoryPoints, 0)
        ]
        rows.push(sprintTotalsRow)

        return { headers, rows }
    }

    const tableData = getTableData()

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
                                                        backgroundColor: '#f5f5f5'
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
                                                {row.map((cell, cellIndex) => (
                                                    <TableCell 
                                                        key={cellIndex} 
                                                        align={cellIndex === 0 ? 'left' : 'center'}
                                                        sx={{
                                                            fontWeight: rowIndex === tableData.rows.length - 1 ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        {typeof cell === 'number' && cell > 0 ? cell.toFixed(2) : cell === 0 ? '-' : cell}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    )
}