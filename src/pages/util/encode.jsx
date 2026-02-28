import {useState, useEffect} from 'react'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '../../components/ui/tabs'
import {Button} from '../../components/ui/button'
import {Textarea} from '../../components/ui/textarea'
import {Input} from '../../components/ui/input'
import {Badge} from '../../components/ui/badge'
import {ArrowUpDown, ArrowLeft, Copy} from 'lucide-react'
import {toast} from 'sonner'
import {useRouter} from 'next/router'
import {format} from 'date-fns'

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

export default function EncodePage() {
    const router = useRouter()
    const [tabValue, setTabValue] = useState('base64')
    const [isClient, setIsClient] = useState(false)

    const [input, setInput] = useState('')
    const [output, setOutput] = useState('')

    const [jwtHeader, setJwtHeader] = useState('')
    const [jwtPayload, setJwtPayload] = useState('')
    const [jwtExpiry, setJwtExpiry] = useState(null)

    const [CryptoJS, setCryptoJS] = useState(null)

    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        if (!isClient) return
        import('crypto-js').then(module => {
            setCryptoJS(module.default)
        })
    }, [isClient])

    useEffect(() => {
        setInput('')
        setOutput('')
        setJwtHeader('')
        setJwtPayload('')
        setJwtExpiry(null)
    }, [tabValue])

    const handleCopy = (text) => {
        if (!text) {
            toast.warning('복사할 내용이 없습니다.')
            return
        }
        navigator.clipboard.writeText(text)
        toast.success('클립보드에 복사되었습니다.')
    }

    const handleSwap = () => {
        const temp = input
        setInput(output)
        setOutput(temp)
    }

    const encodeBase64 = () => {
        try {
            setOutput(btoa(unescape(encodeURIComponent(input))))
            toast.success('Base64 인코딩 완료')
        } catch (e) {
            toast.error('인코딩 실패: ' + e.message)
        }
    }

    const decodeBase64 = () => {
        try {
            setOutput(decodeURIComponent(escape(atob(input))))
            toast.success('Base64 디코딩 완료')
        } catch (e) {
            toast.error('디코딩 실패: 유효하지 않은 Base64 문자열')
        }
    }

    const encodeUrl = () => {
        try {
            setOutput(encodeURIComponent(input))
            toast.success('URL 인코딩 완료')
        } catch (e) {
            toast.error('인코딩 실패: ' + e.message)
        }
    }

    const decodeUrl = () => {
        try {
            setOutput(decodeURIComponent(input))
            toast.success('URL 디코딩 완료')
        } catch (e) {
            toast.error('디코딩 실패: 유효하지 않은 URL 인코딩')
        }
    }

    const encodeHtml = () => {
        try {
            setOutput(input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'))
            toast.success('HTML 인코딩 완료')
        } catch (e) {
            toast.error('인코딩 실패: ' + e.message)
        }
    }

    const decodeHtml = () => {
        try {
            setOutput(input.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#39;/g, "'"))
            toast.success('HTML 디코딩 완료')
        } catch (e) {
            toast.error('디코딩 실패: ' + e.message)
        }
    }

    const encodeUnicode = () => {
        try {
            setOutput(Array.from(input).map(char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0')).join(''))
            toast.success('Unicode 인코딩 완료')
        } catch (e) {
            toast.error('인코딩 실패: ' + e.message)
        }
    }

    const decodeUnicode = () => {
        try {
            setOutput(input.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16))))
            toast.success('Unicode 디코딩 완료')
        } catch (e) {
            toast.error('디코딩 실패: 유효하지 않은 Unicode 문자열')
        }
    }

    const hashMd5 = () => {
        if (!CryptoJS) { toast.info('암호화 라이브러리 로딩 중...'); return }
        try {
            setOutput(CryptoJS.MD5(input).toString())
            toast.success('MD5 해시 생성 완료')
        } catch (e) {
            toast.error('해시 생성 실패: ' + e.message)
        }
    }

    const hashSha256 = () => {
        if (!CryptoJS) { toast.info('암호화 라이브러리 로딩 중...'); return }
        try {
            setOutput(CryptoJS.SHA256(input).toString())
            toast.success('SHA-256 해시 생성 완료')
        } catch (e) {
            toast.error('해시 생성 실패: ' + e.message)
        }
    }

    const decodeJwt = () => {
        try {
            const parts = input.split('.')
            if (parts.length !== 3) throw new Error('유효하지 않은 JWT 형식입니다. (header.payload.signature)')

            const base64UrlDecode = (str) => {
                const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
                const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
                return decodeURIComponent(escape(atob(padded)))
            }

            const header = JSON.parse(base64UrlDecode(parts[0]))
            const payload = JSON.parse(base64UrlDecode(parts[1]))

            setJwtHeader(JSON.stringify(header, null, 2))
            setJwtPayload(JSON.stringify(payload, null, 2))

            if (payload.exp) {
                const expDate = new Date(payload.exp * 1000)
                setJwtExpiry({date: format(expDate, 'yyyy-MM-dd HH:mm:ss'), expired: expDate < new Date()})
            } else {
                setJwtExpiry(null)
            }

            setOutput(JSON.stringify({header, payload}, null, 2))
            toast.success('JWT 디코딩 완료')
        } catch (e) {
            setJwtHeader('')
            setJwtPayload('')
            setJwtExpiry(null)
            setOutput('')
            toast.error('JWT 디코딩 실패: ' + e.message)
        }
    }

    const formatJson = () => {
        try {
            setOutput(JSON.stringify(JSON.parse(input), null, 2))
            toast.success('JSON 포맷팅 완료')
        } catch (e) {
            toast.error('JSON 파싱 실패: ' + e.message)
        }
    }

    const minifyJson = () => {
        try {
            setOutput(JSON.stringify(JSON.parse(input)))
            toast.success('JSON 압축 완료')
        } catch (e) {
            toast.error('JSON 파싱 실패: ' + e.message)
        }
    }

    const CopyButton = ({value}) => (
        <button
            onClick={() => handleCopy(value)}
            className="absolute right-2 top-2 p-1 rounded hover:bg-gray-100"
            title="복사"
        >
            <Copy className="h-4 w-4 text-gray-500"/>
        </button>
    )

    const BidirectionalPanel = ({encodeFn, decodeFn, inputPlaceholder, outputLabel, isMonospace = false}) => (
        <div className="space-y-3">
            <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={inputPlaceholder}
                rows={4}
                className="font-mono text-sm"
            />
            <div className="flex gap-2 justify-center items-center">
                <Button onClick={encodeFn}>Encode</Button>
                <Button onClick={decodeFn}>Decode</Button>
                <Button variant="ghost" size="icon" onClick={handleSwap} title="입력/출력 스왑">
                    <ArrowUpDown className="h-4 w-4"/>
                </Button>
            </div>
            <div className="relative">
                <Textarea
                    value={output}
                    readOnly
                    rows={4}
                    className={`pr-8 ${isMonospace ? 'font-mono text-sm' : ''}`}
                    placeholder={outputLabel}
                />
                <CopyButton value={output}/>
            </div>
        </div>
    )

    if (!isClient) {
        return <div className="p-4 flex justify-center items-center min-h-[50vh]">로딩 중...</div>
    }

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/util')}>
                    <ArrowLeft className="h-5 w-5"/>
                </Button>
                <h1 className="text-3xl font-bold">Encoder / Decoder</h1>
            </div>

            <div className="border rounded-md">
                <Tabs value={tabValue} onValueChange={setTabValue}>
                    <TabsList className="w-full flex flex-wrap h-auto border-b rounded-none justify-start px-2 py-1 gap-1">
                        {ENCODING_TYPES.map((type) => (
                            <TabsTrigger key={type.id} value={type.id}>{type.label}</TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="p-4">
                        {/* Base64 */}
                        <TabsContent value="base64">
                            <BidirectionalPanel
                                encodeFn={encodeBase64}
                                decodeFn={decodeBase64}
                                inputPlaceholder="인코딩/디코딩할 텍스트를 입력하세요"
                                outputLabel="출력"
                            />
                        </TabsContent>

                        {/* URL */}
                        <TabsContent value="url">
                            <BidirectionalPanel
                                encodeFn={encodeUrl}
                                decodeFn={decodeUrl}
                                inputPlaceholder="URL 인코딩/디코딩할 텍스트를 입력하세요"
                                outputLabel="출력"
                            />
                        </TabsContent>

                        {/* HTML */}
                        <TabsContent value="html">
                            <BidirectionalPanel
                                encodeFn={encodeHtml}
                                decodeFn={decodeHtml}
                                inputPlaceholder="HTML 인코딩/디코딩할 텍스트를 입력하세요"
                                outputLabel="출력"
                            />
                        </TabsContent>

                        {/* Unicode */}
                        <TabsContent value="unicode">
                            <BidirectionalPanel
                                encodeFn={encodeUnicode}
                                decodeFn={decodeUnicode}
                                inputPlaceholder="Unicode 인코딩: 일반 텍스트, 디코딩: \u0048\u0065\u006c\u006c\u006f"
                                outputLabel="출력"
                            />
                        </TabsContent>

                        {/* MD5 */}
                        <TabsContent value="md5">
                            <div className="space-y-3">
                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="해시할 텍스트를 입력하세요"
                                    rows={4}
                                />
                                <div className="flex justify-center">
                                    <Button onClick={hashMd5}>MD5 해시 생성</Button>
                                </div>
                                <div className="relative">
                                    <Input
                                        value={output}
                                        readOnly
                                        placeholder="MD5 해시 (32자)"
                                        className="pr-8 font-mono"
                                    />
                                    <CopyButton value={output}/>
                                </div>
                            </div>
                        </TabsContent>

                        {/* SHA-256 */}
                        <TabsContent value="sha256">
                            <div className="space-y-3">
                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="해시할 텍스트를 입력하세요"
                                    rows={4}
                                />
                                <div className="flex justify-center">
                                    <Button onClick={hashSha256}>SHA-256 해시 생성</Button>
                                </div>
                                <div className="relative">
                                    <Input
                                        value={output}
                                        readOnly
                                        placeholder="SHA-256 해시 (64자)"
                                        className="pr-8 font-mono"
                                    />
                                    <CopyButton value={output}/>
                                </div>
                            </div>
                        </TabsContent>

                        {/* JWT */}
                        <TabsContent value="jwt">
                            <div className="space-y-3">
                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    rows={3}
                                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                    className="font-mono text-xs"
                                />
                                <div className="flex justify-center">
                                    <Button onClick={decodeJwt}>JWT 디코딩</Button>
                                </div>
                                {jwtHeader && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="relative">
                                                <label className="text-xs text-gray-500 mb-1 block">Header</label>
                                                <Textarea value={jwtHeader} readOnly rows={5} className="pr-8 font-mono text-xs"/>
                                                <CopyButton value={jwtHeader}/>
                                            </div>
                                            <div className="relative">
                                                <label className="text-xs text-gray-500 mb-1 block">Payload</label>
                                                <Textarea value={jwtPayload} readOnly rows={5} className="pr-8 font-mono text-xs"/>
                                                <CopyButton value={jwtPayload}/>
                                            </div>
                                        </div>
                                        {jwtExpiry && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">만료 시간:</span>
                                                <span className="text-sm font-mono">{jwtExpiry.date}</span>
                                                <Badge variant={jwtExpiry.expired ? 'destructive' : 'default'}>
                                                    {jwtExpiry.expired ? '만료됨' : '유효'}
                                                </Badge>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        {/* JSON */}
                        <TabsContent value="json">
                            <div className="space-y-3">
                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    rows={6}
                                    placeholder={'{"name":"John","age":30}'}
                                    className="font-mono text-xs"
                                />
                                <div className="flex gap-2 justify-center items-center">
                                    <Button onClick={formatJson}>포맷팅 (Beautify)</Button>
                                    <Button onClick={minifyJson}>압축 (Minify)</Button>
                                    <Button variant="ghost" size="icon" onClick={handleSwap} title="입력/출력 스왑">
                                        <ArrowUpDown className="h-4 w-4"/>
                                    </Button>
                                </div>
                                <div className="relative">
                                    <Textarea value={output} readOnly rows={6} className="pr-8 font-mono text-xs"/>
                                    <CopyButton value={output}/>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm font-semibold mb-1">인코딩 타입 안내</p>
                <ul className="text-sm text-gray-500 list-disc ml-5 space-y-0.5">
                    <li><strong>Base64</strong>: 바이너리 데이터를 ASCII 문자로 변환</li>
                    <li><strong>URL</strong>: URL에서 사용할 수 없는 문자를 % 인코딩</li>
                    <li><strong>HTML</strong>: HTML 특수문자를 엔티티로 변환</li>
                    <li><strong>Unicode</strong>: 문자를 \uXXXX 형식으로 변환</li>
                    <li><strong>MD5</strong>: 128비트 해시 (단방향)</li>
                    <li><strong>SHA-256</strong>: 256비트 해시 (단방향)</li>
                    <li><strong>JWT</strong>: JSON Web Token 디코딩 (서명 검증 없음)</li>
                    <li><strong>JSON</strong>: JSON 문자열 포맷팅/압축</li>
                </ul>
            </div>
        </div>
    )
}
