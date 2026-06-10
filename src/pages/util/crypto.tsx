import {useState, useEffect} from 'react'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '../../components/ui/tabs'
import {Button} from '../../components/ui/button'
import {Textarea} from '../../components/ui/textarea'
import {Input} from '../../components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select'
import {ArrowUpDown, ArrowLeft, ChevronDown, ChevronUp, Copy, Eye, EyeOff, Settings2} from 'lucide-react'
import {toast} from 'sonner'
import {useRouter} from 'next/router'
import {copyTextToClipboard} from '../../util/browserUtils'
import {
    DEFAULT_AES_PBKDF2_OPTIONS,
    decryptAesPbkdf2,
    decryptAesRawKey,
    encryptAesPbkdf2,
    encryptAesRawKey,
    utf8ByteLength
} from '../../util/cryptoUtils'

function CopyButton({value, onCopy}) {
    return (
        <button
            onClick={() => void onCopy(value)}
            className="absolute right-2 top-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-[rgba(44,49,58,0.7)]"
            title="복사"
        >
            <Copy className="h-4 w-4 text-gray-500 dark:text-[#636d83]"/>
        </button>
    )
}

const TEXTAREA_MIN_HEIGHT_CLASS = 'min-h-[15rem] resize-y'

// 고급 설정 입력값은 문자열로 보관하고 실행 시 숫자로 파싱한다
const DEFAULT_OPTION_INPUTS = {
    keyLength: String(DEFAULT_AES_PBKDF2_OPTIONS.keyLength),
    iterations: String(DEFAULT_AES_PBKDF2_OPTIONS.iterations),
    saltLength: String(DEFAULT_AES_PBKDF2_OPTIONS.saltLength),
    ivLength: String(DEFAULT_AES_PBKDF2_OPTIONS.ivLength)
}

const AES_MODES = [
    {
        id: 'pbkdf2',
        label: 'PBKDF2 + AES-CBC (enc:v1 포맷)',
        keyPlaceholder: '패스프레이즈 (PBKDF2로 키 유도)',
        inputPlaceholder: '평문 또는 enc:v1:... 형식의 암호문을 입력하세요',
        formatNote: ''
    },
    {
        id: 'rawkey',
        label: 'Raw Key AES-CBC (Zero IV, 레거시)',
        keyPlaceholder: 'Secret Key (UTF-8 기준 16/24/32바이트)',
        inputPlaceholder: '평문 또는 Base64 암호문을 입력하세요',
        formatNote: 'IV가 0으로 고정되어 같은 입력은 항상 같은 출력이 나옵니다. 결과는 표준 Base64입니다. 레거시 호환용으로, 신규 데이터에는 사용을 권장하지 않습니다.'
    }
]

export default function CryptoPage() {
    const router = useRouter()
    const [tabValue, setTabValue] = useState('aes')
    const [isClient, setIsClient] = useState(false)

    const [aesMode, setAesMode] = useState('pbkdf2')
    const [secretKey, setSecretKey] = useState('')
    const [showKey, setShowKey] = useState(false)
    const [input, setInput] = useState('')
    const [output, setOutput] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [optionInputs, setOptionInputs] = useState(DEFAULT_OPTION_INPUTS)

    useEffect(() => {
        setIsClient(true)
    }, [])

    // 탭/모드 변경 시 입출력만 초기화 (키는 유지)
    useEffect(() => {
        setInput('')
        setOutput('')
    }, [tabValue, aesMode])

    const currentMode = AES_MODES.find((mode) => mode.id === aesMode) ?? AES_MODES[0]
    const keyByteLength = utf8ByteLength(secretKey)

    // PBKDF2 모드의 포맷 설명은 현재 설정값을 반영하여 동적으로 구성한다
    const formatNote = aesMode === 'pbkdf2'
        ? `salt(${optionInputs.saltLength}) + iv(${optionInputs.ivLength}) + 암호문을 URL-safe Base64(패딩 없음)로 인코딩하고 enc:v1: 접두어를 붙입니다. salt/IV가 매번 랜덤이라 같은 입력도 결과가 매번 다릅니다.`
        : currentMode.formatNote

    // 고급 설정 입력 문자열을 숫자 옵션으로 변환한다 (유효성 검증은 cryptoUtils 에서 수행)
    const parsePbkdf2Options = () => ({
        keyLength: Number(optionInputs.keyLength),
        iterations: Number(optionInputs.iterations),
        saltLength: Number(optionInputs.saltLength),
        ivLength: Number(optionInputs.ivLength)
    })

    const updateOption = (field, value) => {
        setOptionInputs((prev) => ({...prev, [field]: value}))
    }

    const handleCopy = async (text) => {
        if (!text) {
            toast.warning('복사할 내용이 없습니다.')
            return
        }

        try {
            await copyTextToClipboard(text)
            toast.success('클립보드에 복사되었습니다.')
        } catch (e) {
            toast.error(e.message || '클립보드 복사에 실패했습니다.')
        }
    }

    const handleSwap = () => {
        const temp = input
        setInput(output)
        setOutput(temp)
    }

    // 암복호화 실행 전 키/입력값 존재 여부를 검증한다.
    const validateInputs = () => {
        if (!secretKey) {
            toast.warning('키를 입력하세요.')
            return false
        }
        if (!input) {
            toast.warning('입력값을 입력하세요.')
            return false
        }
        return true
    }

    const handleEncrypt = async () => {
        if (!validateInputs()) return
        try {
            const result = aesMode === 'pbkdf2'
                ? await encryptAesPbkdf2(input, secretKey, parsePbkdf2Options())
                : await encryptAesRawKey(input, secretKey)
            setOutput(result)
            toast.success('암호화 완료')
        } catch (e) {
            setOutput('')
            toast.error('암호화 실패: ' + e.message)
        }
    }

    const handleDecrypt = async () => {
        if (!validateInputs()) return
        try {
            const result = aesMode === 'pbkdf2'
                ? await decryptAesPbkdf2(input, secretKey, parsePbkdf2Options())
                : await decryptAesRawKey(input, secretKey)
            setOutput(result)
            toast.success('복호화 완료')
        } catch (e) {
            setOutput('')
            toast.error('복호화 실패: ' + e.message)
        }
    }

    if (!isClient) {
        return <div className="p-4 flex justify-center items-center min-h-[50vh]">로딩 중...</div>
    }

    return (
        <div className="p-2 sm:p-4">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/util')}>
                    <ArrowLeft className="h-5 w-5"/>
                </Button>
                <h1 className="text-xl sm:text-3xl font-bold">암호화 도구</h1>
            </div>

            <div className="border rounded-md">
                <Tabs value={tabValue} onValueChange={setTabValue}>
                    <TabsList className="w-full flex h-auto border-b rounded-none justify-start px-2 py-1 gap-1 overflow-x-auto">
                        <TabsTrigger value="aes" className="flex-none">AES</TabsTrigger>
                    </TabsList>

                    <div className="p-2 sm:p-4">
                        <TabsContent value="aes">
                            <div className="space-y-3">
                                <Select value={aesMode} onValueChange={setAesMode}>
                                    <SelectTrigger className="w-full sm:w-96">
                                        <SelectValue placeholder="암호화 모드 선택"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AES_MODES.map((mode) => (
                                            <SelectItem key={mode.id} value={mode.id}>{mode.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div>
                                    <div className="relative">
                                        <Input
                                            type={showKey ? 'text' : 'password'}
                                            value={secretKey}
                                            onChange={(e) => setSecretKey(e.target.value)}
                                            placeholder={currentMode.keyPlaceholder}
                                            className="pr-9 font-mono"
                                            autoComplete="off"
                                        />
                                        <button
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-[rgba(44,49,58,0.7)]"
                                            title={showKey ? '키 숨기기' : '키 보기'}
                                            type="button"
                                        >
                                            {showKey
                                                ? <EyeOff className="h-4 w-4 text-gray-500 dark:text-[#636d83]"/>
                                                : <Eye className="h-4 w-4 text-gray-500 dark:text-[#636d83]"/>}
                                        </button>
                                    </div>
                                    {aesMode === 'rawkey' && secretKey && (
                                        <p className={`mt-1 text-xs ${[16, 24, 32].includes(keyByteLength) ? 'text-gray-500 dark:text-[#636d83]' : 'text-red-500'}`}>
                                            현재 {keyByteLength}바이트 {[16, 24, 32].includes(keyByteLength) ? '(사용 가능)' : '(16/24/32바이트 필요)'}
                                        </p>
                                    )}
                                </div>

                                {aesMode === 'pbkdf2' && (
                                    <div>
                                        <button
                                            onClick={() => setShowAdvanced(!showAdvanced)}
                                            className="flex items-center gap-1 text-sm text-gray-500 dark:text-[#636d83] hover:text-gray-700 dark:hover:text-gray-300"
                                            type="button"
                                        >
                                            <Settings2 className="h-4 w-4"/>
                                            고급 설정
                                            {showAdvanced ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                                        </button>

                                        {showAdvanced && (
                                            <div className="mt-2 p-3 border rounded-md space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-[#636d83] mb-1 block">키 길이 (bit)</label>
                                                        <Select value={optionInputs.keyLength} onValueChange={(value) => updateOption('keyLength', value)}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="128">128</SelectItem>
                                                                <SelectItem value="192">192</SelectItem>
                                                                <SelectItem value="256">256</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-[#636d83] mb-1 block">반복 횟수 (PBKDF2)</label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={optionInputs.iterations}
                                                            onChange={(e) => updateOption('iterations', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-[#636d83] mb-1 block">Salt 길이 (byte)</label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={64}
                                                            value={optionInputs.saltLength}
                                                            onChange={(e) => updateOption('saltLength', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 dark:text-[#636d83] mb-1 block">IV 길이 (byte)</label>
                                                        <Input
                                                            type="number"
                                                            value={optionInputs.ivLength}
                                                            onChange={(e) => updateOption('ivLength', e.target.value)}
                                                        />
                                                        {optionInputs.ivLength !== '16' && (
                                                            <p className="mt-1 text-xs text-red-500">AES-CBC의 IV는 16바이트여야 합니다.</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => setOptionInputs(DEFAULT_OPTION_INPUTS)}>
                                                    기본값으로 재설정
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={currentMode.inputPlaceholder}
                                    rows={10}
                                    className={`${TEXTAREA_MIN_HEIGHT_CLASS} font-mono text-sm`}
                                />

                                <div className="flex gap-2 justify-center items-center">
                                    <Button onClick={handleEncrypt}>암호화</Button>
                                    <Button onClick={handleDecrypt}>복호화</Button>
                                    <Button variant="ghost" size="icon" onClick={handleSwap} title="입력/출력 스왑">
                                        <ArrowUpDown className="h-4 w-4"/>
                                    </Button>
                                </div>

                                <div className="relative">
                                    <Textarea
                                        value={output}
                                        readOnly
                                        rows={10}
                                        className={`${TEXTAREA_MIN_HEIGHT_CLASS} pr-8 font-mono text-sm`}
                                        placeholder="출력"
                                    />
                                    <CopyButton value={output} onCopy={handleCopy}/>
                                </div>

                                <p className="text-xs text-gray-500 dark:text-[#636d83]">{formatNote}</p>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <div className="mt-4 p-3 bg-gray-100 dark:bg-[rgba(44,49,58,0.7)] rounded-md">
                <p className="text-sm font-semibold mb-1">암호화 모드 안내</p>
                <ul className="text-sm text-gray-500 dark:text-[#636d83] list-disc ml-5 space-y-0.5">
                    <li><strong>PBKDF2 + AES-CBC</strong>: 패스프레이즈에서 PBKDF2(SHA-256)로 키를 유도. 키 길이/반복 횟수/salt·IV 길이는 고급 설정에서 변경 가능 (기본 256bit/8192회/16/16, enc:v1: 마커 암호문 호환)</li>
                    <li><strong>Raw Key AES-CBC</strong>: 키 문자열의 UTF-8 바이트를 그대로 AES 키로 사용 (16/24/32바이트). 고정 Zero IV 레거시 포맷</li>
                    <li>키와 데이터는 서버로 전송되지 않으며, 모든 연산은 브라우저(Web Crypto API)에서만 수행됩니다</li>
                </ul>
            </div>
        </div>
    )
}
