import {useState, useEffect, useCallback} from 'react'
import {
    Box, TextField, Button, Paper, Typography, Grid, Tabs, Tab,
    IconButton, Chip, Slider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Accordion, AccordionSummary, AccordionDetails, Divider
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import {useSnackbar} from 'notistack'
import {useRouter} from 'next/router'
import {Cron} from 'croner'
import moment from 'moment'

const UNIX_PRESETS = [
    {label: '매분', expression: '* * * * *', description: '1분마다 실행'},
    {label: '매시 정각', expression: '0 * * * *', description: '매시 0분에 실행'},
    {label: '매일 자정', expression: '0 0 * * *', description: '매일 00:00에 실행'},
    {label: '매주 일요일', expression: '0 0 * * 0', description: '일요일 00:00에 실행'},
    {label: '매월 1일', expression: '0 0 1 * *', description: '매월 1일 00:00에 실행'},
    {label: '평일 오전 9시', expression: '0 9 * * 1-5', description: '월-금 09:00에 실행'},
    {label: '5분마다', expression: '*/5 * * * *', description: '5분 간격으로 실행'},
    {label: '30분마다', expression: '*/30 * * * *', description: '30분 간격으로 실행'}
]

const SPRING_PRESETS = [
    {label: '매초', expression: '* * * * * *', description: '1초마다 실행'},
    {label: '매분', expression: '0 * * * * *', description: '매분 0초에 실행'},
    {label: '5초마다', expression: '*/5 * * * * *', description: '5초 간격으로 실행'},
    {label: '30초마다', expression: '*/30 * * * * *', description: '30초 간격으로 실행'},
    {label: '매시 정각', expression: '0 0 * * * *', description: '매시 00분 00초에 실행'},
    {label: '매일 자정', expression: '0 0 0 * * *', description: '매일 00:00:00에 실행'},
    {label: '매주 일요일', expression: '0 0 0 * * 0', description: '일요일 00:00:00에 실행'},
    {label: '평일 오전 9시', expression: '0 0 9 * * 1-5', description: '월-금 09:00:00에 실행'}
]

const SPECIAL_CHARS = [
    {char: '*', meaning: '모든 값', example: '* * * * * = 매분'},
    {char: ',', meaning: '값 나열', example: '1,15 * * * * = 1분, 15분에'},
    {char: '-', meaning: '범위 지정', example: '1-5 * * * * = 1~5분에'},
    {char: '/', meaning: '간격 (step)', example: '*/10 * * * * = 10분마다'},
    {char: 'L', meaning: '마지막 (Last)', example: '0 0 L * * = 매월 마지막 날'},
    {char: '#', meaning: 'n번째 요일', example: '0 0 * * 5#3 = 매월 셋째 금요일'}
]

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function TabPanel({children, value, index, ...other}) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`crontab-tabpanel-${index}`}
            aria-labelledby={`crontab-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{p: 3}}>{children}</Box>}
        </div>
    )
}

function generateKoreanDescription(expression, isSpring = false) {
    try {
        const parts = expression.trim().split(/\s+/)

        let second, minute, hour, dayOfMonth, month, dayOfWeek

        if (isSpring && parts.length === 6) {
            [second, minute, hour, dayOfMonth, month, dayOfWeek] = parts
        } else if (!isSpring && parts.length === 5) {
            [minute, hour, dayOfMonth, month, dayOfWeek] = parts
            second = '0'
        } else {
            return '유효하지 않은 표현식입니다.'
        }

        const descriptions = []

        // 초 분석 (Spring만)
        if (isSpring) {
            if (second === '*') {
                descriptions.push('매초')
            } else if (second.startsWith('*/')) {
                descriptions.push(`${second.slice(2)}초마다`)
            } else if (second !== '0') {
                descriptions.push(`${second}초에`)
            }
        }

        // 분 분석
        if (minute === '*') {
            if (!descriptions.some(d => d.includes('초'))) {
                descriptions.push('매분')
            }
        } else if (minute.startsWith('*/')) {
            descriptions.push(`${minute.slice(2)}분마다`)
        } else if (minute.includes(',')) {
            descriptions.push(`${minute.split(',').join(', ')}분에`)
        } else if (minute.includes('-')) {
            const [start, end] = minute.split('-')
            descriptions.push(`${start}분부터 ${end}분까지 매분`)
        } else if (minute !== '0' || hour === '*') {
            descriptions.push(`${minute}분에`)
        }

        // 시 분석
        if (hour === '*') {
            if (!descriptions.some(d => d.includes('분마다'))) {
                descriptions.push('매시')
            }
        } else if (hour.startsWith('*/')) {
            descriptions.push(`${hour.slice(2)}시간마다`)
        } else if (hour.includes(',')) {
            const hours = hour.split(',').map(h => `${h}시`).join(', ')
            descriptions.push(hours)
        } else if (hour.includes('-')) {
            const [start, end] = hour.split('-')
            descriptions.push(`${start}시부터 ${end}시까지`)
        } else {
            const h = parseInt(hour)
            if (h === 0) {
                descriptions.push('자정')
            } else if (h === 12) {
                descriptions.push('정오')
            } else if (h < 12) {
                descriptions.push(`오전 ${h}시`)
            } else {
                descriptions.push(`오후 ${h - 12}시`)
            }
        }

        // 일 분석
        if (dayOfMonth !== '*' && dayOfMonth !== '?') {
            if (dayOfMonth === 'L') {
                descriptions.push('마지막 날')
            } else if (dayOfMonth.includes(',')) {
                descriptions.push(`${dayOfMonth.split(',').join(', ')}일`)
            } else if (dayOfMonth.includes('-')) {
                const [start, end] = dayOfMonth.split('-')
                descriptions.push(`${start}일부터 ${end}일까지`)
            } else {
                descriptions.push(`${dayOfMonth}일`)
            }
        }

        // 월 분석
        if (month !== '*' && month !== '?') {
            if (month.includes(',')) {
                const months = month.split(',').map(m => MONTH_NAMES[parseInt(m) - 1] || m).join(', ')
                descriptions.push(months)
            } else if (month.includes('-')) {
                const [start, end] = month.split('-')
                descriptions.push(`${MONTH_NAMES[parseInt(start) - 1]}부터 ${MONTH_NAMES[parseInt(end) - 1]}까지`)
            } else {
                const m = parseInt(month)
                if (m >= 1 && m <= 12) {
                    descriptions.push(MONTH_NAMES[m - 1])
                }
            }
        }

        // 요일 분석
        if (dayOfWeek !== '*' && dayOfWeek !== '?') {
            if (dayOfWeek.includes('#')) {
                const [dow, nth] = dayOfWeek.split('#')
                const dayName = DAY_NAMES[parseInt(dow)] || dow
                const ordinal = ['첫째', '둘째', '셋째', '넷째', '다섯째'][parseInt(nth) - 1] || `${nth}번째`
                descriptions.push(`${ordinal} ${dayName}요일`)
            } else if (dayOfWeek.includes('L')) {
                const dow = dayOfWeek.replace('L', '')
                const dayName = DAY_NAMES[parseInt(dow)] || dow
                descriptions.push(`마지막 ${dayName}요일`)
            } else if (dayOfWeek === '1-5' || dayOfWeek === 'MON-FRI') {
                descriptions.push('평일')
            } else if (dayOfWeek === '0,6' || dayOfWeek === '6,0' || dayOfWeek === 'SAT,SUN' || dayOfWeek === 'SUN,SAT') {
                descriptions.push('주말')
            } else if (dayOfWeek.includes(',')) {
                const days = dayOfWeek.split(',').map(d => {
                    const idx = parseInt(d)
                    return DAY_NAMES[idx] || d
                }).join(', ')
                descriptions.push(`${days}요일`)
            } else if (dayOfWeek.includes('-')) {
                const [start, end] = dayOfWeek.split('-')
                const startDay = DAY_NAMES[parseInt(start)] || start
                const endDay = DAY_NAMES[parseInt(end)] || end
                descriptions.push(`${startDay}요일부터 ${endDay}요일까지`)
            } else {
                const idx = parseInt(dayOfWeek)
                if (idx >= 0 && idx <= 7) {
                    const dayName = DAY_NAMES[idx === 7 ? 0 : idx]
                    descriptions.push(`${dayName}요일`)
                }
            }
        }

        // 기본 설명
        if (dayOfMonth === '*' && month === '*' && (dayOfWeek === '*' || dayOfWeek === '?')) {
            if (hour === '*' && minute === '*' && (!isSpring || second === '*')) {
                return isSpring ? '매초마다 실행' : '매분마다 실행'
            } else if (hour === '*') {
                // 매시
            } else {
                descriptions.unshift('매일')
            }
        } else if (dayOfWeek !== '*' && dayOfWeek !== '?' && dayOfMonth === '*') {
            descriptions.unshift('매주')
        } else if (dayOfMonth !== '*' && month === '*') {
            descriptions.unshift('매월')
        } else if (month !== '*') {
            descriptions.unshift('매년')
        }

        const result = descriptions.join(' ') + ' 실행'
        return result.replace(/\s+/g, ' ').trim()
    } catch (e) {
        return '표현식을 분석할 수 없습니다.'
    }
}

export default function CrontabPage() {
    const router = useRouter()
    const {enqueueSnackbar} = useSnackbar()
    const [tabValue, setTabValue] = useState(0)
    const [isClient, setIsClient] = useState(false)

    // Unix Crontab 상태
    const [unixExpression, setUnixExpression] = useState('0 0 * * *')
    const [unixDescription, setUnixDescription] = useState('')
    const [unixNextRuns, setUnixNextRuns] = useState([])
    const [unixError, setUnixError] = useState('')

    // Spring Scheduler 상태
    const [springExpression, setSpringExpression] = useState('0 0 0 * * *')
    const [springDescription, setSpringDescription] = useState('')
    const [springNextRuns, setSpringNextRuns] = useState([])
    const [springError, setSpringError] = useState('')

    // 설정
    const [runCount, setRunCount] = useState(10)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const calculateNextRuns = useCallback((expression, isSpring = false) => {
        try {
            const cron = new Cron(expression, {timezone: 'Asia/Seoul'})
            const runs = cron.nextRuns(runCount)
            const formattedRuns = runs.map(date =>
                moment(date).format('YYYY-MM-DD HH:mm:ss')
            )
            return {runs: formattedRuns, error: null}
        } catch (e) {
            return {runs: [], error: e.message || '유효하지 않은 cron 표현식입니다.'}
        }
    }, [runCount])

    const handleUnixCalculate = useCallback(() => {
        const {runs, error} = calculateNextRuns(unixExpression, false)
        if (error) {
            setUnixError(error)
            setUnixNextRuns([])
            setUnixDescription('')
            enqueueSnackbar('유효하지 않은 표현식입니다.', {variant: 'error'})
        } else {
            setUnixError('')
            setUnixNextRuns(runs)
            setUnixDescription(generateKoreanDescription(unixExpression, false))
            enqueueSnackbar('계산 완료', {variant: 'success'})
        }
    }, [unixExpression, calculateNextRuns, enqueueSnackbar])

    const handleSpringCalculate = useCallback(() => {
        const {runs, error} = calculateNextRuns(springExpression, true)
        if (error) {
            setSpringError(error)
            setSpringNextRuns([])
            setSpringDescription('')
            enqueueSnackbar('유효하지 않은 표현식입니다.', {variant: 'error'})
        } else {
            setSpringError('')
            setSpringNextRuns(runs)
            setSpringDescription(generateKoreanDescription(springExpression, true))
            enqueueSnackbar('계산 완료', {variant: 'success'})
        }
    }, [springExpression, calculateNextRuns, enqueueSnackbar])

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text)
        enqueueSnackbar('클립보드에 복사되었습니다.', {variant: 'success'})
    }

    const handlePresetClick = (expression, isSpring) => {
        if (isSpring) {
            setSpringExpression(expression)
        } else {
            setUnixExpression(expression)
        }
    }

    // 초기 계산 및 runCount 변경 시 자동 재계산
    useEffect(() => {
        if (isClient) {
            // 알림 없이 조용히 계산
            const {runs, error} = calculateNextRuns(unixExpression, false)
            if (!error) {
                setUnixError('')
                setUnixNextRuns(runs)
                setUnixDescription(generateKoreanDescription(unixExpression, false))
            }
        }
    }, [isClient, runCount, calculateNextRuns, unixExpression])

    useEffect(() => {
        if (isClient && tabValue === 1) {
            // 알림 없이 조용히 계산
            const {runs, error} = calculateNextRuns(springExpression, true)
            if (!error) {
                setSpringError('')
                setSpringNextRuns(runs)
                setSpringDescription(generateKoreanDescription(springExpression, true))
            }
        }
    }, [isClient, tabValue, runCount, calculateNextRuns, springExpression])

    if (!isClient) {
        return (
            <Box sx={{p: 2}}>
                <Typography>로딩 중...</Typography>
            </Box>
        )
    }

    const renderExpressionInput = (expression, setExpression, handleCalculate, error, presets, isSpring) => (
        <Paper elevation={1} sx={{p: 3, mb: 3}}>
            <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'medium'}}>
                Cron 표현식 입력
            </Typography>
            <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={9}>
                    <TextField
                        fullWidth
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        placeholder={isSpring ? '초 분 시 일 월 요일' : '분 시 일 월 요일'}
                        error={!!error}
                        helperText={error || (isSpring ? '예: 0 0 0 * * * (매일 자정)' : '예: 0 0 * * * (매일 자정)')}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleCalculate()
                        }}
                        InputProps={{
                            endAdornment: (
                                <IconButton onClick={() => handleCopy(expression)} size="small">
                                    <ContentCopyIcon fontSize="small"/>
                                </IconButton>
                            )
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={<PlayArrowIcon/>}
                        onClick={handleCalculate}
                        sx={{height: 56}}
                    >
                        계산
                    </Button>
                </Grid>
            </Grid>

            <Box sx={{mt: 2}}>
                <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
                    빠른 입력:
                </Typography>
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                    {presets.map((preset) => (
                        <Chip
                            key={preset.expression}
                            label={preset.label}
                            onClick={() => handlePresetClick(preset.expression, isSpring)}
                            variant="outlined"
                            size="small"
                            title={preset.description}
                            sx={{cursor: 'pointer'}}
                        />
                    ))}
                </Box>
            </Box>
        </Paper>
    )

    const renderDescription = (description) => (
        description && (
            <Paper elevation={1} sx={{p: 3, mb: 3, backgroundColor: 'primary.50'}}>
                <Typography variant="subtitle2" color="text.secondary" sx={{mb: 1}}>
                    한국어 설명
                </Typography>
                <Typography variant="h6">
                    {description}
                </Typography>
            </Paper>
        )
    )

    const renderSettings = () => (
        <Paper elevation={1} sx={{p: 3, mb: 3}}>
            <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'medium'}}>
                설정
            </Typography>
            <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    표시 개수: {runCount}개
                </Typography>
                <Slider
                    value={runCount}
                    onChange={(e, newValue) => setRunCount(newValue)}
                    min={1}
                    max={50}
                    valueLabelDisplay="auto"
                />
            </Box>
        </Paper>
    )

    const renderNextRuns = (nextRuns) => (
        nextRuns.length > 0 && (
            <Paper elevation={1} sx={{p: 3, mb: 3}}>
                <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'medium'}}>
                    다음 실행 시간 ({nextRuns.length}개)
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell width={50}>#</TableCell>
                                <TableCell>실행 시간</TableCell>
                                <TableCell width={120}>요일</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {nextRuns.map((run, index) => {
                                const m = moment(run, 'YYYY-MM-DD HH:mm:ss')
                                return (
                                    <TableRow key={index}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell sx={{fontFamily: 'monospace'}}>
                                            {run}
                                        </TableCell>
                                        <TableCell>
                                            {DAY_NAMES[m.day()]}요일
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        )
    )

    const renderGuide = (isSpring) => (
        <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                <Typography variant="subtitle1" sx={{fontWeight: 'medium'}}>
                    Cron 표현식 가이드
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{mb: 3}}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>
                        필드 구조
                    </Typography>
                    <Paper variant="outlined" sx={{p: 2, fontFamily: 'monospace', backgroundColor: 'grey.100'}}>
                        {isSpring ? (
                            <pre style={{margin: 0, fontSize: '0.85rem', overflowX: 'auto'}}>
{`┌───────────── 초 (0-59)
│ ┌───────────── 분 (0-59)
│ │ ┌───────────── 시 (0-23)
│ │ │ ┌───────────── 일 (1-31)
│ │ │ │ ┌───────────── 월 (1-12 또는 JAN-DEC)
│ │ │ │ │ ┌───────────── 요일 (0-6 또는 SUN-SAT)
│ │ │ │ │ │
* * * * * *`}
                            </pre>
                        ) : (
                            <pre style={{margin: 0, fontSize: '0.85rem', overflowX: 'auto'}}>
{`┌───────────── 분 (0-59)
│ ┌───────────── 시 (0-23)
│ │ ┌───────────── 일 (1-31)
│ │ │ ┌───────────── 월 (1-12 또는 JAN-DEC)
│ │ │ │ ┌───────────── 요일 (0-6 또는 SUN-SAT, 0=일요일)
│ │ │ │ │
* * * * *`}
                            </pre>
                        )}
                    </Paper>
                </Box>

                <Divider sx={{my: 2}}/>

                <Box sx={{mb: 3}}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>
                        특수 문자
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell width={60}>문자</TableCell>
                                    <TableCell width={120}>의미</TableCell>
                                    <TableCell>예시</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {SPECIAL_CHARS.map((item) => (
                                    <TableRow key={item.char}>
                                        <TableCell sx={{fontFamily: 'monospace', fontWeight: 'bold'}}>
                                            {item.char}
                                        </TableCell>
                                        <TableCell>{item.meaning}</TableCell>
                                        <TableCell sx={{fontFamily: 'monospace', fontSize: '0.85rem'}}>
                                            {item.example}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                <Divider sx={{my: 2}}/>

                <Box>
                    <Typography variant="subtitle2" sx={{mb: 1}}>
                        자주 사용하는 예시
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>표현식</TableCell>
                                    <TableCell>설명</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(isSpring ? SPRING_PRESETS : UNIX_PRESETS).map((preset) => (
                                    <TableRow
                                        key={preset.expression}
                                        sx={{cursor: 'pointer', '&:hover': {backgroundColor: 'action.hover'}}}
                                        onClick={() => handlePresetClick(preset.expression, isSpring)}
                                    >
                                        <TableCell sx={{fontFamily: 'monospace'}}>
                                            {preset.expression}
                                        </TableCell>
                                        <TableCell>{preset.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </AccordionDetails>
        </Accordion>
    )

    return (
        <Box sx={{p: 2}}>
            <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                <IconButton onClick={() => router.push('/util')} sx={{mr: 1}}>
                    <ArrowBackIcon/>
                </IconButton>
                <Typography variant="h4" sx={{fontWeight: 'bold'}}>
                    Crontab Calculator
                </Typography>
            </Box>

            <Paper elevation={2}>
                <Tabs
                    value={tabValue}
                    onChange={(e, newValue) => setTabValue(newValue)}
                    variant="fullWidth"
                >
                    <Tab label="Unix Crontab (5필드)"/>
                    <Tab label="Spring Scheduler (6필드)"/>
                </Tabs>

                {/* Unix Crontab 탭 */}
                <TabPanel value={tabValue} index={0}>
                    {renderExpressionInput(
                        unixExpression,
                        setUnixExpression,
                        handleUnixCalculate,
                        unixError,
                        UNIX_PRESETS,
                        false
                    )}
                    {renderDescription(unixDescription)}
                    {renderSettings()}
                    {renderNextRuns(unixNextRuns)}
                    {renderGuide(false)}
                </TabPanel>

                {/* Spring Scheduler 탭 */}
                <TabPanel value={tabValue} index={1}>
                    {renderExpressionInput(
                        springExpression,
                        setSpringExpression,
                        handleSpringCalculate,
                        springError,
                        SPRING_PRESETS,
                        true
                    )}
                    {renderDescription(springDescription)}
                    {renderSettings()}
                    {renderNextRuns(springNextRuns)}
                    {renderGuide(true)}
                </TabPanel>
            </Paper>

            <Box sx={{mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1}}>
                <Typography variant="subtitle2" sx={{mb: 1}}>Crontab이란?</Typography>
                <Typography variant="body2" color="text.secondary">
                    Crontab은 Unix 계열 운영체제에서 주기적인 작업을 예약하기 위한 스케줄링 시스템입니다.
                    표준 Unix crontab은 5개 필드(분, 시, 일, 월, 요일)를 사용하고,
                    Spring Framework의 @Scheduled 어노테이션은 초 단위까지 지정할 수 있는 6개 필드를 사용합니다.
                </Typography>
            </Box>
        </Box>
    )
}
