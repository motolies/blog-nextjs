import {useState} from 'react'
import {
    Box, TextField, Button, Paper, Typography, Grid, Tabs, Tab,
    IconButton, InputAdornment, Divider
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import RefreshIcon from '@mui/icons-material/Refresh'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {useSnackbar} from 'notistack'
import {getTsid, TSID} from 'tsid-ts'
import moment from 'moment'
import {useRouter} from 'next/router'

const TSID_EPOCH = 1577836800000 // 2020-01-01 00:00:00 UTC

function TabPanel({children, value, index, ...other}) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tsid-tabpanel-${index}`}
            aria-labelledby={`tsid-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{p: 3}}>{children}</Box>}
        </div>
    )
}

export default function TsidPage() {
    const router = useRouter()
    const {enqueueSnackbar} = useSnackbar()
    const [tabValue, setTabValue] = useState(0)

    // Generate new TSID
    const [generatedTsid, setGeneratedTsid] = useState('')
    const [generatedNumber, setGeneratedNumber] = useState('')
    const [generatedDate, setGeneratedDate] = useState('')

    // TSID <-> Number conversion
    const [tsidInput, setTsidInput] = useState('')
    const [numberResult, setNumberResult] = useState('')
    const [numberInput, setNumberInput] = useState('')
    const [tsidResult, setTsidResult] = useState('')

    // TSID -> DateTime
    const [tsidForDate, setTsidForDate] = useState('')
    const [dateResult, setDateResult] = useState('')

    const handleCopy = (text) => {
        if (!text) {
            enqueueSnackbar('복사할 내용이 없습니다.', {variant: 'warning'})
            return
        }
        navigator.clipboard.writeText(text)
        enqueueSnackbar('클립보드에 복사되었습니다.', {variant: 'success'})
    }

    const handleGenerate = () => {
        try {
            const newTsid = getTsid()
            const tsidString = newTsid.toString()
            const number = newTsid.toBigInt().toString()
            const timestamp = newTsid.timestamp
            const date = moment(new Date(TSID_EPOCH + timestamp)).format('YYYY-MM-DD HH:mm:ss.SSS')

            setGeneratedTsid(tsidString)
            setGeneratedNumber(number)
            setGeneratedDate(date)
            enqueueSnackbar('새 TSID가 생성되었습니다.', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('TSID 생성에 실패했습니다.', {variant: 'error'})
        }
    }

    const handleTsidToNumber = () => {
        if (!tsidInput.trim()) {
            enqueueSnackbar('TSID를 입력해주세요.', {variant: 'warning'})
            return
        }
        try {
            const tsid = TSID.fromString(tsidInput.trim())
            setNumberResult(tsid.toBigInt().toString())
        } catch (e) {
            enqueueSnackbar('유효하지 않은 TSID입니다.', {variant: 'error'})
            setNumberResult('')
        }
    }

    const handleNumberToTsid = () => {
        if (!numberInput.trim()) {
            enqueueSnackbar('숫자를 입력해주세요.', {variant: 'warning'})
            return
        }
        try {
            const tsid = new TSID(BigInt(numberInput.trim()))
            setTsidResult(tsid.toString())
        } catch (e) {
            enqueueSnackbar('유효하지 않은 숫자입니다.', {variant: 'error'})
            setTsidResult('')
        }
    }

    const handleTsidToDate = () => {
        if (!tsidForDate.trim()) {
            enqueueSnackbar('TSID를 입력해주세요.', {variant: 'warning'})
            return
        }
        try {
            const tsid = TSID.fromString(tsidForDate.trim())
            const timestamp = tsid.timestamp
            const actualDate = new Date(TSID_EPOCH + timestamp)
            setDateResult(moment(actualDate).format('YYYY-MM-DD HH:mm:ss.SSS'))
        } catch (e) {
            enqueueSnackbar('유효하지 않은 TSID입니다.', {variant: 'error'})
            setDateResult('')
        }
    }

    const CopyAdornment = ({value}) => (
        <InputAdornment position="end">
            <IconButton onClick={() => handleCopy(value)} edge="end" size="small">
                <ContentCopyIcon fontSize="small"/>
            </IconButton>
        </InputAdornment>
    )

    return (
        <Box sx={{p: 2}}>
            <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                <IconButton onClick={() => router.push('/util')} sx={{mr: 1}}>
                    <ArrowBackIcon/>
                </IconButton>
                <Typography variant="h4" sx={{fontWeight: 'bold'}}>
                    TSID Converter
                </Typography>
            </Box>

            <Paper elevation={2}>
                <Tabs
                    value={tabValue}
                    onChange={(e, newValue) => setTabValue(newValue)}
                    variant="fullWidth"
                >
                    <Tab label="TSID 생성"/>
                    <Tab label="TSID ↔ 숫자"/>
                    <Tab label="TSID → 날짜"/>
                </Tabs>

                {/* Tab 0: TSID 생성 */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{textAlign: 'center', mb: 3}}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<RefreshIcon/>}
                            onClick={handleGenerate}
                        >
                            새 TSID 생성
                        </Button>
                    </Box>

                    {generatedTsid && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="TSID (문자열)"
                                    value={generatedTsid}
                                    fullWidth
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: <CopyAdornment value={generatedTsid}/>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="숫자 (BigInt)"
                                    value={generatedNumber}
                                    fullWidth
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: <CopyAdornment value={generatedNumber}/>
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="생성 시각"
                                    value={generatedDate}
                                    fullWidth
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: <CopyAdornment value={generatedDate}/>
                                    }}
                                />
                            </Grid>
                        </Grid>
                    )}
                </TabPanel>

                {/* Tab 1: TSID <-> 숫자 변환 */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        {/* TSID → 숫자 */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'medium'}}>
                                TSID → 숫자
                            </Typography>
                            <TextField
                                label="TSID 입력"
                                value={tsidInput}
                                onChange={(e) => setTsidInput(e.target.value)}
                                fullWidth
                                sx={{mb: 2}}
                                placeholder="예: 0GXWP1VXZS35J"
                            />
                            <Button
                                variant="contained"
                                onClick={handleTsidToNumber}
                                fullWidth
                                sx={{mb: 2}}
                            >
                                변환
                            </Button>
                            {numberResult && (
                                <TextField
                                    label="숫자 결과"
                                    value={numberResult}
                                    fullWidth
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: <CopyAdornment value={numberResult}/>
                                    }}
                                />
                            )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'medium'}}>
                                숫자 → TSID
                            </Typography>
                            <TextField
                                label="숫자 입력"
                                value={numberInput}
                                onChange={(e) => setNumberInput(e.target.value)}
                                fullWidth
                                sx={{mb: 2}}
                                placeholder="예: 481294567894561234"
                            />
                            <Button
                                variant="contained"
                                onClick={handleNumberToTsid}
                                fullWidth
                                sx={{mb: 2}}
                            >
                                변환
                            </Button>
                            {tsidResult && (
                                <TextField
                                    label="TSID 결과"
                                    value={tsidResult}
                                    fullWidth
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: <CopyAdornment value={tsidResult}/>
                                    }}
                                />
                            )}
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Tab 2: TSID → 날짜 */}
                <TabPanel value={tabValue} index={2}>
                    <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                        TSID에 포함된 타임스탬프를 추출하여 날짜/시간으로 변환합니다.
                        (TSID Epoch: 2020-01-01 00:00:00 UTC)
                    </Typography>

                    <TextField
                        label="TSID 입력"
                        value={tsidForDate}
                        onChange={(e) => setTsidForDate(e.target.value)}
                        fullWidth
                        sx={{mb: 2}}
                        placeholder="예: 0GXWP1VXZS35J"
                    />
                    <Button
                        variant="contained"
                        onClick={handleTsidToDate}
                        fullWidth
                        sx={{mb: 2}}
                    >
                        날짜/시간 추출
                    </Button>
                    {dateResult && (
                        <TextField
                            label="날짜/시간 결과"
                            value={dateResult}
                            fullWidth
                            InputProps={{
                                readOnly: true,
                                endAdornment: <CopyAdornment value={dateResult}/>
                            }}
                        />
                    )}
                </TabPanel>
            </Paper>

            <Box sx={{mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1}}>
                <Typography variant="subtitle2" sx={{mb: 1}}>TSID란?</Typography>
                <Typography variant="body2" color="text.secondary">
                    TSID (Time-Sorted Unique Identifier)는 시간순 정렬이 가능한 고유 식별자입니다.
                    13자리 문자열로 표현되며, 내부에 42비트 타임스탬프와 22비트 랜덤값을 포함합니다.
                </Typography>
            </Box>
        </Box>
    )
}
