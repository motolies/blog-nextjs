import {useState, useEffect} from 'react'
import {
    Box, TextField, Button, Paper, Typography, Grid, Tabs, Tab,
    IconButton, InputAdornment, Chip, Divider
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {useSnackbar} from 'notistack'
import {useRouter} from 'next/router'
import moment from 'moment'

const ENCODING_TYPES = [
    {id: 'base64', label: 'Base64', bidirectional: true},
    {id: 'url', label: 'URL', bidirectional: true},
    {id: 'html', label: 'HTML', bidirectional: true},
    {id: 'unicode', label: 'Unicode', bidirectional: true},
    {id: 'md5', label: 'MD5', bidirectional: false},
    {id: 'sha256', label: 'SHA-256', bidirectional: false},
    {id: 'jwt', label: 'JWT', bidirectional: false},
    {id: 'json', label: 'JSON', bidirectional: true}
]

function TabPanel({children, value, index, ...other}) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`encode-tabpanel-${index}`}
            aria-labelledby={`encode-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{p: 3}}>{children}</Box>}
        </div>
    )
}

export default function EncodePage() {
    const router = useRouter()
    const {enqueueSnackbar} = useSnackbar()
    const [tabValue, setTabValue] = useState(0)
    const [isClient, setIsClient] = useState(false)

    // 공통 상태
    const [input, setInput] = useState('')
    const [output, setOutput] = useState('')

    // JWT 전용 상태
    const [jwtHeader, setJwtHeader] = useState('')
    const [jwtPayload, setJwtPayload] = useState('')
    const [jwtExpiry, setJwtExpiry] = useState(null)

    // crypto-js 참조
    const [CryptoJS, setCryptoJS] = useState(null)

    useEffect(() => {
        setIsClient(true)
    }, [])

    // crypto-js 로드
    useEffect(() => {
        if (!isClient) return
        import('crypto-js').then(module => {
            setCryptoJS(module.default)
        })
    }, [isClient])

    // 탭 변경 시 입력/출력 초기화
    useEffect(() => {
        setInput('')
        setOutput('')
        setJwtHeader('')
        setJwtPayload('')
        setJwtExpiry(null)
    }, [tabValue])

    const handleCopy = (text) => {
        if (!text) {
            enqueueSnackbar('복사할 내용이 없습니다.', {variant: 'warning'})
            return
        }
        navigator.clipboard.writeText(text)
        enqueueSnackbar('클립보드에 복사되었습니다.', {variant: 'success'})
    }

    const handleSwap = () => {
        const temp = input
        setInput(output)
        setOutput(temp)
    }

    // Base64
    const encodeBase64 = () => {
        try {
            const encoded = btoa(unescape(encodeURIComponent(input)))
            setOutput(encoded)
            enqueueSnackbar('Base64 인코딩 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('인코딩 실패: ' + e.message, {variant: 'error'})
        }
    }

    const decodeBase64 = () => {
        try {
            const decoded = decodeURIComponent(escape(atob(input)))
            setOutput(decoded)
            enqueueSnackbar('Base64 디코딩 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('디코딩 실패: 유효하지 않은 Base64 문자열', {variant: 'error'})
        }
    }

    // URL Encoding
    const encodeUrl = () => {
        try {
            const encoded = encodeURIComponent(input)
            setOutput(encoded)
            enqueueSnackbar('URL 인코딩 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('인코딩 실패: ' + e.message, {variant: 'error'})
        }
    }

    const decodeUrl = () => {
        try {
            const decoded = decodeURIComponent(input)
            setOutput(decoded)
            enqueueSnackbar('URL 디코딩 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('디코딩 실패: 유효하지 않은 URL 인코딩', {variant: 'error'})
        }
    }

    // HTML Entity
    const encodeHtml = () => {
        try {
            const encoded = input
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
            setOutput(encoded)
            enqueueSnackbar('HTML 인코딩 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('인코딩 실패: ' + e.message, {variant: 'error'})
        }
    }

    const decodeHtml = () => {
        try {
            const decoded = input
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&#39;/g, "'")
            setOutput(decoded)
            enqueueSnackbar('HTML 디코딩 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('디코딩 실패: ' + e.message, {variant: 'error'})
        }
    }

    // Unicode Hex
    const encodeUnicode = () => {
        try {
            const encoded = Array.from(input)
                .map(char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'))
                .join('')
            setOutput(encoded)
            enqueueSnackbar('Unicode 인코딩 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('인코딩 실패: ' + e.message, {variant: 'error'})
        }
    }

    const decodeUnicode = () => {
        try {
            const decoded = input.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) =>
                String.fromCharCode(parseInt(hex, 16))
            )
            setOutput(decoded)
            enqueueSnackbar('Unicode 디코딩 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('디코딩 실패: 유효하지 않은 Unicode 문자열', {variant: 'error'})
        }
    }

    // MD5
    const hashMd5 = () => {
        if (!CryptoJS) {
            enqueueSnackbar('암호화 라이브러리 로딩 중...', {variant: 'info'})
            return
        }
        try {
            const hash = CryptoJS.MD5(input).toString()
            setOutput(hash)
            enqueueSnackbar('MD5 해시 생성 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('해시 생성 실패: ' + e.message, {variant: 'error'})
        }
    }

    // SHA-256
    const hashSha256 = () => {
        if (!CryptoJS) {
            enqueueSnackbar('암호화 라이브러리 로딩 중...', {variant: 'info'})
            return
        }
        try {
            const hash = CryptoJS.SHA256(input).toString()
            setOutput(hash)
            enqueueSnackbar('SHA-256 해시 생성 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('해시 생성 실패: ' + e.message, {variant: 'error'})
        }
    }

    // JWT 디코딩
    const decodeJwt = () => {
        try {
            const parts = input.split('.')
            if (parts.length !== 3) {
                throw new Error('유효하지 않은 JWT 형식입니다. (header.payload.signature)')
            }

            // Base64 URL 디코딩
            const base64UrlDecode = (str) => {
                const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
                const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
                return decodeURIComponent(escape(atob(padded)))
            }

            const header = JSON.parse(base64UrlDecode(parts[0]))
            const payload = JSON.parse(base64UrlDecode(parts[1]))

            setJwtHeader(JSON.stringify(header, null, 2))
            setJwtPayload(JSON.stringify(payload, null, 2))

            // 만료 시간 확인
            if (payload.exp) {
                const expDate = new Date(payload.exp * 1000)
                const now = new Date()
                setJwtExpiry({
                    date: moment(expDate).format('YYYY-MM-DD HH:mm:ss'),
                    expired: expDate < now
                })
            } else {
                setJwtExpiry(null)
            }

            setOutput(JSON.stringify({header, payload}, null, 2))
            enqueueSnackbar('JWT 디코딩 완료', {variant: 'success'})
        } catch (e) {
            setJwtHeader('')
            setJwtPayload('')
            setJwtExpiry(null)
            setOutput('')
            enqueueSnackbar('JWT 디코딩 실패: ' + e.message, {variant: 'error'})
        }
    }

    // JSON 포맷팅
    const formatJson = () => {
        try {
            const parsed = JSON.parse(input)
            const formatted = JSON.stringify(parsed, null, 2)
            setOutput(formatted)
            enqueueSnackbar('JSON 포맷팅 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('JSON 파싱 실패: ' + e.message, {variant: 'error'})
        }
    }

    const minifyJson = () => {
        try {
            const parsed = JSON.parse(input)
            const minified = JSON.stringify(parsed)
            setOutput(minified)
            enqueueSnackbar('JSON 압축 완료', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar('JSON 파싱 실패: ' + e.message, {variant: 'error'})
        }
    }

    const CopyAdornment = ({value}) => (
        <InputAdornment position="end">
            <IconButton onClick={() => handleCopy(value)} edge="end" size="small">
                <ContentCopyIcon fontSize="small"/>
            </IconButton>
        </InputAdornment>
    )

    const currentType = ENCODING_TYPES[tabValue]

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
                    Encoder / Decoder
                </Typography>
            </Box>

            <Paper elevation={2}>
                <Tabs
                    value={tabValue}
                    onChange={(e, newValue) => setTabValue(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {ENCODING_TYPES.map((type, index) => (
                        <Tab key={type.id} label={type.label}/>
                    ))}
                </Tabs>

                {/* Base64 */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="입력"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="인코딩/디코딩할 텍스트를 입력하세요"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Button variant="contained" onClick={encodeBase64}>
                                    Encode
                                </Button>
                                <Button variant="contained" onClick={decodeBase64}>
                                    Decode
                                </Button>
                                <IconButton onClick={handleSwap} title="입력/출력 스왑">
                                    <SwapVertIcon/>
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="출력"
                                value={output}
                                fullWidth
                                multiline
                                rows={4}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: <CopyAdornment value={output}/>
                                }}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* URL Encoding */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="입력"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="URL 인코딩/디코딩할 텍스트를 입력하세요"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Button variant="contained" onClick={encodeUrl}>
                                    Encode
                                </Button>
                                <Button variant="contained" onClick={decodeUrl}>
                                    Decode
                                </Button>
                                <IconButton onClick={handleSwap} title="입력/출력 스왑">
                                    <SwapVertIcon/>
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="출력"
                                value={output}
                                fullWidth
                                multiline
                                rows={4}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: <CopyAdornment value={output}/>
                                }}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* HTML Entity */}
                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="입력"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="HTML 인코딩/디코딩할 텍스트를 입력하세요"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Button variant="contained" onClick={encodeHtml}>
                                    Encode
                                </Button>
                                <Button variant="contained" onClick={decodeHtml}>
                                    Decode
                                </Button>
                                <IconButton onClick={handleSwap} title="입력/출력 스왑">
                                    <SwapVertIcon/>
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="출력"
                                value={output}
                                fullWidth
                                multiline
                                rows={4}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: <CopyAdornment value={output}/>
                                }}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Unicode Hex */}
                <TabPanel value={tabValue} index={3}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="입력"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Unicode 인코딩: 일반 텍스트, 디코딩: \u0048\u0065\u006c\u006c\u006f"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Button variant="contained" onClick={encodeUnicode}>
                                    Encode
                                </Button>
                                <Button variant="contained" onClick={decodeUnicode}>
                                    Decode
                                </Button>
                                <IconButton onClick={handleSwap} title="입력/출력 스왑">
                                    <SwapVertIcon/>
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="출력"
                                value={output}
                                fullWidth
                                multiline
                                rows={4}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: <CopyAdornment value={output}/>
                                }}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* MD5 */}
                <TabPanel value={tabValue} index={4}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="입력"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="해시할 텍스트를 입력하세요"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{display: 'flex', gap: 1, justifyContent: 'center'}}>
                                <Button variant="contained" onClick={hashMd5}>
                                    MD5 해시 생성
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="MD5 해시 (32자)"
                                value={output}
                                fullWidth
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: <CopyAdornment value={output}/>,
                                    sx: {fontFamily: 'D2Coding, monospace'}
                                }}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* SHA-256 */}
                <TabPanel value={tabValue} index={5}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="입력"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="해시할 텍스트를 입력하세요"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{display: 'flex', gap: 1, justifyContent: 'center'}}>
                                <Button variant="contained" onClick={hashSha256}>
                                    SHA-256 해시 생성
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="SHA-256 해시 (64자)"
                                value={output}
                                fullWidth
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: <CopyAdornment value={output}/>,
                                    sx: {fontFamily: 'D2Coding, monospace'}
                                }}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* JWT */}
                <TabPanel value={tabValue} index={6}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="JWT 토큰"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
                                InputProps={{
                                    sx: {fontFamily: 'D2Coding, monospace', fontSize: 12}
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{display: 'flex', gap: 1, justifyContent: 'center'}}>
                                <Button variant="contained" onClick={decodeJwt}>
                                    JWT 디코딩
                                </Button>
                            </Box>
                        </Grid>
                        {jwtHeader && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Header"
                                        value={jwtHeader}
                                        fullWidth
                                        multiline
                                        minRows={4}
                                        maxRows={12}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: <CopyAdornment value={jwtHeader}/>,
                                            sx: {fontFamily: 'D2Coding, monospace', fontSize: 12}
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        label="Payload"
                                        value={jwtPayload}
                                        fullWidth
                                        multiline
                                        minRows={4}
                                        maxRows={20}
                                        InputProps={{
                                            readOnly: true,
                                            endAdornment: <CopyAdornment value={jwtPayload}/>,
                                            sx: {fontFamily: 'D2Coding, monospace', fontSize: 12}
                                        }}
                                    />
                                </Grid>
                                {jwtExpiry && (
                                    <Grid item xs={12}>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            <Typography variant="body2">만료 시간:</Typography>
                                            <Typography variant="body2" sx={{fontFamily: 'D2Coding, monospace'}}>
                                                {jwtExpiry.date}
                                            </Typography>
                                            <Chip
                                                label={jwtExpiry.expired ? '만료됨' : '유효'}
                                                color={jwtExpiry.expired ? 'error' : 'success'}
                                                size="small"
                                            />
                                        </Box>
                                    </Grid>
                                )}
                            </>
                        )}
                    </Grid>
                </TabPanel>

                {/* JSON */}
                <TabPanel value={tabValue} index={7}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="JSON 입력"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                fullWidth
                                multiline
                                rows={6}
                                placeholder='{"name":"John","age":30}'
                                InputProps={{
                                    sx: {fontFamily: 'D2Coding, monospace', fontSize: 12}
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Button variant="contained" onClick={formatJson}>
                                    포맷팅 (Beautify)
                                </Button>
                                <Button variant="contained" onClick={minifyJson}>
                                    압축 (Minify)
                                </Button>
                                <IconButton onClick={handleSwap} title="입력/출력 스왑">
                                    <SwapVertIcon/>
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="출력"
                                value={output}
                                fullWidth
                                multiline
                                rows={6}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: <CopyAdornment value={output}/>,
                                    sx: {fontFamily: 'D2Coding, monospace', fontSize: 12}
                                }}
                            />
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>

            <Box sx={{mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1}}>
                <Typography variant="subtitle2" sx={{mb: 1}}>인코딩 타입 안내</Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                    <ul style={{margin: 0, paddingLeft: 20}}>
                        <li><strong>Base64</strong>: 바이너리 데이터를 ASCII 문자로 변환</li>
                        <li><strong>URL</strong>: URL에서 사용할 수 없는 문자를 % 인코딩</li>
                        <li><strong>HTML</strong>: HTML 특수문자를 엔티티로 변환</li>
                        <li><strong>Unicode</strong>: 문자를 \uXXXX 형식으로 변환</li>
                        <li><strong>MD5</strong>: 128비트 해시 (단방향)</li>
                        <li><strong>SHA-256</strong>: 256비트 해시 (단방향)</li>
                        <li><strong>JWT</strong>: JSON Web Token 디코딩 (서명 검증 없음)</li>
                        <li><strong>JSON</strong>: JSON 문자열 포맷팅/압축</li>
                    </ul>
                </Typography>
            </Box>
        </Box>
    )
}
