import {useState, useEffect, useRef, useCallback} from 'react'
import {
    Box, TextField, Button, Paper, Typography, Grid,
    Select, MenuItem, FormControl, InputLabel, ButtonGroup,
    IconButton, Tabs, Tab, Divider
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {useSnackbar} from 'notistack'
import {useRouter} from 'next/router'

const DEFAULT_CODE = `flowchart TD
    A[시작] --> B{조건 확인}
    B -->|Yes| C[처리 실행]
    B -->|No| D[대체 처리]
    C --> E[결과 저장]
    D --> E
    E --> F[완료]`

const SAMPLE_CODES = {
    flowchart: `flowchart TD
    A[시작] --> B{조건 확인}
    B -->|Yes| C[처리 실행]
    B -->|No| D[대체 처리]
    C --> E[결과 저장]
    D --> E
    E --> F[완료]`,
    sequence: `sequenceDiagram
    participant Client
    participant Server
    participant Database

    Client->>Server: 요청 전송
    Server->>Database: 데이터 조회
    Database-->>Server: 결과 반환
    Server-->>Client: 응답 전송`,
    classDiagram: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +bark()
    }
    class Cat {
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
    erDiagram: `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "ordered in"

    USER {
        int id PK
        string name
        string email
    }
    ORDER {
        int id PK
        int user_id FK
        date created_at
    }`
}

export default function MermaidPage() {
    const router = useRouter()
    const {enqueueSnackbar} = useSnackbar()
    const [code, setCode] = useState(DEFAULT_CODE)
    const [scaleMode, setScaleMode] = useState('ratio') // 'ratio' or 'custom'
    const [scale, setScale] = useState(2)
    const [customWidth, setCustomWidth] = useState(1920)
    const [customHeight, setCustomHeight] = useState(1080)
    const [error, setError] = useState(null)
    const [isClient, setIsClient] = useState(false)
    const [selectedSample, setSelectedSample] = useState('flowchart')
    const previewRef = useRef(null)
    const mermaidRef = useRef(null)

    // 클라이언트 사이드 체크
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Mermaid 초기화
    useEffect(() => {
        if (!isClient) return

        const initMermaid = async () => {
            try {
                const mermaid = (await import('mermaid')).default
                mermaidRef.current = mermaid
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose',
                    fontFamily: 'D2Coding, monospace'
                })
                renderDiagram()
            } catch (e) {
                setError('Mermaid 초기화에 실패했습니다.')
            }
        }

        initMermaid()
    }, [isClient])

    // 코드 변경 시 다이어그램 재렌더링 (디바운스 적용)
    useEffect(() => {
        if (!mermaidRef.current) return

        const timer = setTimeout(() => {
            renderDiagram()
        }, 300)

        return () => clearTimeout(timer)
    }, [code])

    const renderDiagram = useCallback(async () => {
        if (!mermaidRef.current || !previewRef.current) return

        // 빈 코드일 경우 렌더링 건너뛰기
        const trimmedCode = code.trim()
        if (!trimmedCode) {
            previewRef.current.innerHTML = ''
            setError(null)
            return
        }

        try {
            // 먼저 문법 검사
            await mermaidRef.current.parse(trimmedCode)

            // 이전 렌더링 결과 삭제
            previewRef.current.innerHTML = ''

            // 고유 ID 생성
            const id = `mermaid-${Date.now()}`

            const {svg} = await mermaidRef.current.render(id, trimmedCode)
            previewRef.current.innerHTML = svg
            setError(null)
        } catch (e) {
            // 에러 메시지 정리 (폭탄 이모지 등 제거)
            let errorMsg = e.message || 'Mermaid 문법 오류'
            // 불필요한 특수문자 제거
            errorMsg = errorMsg.replace(/💣/g, '').replace(/Syntax error in text\s*/gi, '')
            if (errorMsg.includes('No diagram type detected')) {
                errorMsg = '다이어그램 타입을 인식할 수 없습니다. flowchart, sequenceDiagram 등으로 시작해주세요.'
            }
            setError(errorMsg.trim() || '문법 오류')
            previewRef.current.innerHTML = ''
        }
    }, [code])

    const downloadPng = async () => {
        try {
            const {toPng} = await import('html-to-image')
            const svgElement = previewRef.current?.querySelector('svg')
            if (!svgElement) {
                enqueueSnackbar('다이어그램을 먼저 생성해주세요.', {variant: 'warning'})
                return
            }

            let options = {backgroundColor: 'white'}

            if (scaleMode === 'ratio') {
                options.pixelRatio = scale
            } else {
                // 커스텀 사이즈: SVG의 원본 비율 유지하면서 스케일 계산
                const bbox = svgElement.getBoundingClientRect()
                const scaleX = customWidth / bbox.width
                const scaleY = customHeight / bbox.height
                options.pixelRatio = Math.min(scaleX, scaleY)
            }

            const dataUrl = await toPng(svgElement, options)

            const link = document.createElement('a')
            link.download = `mermaid-diagram-${Date.now()}.png`
            link.href = dataUrl
            link.click()

            enqueueSnackbar('PNG 다운로드 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('다운로드 실패: ' + e.message, {variant: 'error'})
        }
    }

    const downloadSvg = () => {
        const svgElement = previewRef.current?.querySelector('svg')
        if (!svgElement) {
            enqueueSnackbar('다이어그램을 먼저 생성해주세요.', {variant: 'warning'})
            return
        }

        const svgData = new XMLSerializer().serializeToString(svgElement)
        const blob = new Blob([svgData], {type: 'image/svg+xml'})
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.download = `mermaid-diagram-${Date.now()}.svg`
        link.href = url
        link.click()

        URL.revokeObjectURL(url)
        enqueueSnackbar('SVG 다운로드 완료', {variant: 'success'})
    }

    const handleSampleChange = (sample) => {
        setSelectedSample(sample)
        setCode(SAMPLE_CODES[sample])
    }

    if (!isClient) {
        return (
            <Box sx={{p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh'}}>
                <Typography>로딩 중...</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{p: 2}}>
            <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                <IconButton onClick={() => router.push('/util')} sx={{mr: 1}}>
                    <ArrowBackIcon/>
                </IconButton>
                <Typography variant="h4" sx={{fontWeight: 'bold'}}>
                    Mermaid Editor
                </Typography>
            </Box>

            {/* 샘플 선택 */}
            <Paper elevation={1} sx={{p: 2, mb: 2}}>
                <Typography variant="subtitle2" sx={{mb: 1}}>샘플 다이어그램</Typography>
                <ButtonGroup size="small" variant="outlined">
                    <Button
                        variant={selectedSample === 'flowchart' ? 'contained' : 'outlined'}
                        onClick={() => handleSampleChange('flowchart')}
                    >
                        Flowchart
                    </Button>
                    <Button
                        variant={selectedSample === 'sequence' ? 'contained' : 'outlined'}
                        onClick={() => handleSampleChange('sequence')}
                    >
                        Sequence
                    </Button>
                    <Button
                        variant={selectedSample === 'classDiagram' ? 'contained' : 'outlined'}
                        onClick={() => handleSampleChange('classDiagram')}
                    >
                        Class
                    </Button>
                    <Button
                        variant={selectedSample === 'erDiagram' ? 'contained' : 'outlined'}
                        onClick={() => handleSampleChange('erDiagram')}
                    >
                        ER Diagram
                    </Button>
                </ButtonGroup>
            </Paper>

            <Grid container spacing={2}>
                {/* 에디터 영역 */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{p: 2, height: '65vh', display: 'flex', flexDirection: 'column'}}>
                        <Typography variant="h6" gutterBottom>코드</Typography>
                        <TextField
                            multiline
                            fullWidth
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            sx={{
                                flexGrow: 1,
                                '& .MuiInputBase-root': {
                                    height: '100%',
                                    alignItems: 'flex-start'
                                },
                                '& .MuiInputBase-input': {
                                    height: '100% !important',
                                    overflow: 'auto !important'
                                }
                            }}
                            InputProps={{
                                sx: {fontFamily: 'D2Coding, monospace', fontSize: 14}
                            }}
                        />
                    </Paper>
                </Grid>

                {/* 프리뷰 영역 */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{p: 2, height: '65vh', display: 'flex', flexDirection: 'column'}}>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1}}>
                            <Typography variant="h6">미리보기</Typography>
                            <Box sx={{display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap'}}>
                                {/* 해상도 모드 선택 */}
                                <FormControl size="small" sx={{minWidth: 100}}>
                                    <InputLabel>모드</InputLabel>
                                    <Select
                                        value={scaleMode}
                                        label="모드"
                                        onChange={(e) => setScaleMode(e.target.value)}
                                    >
                                        <MenuItem value="ratio">배율</MenuItem>
                                        <MenuItem value="custom">픽셀</MenuItem>
                                    </Select>
                                </FormControl>

                                {scaleMode === 'ratio' ? (
                                    <FormControl size="small" sx={{minWidth: 80}}>
                                        <InputLabel>배율</InputLabel>
                                        <Select
                                            value={scale}
                                            label="배율"
                                            onChange={(e) => setScale(e.target.value)}
                                        >
                                            <MenuItem value={1}>1x</MenuItem>
                                            <MenuItem value={2}>2x</MenuItem>
                                            <MenuItem value={3}>3x</MenuItem>
                                            <MenuItem value={4}>4x</MenuItem>
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <>
                                        <TextField
                                            size="small"
                                            label="너비"
                                            type="number"
                                            value={customWidth}
                                            onChange={(e) => setCustomWidth(Number(e.target.value))}
                                            sx={{width: 90}}
                                            InputProps={{inputProps: {min: 100, max: 8000}}}
                                        />
                                        <Typography variant="body2">×</Typography>
                                        <TextField
                                            size="small"
                                            label="높이"
                                            type="number"
                                            value={customHeight}
                                            onChange={(e) => setCustomHeight(Number(e.target.value))}
                                            sx={{width: 90}}
                                            InputProps={{inputProps: {min: 100, max: 8000}}}
                                        />
                                    </>
                                )}

                                <ButtonGroup variant="contained" size="small">
                                    <Button onClick={downloadPng} startIcon={<DownloadIcon/>}>PNG</Button>
                                    <Button onClick={downloadSvg} startIcon={<DownloadIcon/>}>SVG</Button>
                                </ButtonGroup>
                            </Box>
                        </Box>

                        {error && (
                            <Paper sx={{p: 1, mb: 1, backgroundColor: 'error.light'}}>
                                <Typography color="error.contrastText" variant="body2">
                                    {error}
                                </Typography>
                            </Paper>
                        )}

                        <Box
                            ref={previewRef}
                            sx={{
                                flexGrow: 1,
                                overflow: 'auto',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                backgroundColor: '#fafafa',
                                borderRadius: 1,
                                p: 2,
                                '& svg': {
                                    maxWidth: '100%',
                                    height: 'auto'
                                }
                            }}
                        />
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1}}>
                <Typography variant="subtitle2" sx={{mb: 1}}>Mermaid 문법 참고</Typography>
                <Typography variant="body2" color="text.secondary">
                    Mermaid는 텍스트 기반으로 다이어그램을 생성하는 도구입니다.
                    Flowchart, Sequence Diagram, Class Diagram, ER Diagram 등 다양한 다이어그램을 지원합니다.
                    자세한 문법은{' '}
                    <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" rel="noopener noreferrer">
                        Mermaid 공식 문서
                    </a>
                    를 참고하세요.
                </Typography>
            </Box>
        </Box>
    )
}
