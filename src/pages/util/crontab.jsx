import {useState, useEffect, useCallback} from 'react'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '../../components/ui/tabs'
import {Button} from '../../components/ui/button'
import {Input} from '../../components/ui/input'
import {Accordion, AccordionItem, AccordionTrigger, AccordionContent} from '../../components/ui/accordion'
import {ArrowLeft, Play, Copy, BookOpenText, Sparkles} from 'lucide-react'
import {toast} from 'sonner'
import {useRouter} from 'next/router'
import {parse, getDay} from 'date-fns'
import {copyTextToClipboard} from '../../util/browserUtils'
import {calculateNextRuns, DAY_NAMES, generateKoreanDescription} from '../../util/crontabUtils'

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

export default function CrontabPage() {
    const router = useRouter()
    const [tabValue, setTabValue] = useState('unix')
    const [isClient, setIsClient] = useState(false)

    const [unixExpression, setUnixExpression] = useState('0 0 * * *')
    const [unixDescription, setUnixDescription] = useState('')
    const [unixNextRuns, setUnixNextRuns] = useState([])
    const [unixError, setUnixError] = useState('')

    const [springExpression, setSpringExpression] = useState('0 0 0 * * *')
    const [springDescription, setSpringDescription] = useState('')
    const [springNextRuns, setSpringNextRuns] = useState([])
    const [springError, setSpringError] = useState('')

    const [runCount, setRunCount] = useState(10)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const handleUnixCalculate = useCallback(() => {
        const {runs, error} = calculateNextRuns(unixExpression, runCount)
        if (error) {
            setUnixError(error)
            setUnixNextRuns([])
            setUnixDescription('')
            toast.error('유효하지 않은 표현식입니다.')
        } else {
            setUnixError('')
            setUnixNextRuns(runs)
            setUnixDescription(generateKoreanDescription(unixExpression, false))
            toast.success('계산 완료')
        }
    }, [unixExpression, runCount])

    const handleSpringCalculate = useCallback(() => {
        const {runs, error} = calculateNextRuns(springExpression, runCount)
        if (error) {
            setSpringError(error)
            setSpringNextRuns([])
            setSpringDescription('')
            toast.error('유효하지 않은 표현식입니다.')
        } else {
            setSpringError('')
            setSpringNextRuns(runs)
            setSpringDescription(generateKoreanDescription(springExpression, true))
            toast.success('계산 완료')
        }
    }, [springExpression, runCount])

    const handleCopy = useCallback(async (text) => {
        try {
            await copyTextToClipboard(text)
            toast.success('클립보드에 복사되었습니다.')
        } catch (e) {
            toast.error(e.message || '클립보드 복사에 실패했습니다.')
        }
    }, [])

    const handlePresetClick = (expression, isSpring) => {
        if (isSpring) {
            setSpringExpression(expression)
        } else {
            setUnixExpression(expression)
        }
    }

    useEffect(() => {
        if (isClient) {
            const {runs, error} = calculateNextRuns(unixExpression, runCount)
            if (!error) {
                setUnixError('')
                setUnixNextRuns(runs)
                setUnixDescription(generateKoreanDescription(unixExpression, false))
            }
        }
    }, [isClient, runCount, unixExpression])

    useEffect(() => {
        if (isClient && tabValue === 'spring') {
            const {runs, error} = calculateNextRuns(springExpression, runCount)
            if (!error) {
                setSpringError('')
                setSpringNextRuns(runs)
                setSpringDescription(generateKoreanDescription(springExpression, true))
            }
        }
    }, [isClient, tabValue, runCount, springExpression])

    if (!isClient) {
        return <div className="p-4">로딩 중...</div>
    }

    const renderExpressionInput = (expression, setExpression, handleCalculate, error, presets, isSpring) => (
        <div className="border rounded-md p-4 mb-4">
            <p className="font-medium mb-3">Cron 표현식 입력</p>
            <div className="flex gap-2 items-start">
                <div className="flex-1">
                    <div className="relative">
                        <Input
                            value={expression}
                            onChange={(e) => setExpression(e.target.value)}
                            placeholder={isSpring ? '초 분 시 일 월 요일' : '분 시 일 월 요일'}
                            className={`pr-8 font-mono ${error ? 'border-red-500' : ''}`}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCalculate() }}
                        />
                        <button
                            onClick={() => void handleCopy(expression)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                            title="복사"
                        >
                            <Copy className="h-4 w-4 text-gray-500"/>
                        </button>
                    </div>
                    {error
                        ? <p className="text-xs text-red-500 mt-1">{error}</p>
                        : <p className="text-xs text-gray-500 mt-1">{isSpring ? '예: 0 0 0 * * * (매일 자정)' : '예: 0 0 * * * (매일 자정)'}</p>
                    }
                </div>
                <Button onClick={handleCalculate} className="shrink-0">
                    <Play className="h-4 w-4 mr-1"/>
                    계산
                </Button>
            </div>
            <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">빠른 입력:</p>
                <div className="flex flex-wrap gap-1">
                    {presets.map((preset) => (
                        <button
                            key={preset.expression}
                            onClick={() => handlePresetClick(preset.expression, isSpring)}
                            title={preset.description}
                            className="text-xs px-2 py-0.5 border rounded-full hover:bg-gray-100 transition-colors"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )

    const renderDescription = (description) => (
        description && (
            <div className="border rounded-md p-4 mb-4 bg-blue-50">
                <p className="text-xs text-gray-500 mb-1">한국어 설명</p>
                <p className="text-lg font-medium">{description}</p>
            </div>
        )
    )

    const renderSettings = () => (
        <div className="border rounded-md p-4 mb-4">
            <p className="font-medium mb-3">설정</p>
            <div>
                <p className="text-sm text-gray-500 mb-2">표시 개수: {runCount}개</p>
                <input
                    type="range"
                    min={1}
                    max={50}
                    value={runCount}
                    onChange={(e) => setRunCount(Number(e.target.value))}
                    className="w-full accent-blue-600"
                />
            </div>
        </div>
    )

    const renderNextRuns = (nextRuns) => (
        nextRuns.length > 0 && (
            <div className="border rounded-md p-4 mb-4">
                <p className="font-medium mb-3">다음 실행 시간 ({nextRuns.length}개)</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 px-3 w-12 font-medium text-gray-600">#</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-600">실행 시간</th>
                                <th className="text-left py-2 px-3 w-24 font-medium text-gray-600">요일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nextRuns.map((run, index) => {
                                const d = parse(run, 'yyyy-MM-dd HH:mm:ss', new Date())
                                return (
                                    <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="py-2 px-3 text-gray-500">{index + 1}</td>
                                        <td className="py-2 px-3 font-mono">{run}</td>
                                        <td className="py-2 px-3">{DAY_NAMES[getDay(d)]}요일</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    )

    const renderGuide = (isSpring) => (
        <Accordion type="single" collapsible>
            <AccordionItem value="guide" className="mb-4 overflow-hidden rounded-[1.25rem] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(239,246,255,0.92),rgba(248,250,252,0.94))] shadow-[0_14px_34px_rgba(14,116,228,0.08)]">
                <AccordionTrigger className="px-4 py-4 font-medium no-underline hover:no-underline">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-[0_12px_30px_rgba(14,116,228,0.22)]">
                            <BookOpenText className="h-5 w-5"/>
                        </span>
                        <span className="min-w-0">
                            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">
                                <Sparkles className="h-3.5 w-3.5"/>
                                눌러서 펼치기
                            </span>
                            <span className="mt-1 block text-base font-semibold tracking-[-0.02em] text-slate-900">
                                Cron 표현식 가이드
                            </span>
                            <span className="mt-1 block text-sm leading-6 text-slate-600">
                                필드 구조, 특수 문자, 자주 쓰는 예시를 한 번에 확인할 수 있습니다.
                            </span>
                        </span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="border-t border-sky-100/90 bg-white/70 px-4 pt-4">
                        <div className="mb-4">
                            <p className="text-sm font-medium mb-2">필드 구조</p>
                            <div className="bg-gray-100 rounded p-3 font-mono overflow-x-auto">
                                {isSpring ? (
                                    <pre className="text-xs m-0">{`┌───────────── 초 (0-59)
│ ┌───────────── 분 (0-59)
│ │ ┌───────────── 시 (0-23)
│ │ │ ┌───────────── 일 (1-31)
│ │ │ │ ┌───────────── 월 (1-12 또는 JAN-DEC)
│ │ │ │ │ ┌───────────── 요일 (0-6 또는 SUN-SAT)
│ │ │ │ │ │
* * * * * *`}</pre>
                                ) : (
                                    <pre className="text-xs m-0">{`┌───────────── 분 (0-59)
│ ┌───────────── 시 (0-23)
│ │ ┌───────────── 일 (1-31)
│ │ │ ┌───────────── 월 (1-12 또는 JAN-DEC)
│ │ │ │ ┌───────────── 요일 (0-6 또는 SUN-SAT, 0=일요일)
│ │ │ │ │
* * * * *`}</pre>
                                )}
                            </div>
                        </div>

                        <hr className="my-4"/>

                        <div className="mb-4">
                            <p className="text-sm font-medium mb-2">특수 문자</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-3 w-16 font-medium text-gray-600">문자</th>
                                            <th className="text-left py-2 px-3 w-32 font-medium text-gray-600">의미</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">예시</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SPECIAL_CHARS.map((item) => (
                                            <tr key={item.char} className="border-b last:border-0">
                                                <td className="py-2 px-3 font-mono font-bold">{item.char}</td>
                                                <td className="py-2 px-3">{item.meaning}</td>
                                                <td className="py-2 px-3 font-mono text-xs">{item.example}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <hr className="my-4"/>

                        <div>
                            <p className="text-sm font-medium mb-2">자주 사용하는 예시</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">표현식</th>
                                            <th className="text-left py-2 px-3 font-medium text-gray-600">설명</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(isSpring ? SPRING_PRESETS : UNIX_PRESETS).map((preset) => (
                                            <tr
                                                key={preset.expression}
                                                className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handlePresetClick(preset.expression, isSpring)}
                                            >
                                                <td className="py-2 px-3 font-mono">{preset.expression}</td>
                                                <td className="py-2 px-3">{preset.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )

    return (
        <div className="p-2 sm:p-4">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/util')}>
                    <ArrowLeft className="h-5 w-5"/>
                </Button>
                <h1 className="text-xl sm:text-3xl font-bold">Crontab Calculator</h1>
            </div>

            <div className="border rounded-md">
                <Tabs value={tabValue} onValueChange={setTabValue}>
                    <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
                        <TabsTrigger value="unix">
                            <span className="sm:hidden">Unix (5필드)</span>
                            <span className="hidden sm:inline">Unix Crontab (5필드)</span>
                        </TabsTrigger>
                        <TabsTrigger value="spring">
                            <span className="sm:hidden">Spring (6필드)</span>
                            <span className="hidden sm:inline">Spring Scheduler (6필드)</span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="p-2 sm:p-4">
                        <TabsContent value="unix">
                            {renderExpressionInput(unixExpression, setUnixExpression, handleUnixCalculate, unixError, UNIX_PRESETS, false)}
                            {renderDescription(unixDescription)}
                            {renderSettings()}
                            {renderNextRuns(unixNextRuns)}
                            {renderGuide(false)}
                        </TabsContent>

                        <TabsContent value="spring">
                            {renderExpressionInput(springExpression, setSpringExpression, handleSpringCalculate, springError, SPRING_PRESETS, true)}
                            {renderDescription(springDescription)}
                            {renderSettings()}
                            {renderNextRuns(springNextRuns)}
                            {renderGuide(true)}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm font-semibold mb-1">Crontab이란?</p>
                <p className="text-sm text-gray-500">
                    Crontab은 Unix 계열 운영체제에서 주기적인 작업을 예약하기 위한 스케줄링 시스템입니다.
                    표준 Unix crontab은 5개 필드(분, 시, 일, 월, 요일)를 사용하고,
                    Spring Framework의 @Scheduled 어노테이션은 초 단위까지 지정할 수 있는 6개 필드를 사용합니다.
                </p>
            </div>
        </div>
    )
}
