import {useState} from 'react'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '../../components/ui/tabs'
import {Button} from '../../components/ui/button'
import {Input} from '../../components/ui/input'
import {ArrowLeft, Copy, RefreshCw} from 'lucide-react'
import {toast} from 'sonner'
import {getTsid, TSID} from 'tsid-ts'
import {format} from 'date-fns'
import {useRouter} from 'next/router'
import {copyTextToClipboard} from '../../util/browserUtils'

const TSID_EPOCH = 1577836800000

export default function TsidPage() {
    const router = useRouter()
    const [tabValue, setTabValue] = useState('generate')

    const [generatedTsid, setGeneratedTsid] = useState('')
    const [generatedNumber, setGeneratedNumber] = useState('')
    const [generatedDate, setGeneratedDate] = useState('')

    const [tsidInput, setTsidInput] = useState('')
    const [numberResult, setNumberResult] = useState('')
    const [numberInput, setNumberInput] = useState('')
    const [tsidResult, setTsidResult] = useState('')

    const [tsidForDate, setTsidForDate] = useState('')
    const [dateResult, setDateResult] = useState('')

    const handleCopy = async (text) => {
        if (!text) { toast.warning('복사할 내용이 없습니다.'); return }
        try {
            await copyTextToClipboard(text)
            toast.success('클립보드에 복사되었습니다.')
        } catch (e) {
            toast.error(e.message || '클립보드 복사에 실패했습니다.')
        }
    }

    const handleGenerate = () => {
        try {
            const newTsid = getTsid()
            setGeneratedTsid(newTsid.toString())
            setGeneratedNumber(newTsid.toBigInt().toString())
            setGeneratedDate(format(new Date(TSID_EPOCH + newTsid.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS'))
            toast.success('새 TSID가 생성되었습니다.')
        } catch (e) {
            toast.error('TSID 생성에 실패했습니다.')
        }
    }

    const handleTsidToNumber = () => {
        if (!tsidInput.trim()) { toast.warning('TSID를 입력해주세요.'); return }
        try {
            setNumberResult(TSID.fromString(tsidInput.trim()).toBigInt().toString())
        } catch (e) {
            toast.error('유효하지 않은 TSID입니다.')
            setNumberResult('')
        }
    }

    const handleNumberToTsid = () => {
        if (!numberInput.trim()) { toast.warning('숫자를 입력해주세요.'); return }
        try {
            setTsidResult(new TSID(BigInt(numberInput.trim())).toString())
        } catch (e) {
            toast.error('유효하지 않은 숫자입니다.')
            setTsidResult('')
        }
    }

    const handleTsidToDate = () => {
        if (!tsidForDate.trim()) { toast.warning('TSID를 입력해주세요.'); return }
        try {
            const tsid = TSID.fromString(tsidForDate.trim())
            setDateResult(format(new Date(TSID_EPOCH + tsid.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS'))
        } catch (e) {
            toast.error('유효하지 않은 TSID입니다.')
            setDateResult('')
        }
    }

    const CopyButton = ({value}) => (
        <button
            onClick={() => void handleCopy(value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
            title="복사"
        >
            <Copy className="h-4 w-4 text-gray-500"/>
        </button>
    )

    const ReadonlyInputWithCopy = ({label, value}) => (
        <div className="space-y-1">
            <label className="text-sm text-gray-500">{label}</label>
            <div className="relative">
                <Input value={value} readOnly className="pr-8 font-mono"/>
                <CopyButton value={value}/>
            </div>
        </div>
    )

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/util')}>
                    <ArrowLeft className="h-5 w-5"/>
                </Button>
                <h1 className="text-3xl font-bold">TSID Converter</h1>
            </div>

            <div className="border rounded-md">
                <Tabs value={tabValue} onValueChange={setTabValue}>
                    <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
                        <TabsTrigger value="generate">TSID 생성</TabsTrigger>
                        <TabsTrigger value="convert">TSID ↔ 숫자</TabsTrigger>
                        <TabsTrigger value="date">TSID → 날짜</TabsTrigger>
                    </TabsList>

                    <div className="p-4">
                        {/* TSID 생성 */}
                        <TabsContent value="generate">
                            <div className="text-center mb-4">
                                <Button size="lg" onClick={handleGenerate}>
                                    <RefreshCw className="h-4 w-4 mr-2"/>
                                    새 TSID 생성
                                </Button>
                            </div>
                            {generatedTsid && (
                                <div className="space-y-3">
                                    <ReadonlyInputWithCopy label="TSID (문자열)" value={generatedTsid}/>
                                    <ReadonlyInputWithCopy label="숫자 (BigInt)" value={generatedNumber}/>
                                    <ReadonlyInputWithCopy label="생성 시각" value={generatedDate}/>
                                </div>
                            )}
                        </TabsContent>

                        {/* TSID ↔ 숫자 변환 */}
                        <TabsContent value="convert">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p className="font-medium">TSID → 숫자</p>
                                    <Input
                                        value={tsidInput}
                                        onChange={(e) => setTsidInput(e.target.value)}
                                        placeholder="예: 0GXWP1VXZS35J"
                                    />
                                    <Button onClick={handleTsidToNumber} className="w-full">변환</Button>
                                    {numberResult && <ReadonlyInputWithCopy label="숫자 결과" value={numberResult}/>}
                                </div>
                                <div className="space-y-3">
                                    <p className="font-medium">숫자 → TSID</p>
                                    <Input
                                        value={numberInput}
                                        onChange={(e) => setNumberInput(e.target.value)}
                                        placeholder="예: 481294567894561234"
                                    />
                                    <Button onClick={handleNumberToTsid} className="w-full">변환</Button>
                                    {tsidResult && <ReadonlyInputWithCopy label="TSID 결과" value={tsidResult}/>}
                                </div>
                            </div>
                        </TabsContent>

                        {/* TSID → 날짜 */}
                        <TabsContent value="date">
                            <p className="text-sm text-gray-500 mb-3">
                                TSID에 포함된 타임스탬프를 추출하여 날짜/시간으로 변환합니다. (TSID Epoch: 2020-01-01 00:00:00 UTC)
                            </p>
                            <div className="space-y-3">
                                <Input
                                    value={tsidForDate}
                                    onChange={(e) => setTsidForDate(e.target.value)}
                                    placeholder="예: 0GXWP1VXZS35J"
                                />
                                <Button onClick={handleTsidToDate} className="w-full">날짜/시간 추출</Button>
                                {dateResult && <ReadonlyInputWithCopy label="날짜/시간 결과" value={dateResult}/>}
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm font-semibold mb-1">TSID란?</p>
                <p className="text-sm text-gray-500">
                    TSID (Time-Sorted Unique Identifier)는 시간순 정렬이 가능한 고유 식별자입니다.
                    13자리 문자열로 표현되며, 내부에 42비트 타임스탬프와 22비트 랜덤값을 포함합니다.
                </p>
            </div>
        </div>
    )
}
