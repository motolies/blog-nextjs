import {useState, useEffect, useRef, useCallback} from 'react'
import {
    Box, TextField, Button, Paper, Typography, Grid, Tabs, Tab,
    Select, MenuItem, FormControl, InputLabel, ButtonGroup,
    IconButton, Slider, FormControlLabel, Checkbox
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {useSnackbar} from 'notistack'
import {useRouter} from 'next/router'

const BARCODE_FORMATS = [
    {value: 'CODE128', label: 'CODE128', description: '모든 ASCII 문자 지원', example: 'ABC-12345'},
    {value: 'EAN13', label: 'EAN-13', description: '숫자 12-13자리', example: '5901234123457'},
    {value: 'EAN8', label: 'EAN-8', description: '숫자 7-8자리', example: '96385074'},
    {value: 'UPC', label: 'UPC-A', description: '숫자 11-12자리', example: '042100005264'},
    {value: 'CODE39', label: 'CODE39', description: '영문 대문자, 숫자, 일부 특수문자', example: 'CODE39'}
]

const QR_ERROR_LEVELS = [
    {value: 'L', label: 'L (7%)', description: '낮음'},
    {value: 'M', label: 'M (15%)', description: '중간'},
    {value: 'Q', label: 'Q (25%)', description: '높음'},
    {value: 'H', label: 'H (30%)', description: '최고'}
]

function TabPanel({children, value, index, ...other}) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`barcode-tabpanel-${index}`}
            aria-labelledby={`barcode-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{p: 3}}>{children}</Box>}
        </div>
    )
}

export default function BarcodePage() {
    const router = useRouter()
    const {enqueueSnackbar} = useSnackbar()
    const [tabValue, setTabValue] = useState(0)
    const [isClient, setIsClient] = useState(false)

    // 1D Barcode states
    const [barcodeFormat, setBarcodeFormat] = useState('CODE128')
    const [barcodeText, setBarcodeText] = useState('ABC-12345')
    const [barcodeWidth, setBarcodeWidth] = useState(2)
    const [barcodeHeight, setBarcodeHeight] = useState(100)
    const [displayValue, setDisplayValue] = useState(true)
    const barcodeRef = useRef(null)
    const barcodeSvgRef = useRef(null)

    // QR Code states
    const [qrText, setQrText] = useState('https://example.com')
    const [qrSize, setQrSize] = useState(256)
    const [qrErrorLevel, setQrErrorLevel] = useState('M')
    const qrRef = useRef(null)
    const qrCanvasRef = useRef(null)

    // 클라이언트 사이드 체크
    useEffect(() => {
        setIsClient(true)
    }, [])

    // 1D Barcode 렌더링
    const renderBarcode = useCallback(async () => {
        if (!isClient || !barcodeSvgRef.current || !barcodeText.trim()) return

        try {
            const JsBarcode = (await import('jsbarcode')).default
            JsBarcode(barcodeSvgRef.current, barcodeText, {
                format: barcodeFormat,
                width: barcodeWidth,
                height: barcodeHeight,
                displayValue: displayValue,
                font: 'D2Coding',
                fontSize: 16,
                margin: 10,
                background: '#ffffff'
            })
        } catch (e) {
            console.error('Barcode generation error:', e)
            // SVG 초기화
            if (barcodeSvgRef.current) {
                barcodeSvgRef.current.innerHTML = ''
            }
            enqueueSnackbar('바코드 생성 실패: ' + (e.message || '유효하지 않은 입력값'), {variant: 'error'})
        }
    }, [isClient, barcodeText, barcodeFormat, barcodeWidth, barcodeHeight, displayValue, enqueueSnackbar])

    // QR Code 렌더링
    const renderQrCode = useCallback(async () => {
        if (!isClient || !qrCanvasRef.current || !qrText.trim()) return

        try {
            const QRCode = (await import('qrcode')).default
            await QRCode.toCanvas(qrCanvasRef.current, qrText, {
                width: qrSize,
                margin: 2,
                errorCorrectionLevel: qrErrorLevel,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            })
        } catch (e) {
            console.error('QR Code generation error:', e)
            enqueueSnackbar('QR 코드 생성 실패: ' + (e.message || '유효하지 않은 입력값'), {variant: 'error'})
        }
    }, [isClient, qrText, qrSize, qrErrorLevel, enqueueSnackbar])

    // 1D Barcode 렌더링 트리거
    useEffect(() => {
        if (tabValue === 0) {
            const timer = setTimeout(() => {
                renderBarcode()
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [tabValue, renderBarcode])

    // QR Code 렌더링 트리거
    useEffect(() => {
        if (tabValue === 1) {
            const timer = setTimeout(() => {
                renderQrCode()
            }, 300)
            return () => clearTimeout(timer)
        }
    }, [tabValue, renderQrCode])

    // 포맷 변경 시 예시 텍스트 업데이트
    const handleFormatChange = (format) => {
        setBarcodeFormat(format)
        const formatInfo = BARCODE_FORMATS.find(f => f.value === format)
        if (formatInfo) {
            setBarcodeText(formatInfo.example)
        }
    }

    // 1D Barcode PNG 다운로드
    const downloadBarcodePng = async () => {
        try {
            const {toPng} = await import('html-to-image')
            const svgElement = barcodeSvgRef.current
            if (!svgElement) {
                enqueueSnackbar('바코드를 먼저 생성해주세요.', {variant: 'warning'})
                return
            }

            const dataUrl = await toPng(svgElement, {
                backgroundColor: 'white',
                pixelRatio: 2
            })

            const link = document.createElement('a')
            link.download = `barcode-${barcodeFormat}-${Date.now()}.png`
            link.href = dataUrl
            link.click()

            enqueueSnackbar('PNG 다운로드 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('다운로드 실패: ' + e.message, {variant: 'error'})
        }
    }

    // 1D Barcode SVG 다운로드
    const downloadBarcodeSvg = () => {
        const svgElement = barcodeSvgRef.current
        if (!svgElement) {
            enqueueSnackbar('바코드를 먼저 생성해주세요.', {variant: 'warning'})
            return
        }

        const svgData = new XMLSerializer().serializeToString(svgElement)
        const blob = new Blob([svgData], {type: 'image/svg+xml'})
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.download = `barcode-${barcodeFormat}-${Date.now()}.svg`
        link.href = url
        link.click()

        URL.revokeObjectURL(url)
        enqueueSnackbar('SVG 다운로드 완료', {variant: 'success'})
    }

    // QR Code PNG 다운로드
    const downloadQrPng = () => {
        const canvas = qrCanvasRef.current
        if (!canvas) {
            enqueueSnackbar('QR 코드를 먼저 생성해주세요.', {variant: 'warning'})
            return
        }

        const dataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `qrcode-${Date.now()}.png`
        link.href = dataUrl
        link.click()

        enqueueSnackbar('PNG 다운로드 완료', {variant: 'success'})
    }

    // QR Code SVG 다운로드
    const downloadQrSvg = async () => {
        try {
            const QRCode = (await import('qrcode')).default
            const svgString = await QRCode.toString(qrText, {
                type: 'svg',
                width: qrSize,
                margin: 2,
                errorCorrectionLevel: qrErrorLevel,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            })

            const blob = new Blob([svgString], {type: 'image/svg+xml'})
            const url = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.download = `qrcode-${Date.now()}.svg`
            link.href = url
            link.click()

            URL.revokeObjectURL(url)
            enqueueSnackbar('SVG 다운로드 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('다운로드 실패: ' + e.message, {variant: 'error'})
        }
    }

    if (!isClient) {
        return (
            <Box sx={{p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh'}}>
                <Typography>로딩 중...</Typography>
            </Box>
        )
    }

    const currentFormat = BARCODE_FORMATS.find(f => f.value === barcodeFormat)

    return (
        <Box sx={{p: 2}}>
            <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                <IconButton onClick={() => router.push('/util')} sx={{mr: 1}}>
                    <ArrowBackIcon/>
                </IconButton>
                <Typography variant="h4" sx={{fontWeight: 'bold'}}>
                    Barcode Generator
                </Typography>
            </Box>

            <Paper elevation={2}>
                <Tabs
                    value={tabValue}
                    onChange={(e, newValue) => setTabValue(newValue)}
                    variant="fullWidth"
                >
                    <Tab label="1D 바코드"/>
                    <Tab label="QR 코드"/>
                </Tabs>

                {/* Tab 0: 1D Barcode */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        {/* 설정 영역 */}
                        <Grid item xs={12} md={5}>
                            <FormControl fullWidth sx={{mb: 2}}>
                                <InputLabel>포맷</InputLabel>
                                <Select
                                    value={barcodeFormat}
                                    label="포맷"
                                    onChange={(e) => handleFormatChange(e.target.value)}
                                >
                                    {BARCODE_FORMATS.map(format => (
                                        <MenuItem key={format.value} value={format.value}>
                                            {format.label} - {format.description}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                label="텍스트"
                                value={barcodeText}
                                onChange={(e) => setBarcodeText(e.target.value)}
                                fullWidth
                                sx={{mb: 3}}
                                placeholder={currentFormat?.example}
                                helperText={currentFormat?.description}
                            />

                            <Typography variant="body2" sx={{mb: 1}}>
                                선 굵기: {barcodeWidth}
                            </Typography>
                            <Slider
                                value={barcodeWidth}
                                onChange={(e, value) => setBarcodeWidth(value)}
                                min={1}
                                max={5}
                                step={0.5}
                                marks
                                sx={{mb: 3}}
                            />

                            <Typography variant="body2" sx={{mb: 1}}>
                                높이: {barcodeHeight}px
                            </Typography>
                            <Slider
                                value={barcodeHeight}
                                onChange={(e, value) => setBarcodeHeight(value)}
                                min={50}
                                max={200}
                                step={10}
                                marks
                                sx={{mb: 2}}
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={displayValue}
                                        onChange={(e) => setDisplayValue(e.target.checked)}
                                    />
                                }
                                label="값 표시"
                            />

                            <ButtonGroup variant="contained" fullWidth sx={{mt: 3}}>
                                <Button onClick={downloadBarcodePng} startIcon={<DownloadIcon/>}>
                                    PNG
                                </Button>
                                <Button onClick={downloadBarcodeSvg} startIcon={<DownloadIcon/>}>
                                    SVG
                                </Button>
                            </ButtonGroup>
                        </Grid>

                        {/* 미리보기 영역 */}
                        <Grid item xs={12} md={7}>
                            <Paper
                                ref={barcodeRef}
                                sx={{
                                    p: 3,
                                    minHeight: 250,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: '#fafafa'
                                }}
                            >
                                <svg ref={barcodeSvgRef}/>
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Tab 1: QR Code */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        {/* 설정 영역 */}
                        <Grid item xs={12} md={5}>
                            <TextField
                                label="텍스트 / URL"
                                value={qrText}
                                onChange={(e) => setQrText(e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
                                sx={{mb: 3}}
                                placeholder="https://example.com"
                            />

                            <Typography variant="body2" sx={{mb: 1}}>
                                사이즈: {qrSize}px
                            </Typography>
                            <Slider
                                value={qrSize}
                                onChange={(e, value) => setQrSize(value)}
                                min={100}
                                max={500}
                                step={50}
                                marks={[
                                    {value: 100, label: '100'},
                                    {value: 256, label: '256'},
                                    {value: 500, label: '500'}
                                ]}
                                sx={{mb: 3}}
                            />

                            <FormControl fullWidth sx={{mb: 3}}>
                                <InputLabel>에러 보정 레벨</InputLabel>
                                <Select
                                    value={qrErrorLevel}
                                    label="에러 보정 레벨"
                                    onChange={(e) => setQrErrorLevel(e.target.value)}
                                >
                                    {QR_ERROR_LEVELS.map(level => (
                                        <MenuItem key={level.value} value={level.value}>
                                            {level.label} - {level.description}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <ButtonGroup variant="contained" fullWidth>
                                <Button onClick={downloadQrPng} startIcon={<DownloadIcon/>}>
                                    PNG
                                </Button>
                                <Button onClick={downloadQrSvg} startIcon={<DownloadIcon/>}>
                                    SVG
                                </Button>
                            </ButtonGroup>
                        </Grid>

                        {/* 미리보기 영역 */}
                        <Grid item xs={12} md={7}>
                            <Paper
                                ref={qrRef}
                                sx={{
                                    p: 3,
                                    minHeight: 250,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: '#fafafa'
                                }}
                            >
                                <canvas ref={qrCanvasRef}/>
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>

            <Box sx={{mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1}}>
                <Typography variant="subtitle2" sx={{mb: 1}}>바코드 포맷 안내</Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                    <ul style={{margin: 0, paddingLeft: 20}}>
                        <li><strong>CODE128</strong>: 가장 범용적인 포맷, 모든 ASCII 문자 지원</li>
                        <li><strong>EAN-13</strong>: 상품 바코드, 숫자 12-13자리</li>
                        <li><strong>EAN-8</strong>: 소형 상품용, 숫자 7-8자리</li>
                        <li><strong>UPC-A</strong>: 북미 상품 바코드, 숫자 11-12자리</li>
                        <li><strong>CODE39</strong>: 산업용, 영문 대문자/숫자/특수문자(-. $/+%)</li>
                    </ul>
                </Typography>
            </Box>
        </Box>
    )
}
