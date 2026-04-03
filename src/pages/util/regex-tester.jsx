import React, {useCallback, useMemo, useState} from 'react'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '../../components/ui/tabs'
import {Button} from '../../components/ui/button'
import {Textarea} from '../../components/ui/textarea'
import {Input} from '../../components/ui/input'
import {Switch} from '../../components/ui/switch'
import {ArrowLeft, Play, X, Copy, TestTubeDiagonal} from 'lucide-react'
import {toast} from 'sonner'
import {useRouter} from 'next/router'
import {
    analyzeCompatibility,
    executeRegexTest,
    EXAMPLE_PATTERNS,
    getHighlightSegments,
    getSupportedLanguages,
    HIGHLIGHT_COLORS,
    parseNamedGroups,
    validateBasicSyntax
} from '../../util/regexValidator'
import {copyTextToClipboard} from '../../util/browserUtils'

export default function RegexTester() {
    const router = useRouter()
    const languages = useMemo(() => getSupportedLanguages(), [])
    const [tabValue, setTabValue] = useState(() => getSupportedLanguages()[0]?.id || 'javascript')
    const language = tabValue

    const [pattern, setPattern] = useState('')
    const [testString, setTestString] = useState('')
    const [flags, setFlags] = useState({g: true, i: false, m: false, s: false})

    const [result, setResult] = useState(null)
    const [compatibility, setCompatibility] = useState(null)
    const [syntaxError, setSyntaxError] = useState(null)

    const handleTabChange = useCallback((langId) => {
        setTabValue(langId)
        setResult(null)
        setCompatibility(null)
    }, [])

    const handleTest = useCallback(() => {
        const syntaxResult = validateBasicSyntax(pattern)
        if (!syntaxResult.isValid) {
            setSyntaxError(syntaxResult.errors.join(', '))
            setResult(null)
            setCompatibility(null)
            toast.error('정규식 문법 오류가 있습니다.')
            return
        }
        setSyntaxError(null)

        const compatResult = analyzeCompatibility(pattern, language)
        setCompatibility(compatResult)

        if (compatResult.canRunInBrowser || compatResult.canConvert) {
            const patternToTest = compatResult.canConvert ? compatResult.convertedPattern : pattern
            const testResult = executeRegexTest(patternToTest, testString, flags, language)

            if (testResult.success) {
                setResult(testResult)
                toast.success(`${testResult.matchCount}개의 매치를 찾았습니다.`)
            } else {
                setResult(null)
                setSyntaxError(testResult.error)
                toast.error(`정규식 오류: ${testResult.error}`)
            }
        } else {
            setResult(null)
            toast.warning('이 패턴은 JavaScript에서 실행할 수 없습니다.')
        }
    }, [pattern, testString, language, flags])

    const handleClear = useCallback(() => {
        setPattern('')
        setTestString('')
        setResult(null)
        setCompatibility(null)
        setSyntaxError(null)
        setFlags({g: true, i: false, m: false, s: false})
        toast.info('초기화되었습니다.')
    }, [])

    const handleLoadExample = useCallback((example) => {
        setPattern(example.pattern)
        setTestString(example.testString)
        setResult(null)
        setCompatibility(null)
        setSyntaxError(null)
        toast.info(`"${example.name}" 예제를 로드했습니다.`)
    }, [])

    const handleCopy = useCallback(async (text, label) => {
        try {
            await copyTextToClipboard(text)
            toast.success(`${label} 복사됨`)
        } catch (e) {
            toast.error(e.message || `${label} 복사 실패`)
        }
    }, [])

    const highlightSegments = useMemo(() => {
        if (!result || !result.matches || result.matches.length === 0) {
            return [{text: testString || '', isMatch: false}]
        }
        return getHighlightSegments(testString, result.matches)
    }, [testString, result])

    const namedGroups = useMemo(() => {
        return parseNamedGroups(pattern, language)
    }, [pattern, language])

    const currentLang = languages.find(l => l.id === tabValue) || languages[0]

    return (
        <div className="p-2 sm:p-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/util')}>
                    <ArrowLeft className="h-5 w-5"/>
                </Button>
                <h1 className="text-xl sm:text-3xl font-bold">정규식 테스터</h1>
                <div className="ml-auto flex gap-2">
                    <Button size="sm" onClick={handleTest} disabled={!pattern}>
                        <Play className="mr-1 h-4 w-4"/> 테스트
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleClear}>
                        <X className="mr-1 h-4 w-4"/> 초기화
                    </Button>
                </div>
            </div>

            <div className="border rounded-md">
                <Tabs value={tabValue} onValueChange={handleTabChange}>
                    <TabsList className="w-full grid grid-cols-4 h-auto border-b rounded-none">
                        {languages.map(lang => (
                            <TabsTrigger key={lang.id} value={lang.id}>{lang.name}</TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* 왼쪽: 입력 영역 */}
                            <div className="space-y-4">
                                <div className="border rounded-md p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium">정규식 패턴</p>
                                        {pattern && (
                                            <button onClick={() => void handleCopy(pattern, '패턴')} className="p-1 rounded hover:bg-gray-100">
                                                <Copy className="h-4 w-4 text-gray-500"/>
                                            </button>
                                        )}
                                    </div>
                                    <Input
                                        value={pattern}
                                        onChange={(e) => setPattern(e.target.value)}
                                        placeholder={`예: ${currentLang.namedGroupSyntax.replace('name', 'year')}\\d{4}-\\d{2}`}
                                        className={`font-mono text-sm ${syntaxError ? 'border-red-500' : ''}`}
                                    />
                                    {syntaxError && <p className="text-xs text-red-500 mt-1">{syntaxError}</p>}
                                </div>

                                <div className="border rounded-md p-4">
                                    <p className="font-medium mb-2">실행 옵션 (Flags)</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {[
                                            {key: 'g', label: 'g (global)'},
                                            {key: 'i', label: 'i (ignore case)'},
                                            {key: 'm', label: 'm (multiline)'},
                                            {key: 's', label: 's (dotAll)'}
                                        ].map(({key, label}) => (
                                            <label key={key} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2 text-sm">
                                                <span>{label}</span>
                                                <Switch
                                                    checked={flags[key]}
                                                    onCheckedChange={(checked) => setFlags(prev => ({...prev, [key]: checked}))}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="border rounded-md p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium">테스트 문자열</p>
                                        {testString && (
                                            <button onClick={() => void handleCopy(testString, '테스트 문자열')} className="p-1 rounded hover:bg-gray-100">
                                                <Copy className="h-4 w-4 text-gray-500"/>
                                            </button>
                                        )}
                                    </div>
                                    <Textarea
                                        value={testString}
                                        onChange={(e) => setTestString(e.target.value)}
                                        rows={10}
                                        placeholder="테스트할 문자열을 입력하세요"
                                        className="min-h-[12rem] resize-y font-mono text-sm"
                                    />
                                </div>

                                <div className="border rounded-md p-4">
                                    <p className="font-medium mb-2">예제 패턴</p>
                                    <div className="flex flex-wrap gap-1">
                                        {EXAMPLE_PATTERNS.map((example, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleLoadExample(example)}
                                                className="text-xs px-2.5 py-1 border rounded-full hover:bg-gray-100 transition-colors"
                                            >
                                                {example.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 오른쪽: 결과 영역 */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="border rounded-md p-3">
                                        <p className="text-xs text-gray-500">Language</p>
                                        <p className="text-lg font-semibold">{currentLang.name}</p>
                                    </div>
                                    <div className="border rounded-md p-3">
                                        <p className="text-xs text-gray-500">Syntax</p>
                                        <p className="font-mono text-sm mt-1">{currentLang.namedGroupSyntax}</p>
                                    </div>
                                    <div className="border rounded-md p-3">
                                        <p className="text-xs text-gray-500">Result</p>
                                        <p className="text-lg font-semibold">{result?.matchCount ?? 0} matches</p>
                                    </div>
                                </div>

                                {compatibility?.warnings?.length > 0 && (
                                    <div className="space-y-2">
                                        {compatibility.warnings.map((warn, idx) => (
                                            <div key={idx} className={`border rounded-md p-3 text-sm ${
                                                warn.severity === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
                                                warn.severity === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' :
                                                'border-sky-200 bg-sky-50 text-sky-800'
                                            }`}>
                                                <strong>{warn.feature}:</strong> {warn.message}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="border rounded-md p-4">
                                    <p className="font-semibold mb-3">
                                        <span className="flex items-center gap-2">
                                            <TestTubeDiagonal className="h-4 w-4 text-sky-600"/>
                                            매칭 결과
                                            {result && (
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-normal ${result.matchCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {result.matchCount}개
                                                </span>
                                            )}
                                        </span>
                                    </p>
                                    <div className="min-h-[12rem] border rounded-md bg-gray-50 p-4 font-mono text-sm whitespace-pre-wrap break-all">
                                        {highlightSegments.map((segment, idx) => (
                                            segment.isMatch ? (
                                                <span
                                                    key={idx}
                                                    style={{backgroundColor: segment.color, padding: '2px 4px', borderRadius: '3px', fontWeight: 'bold'}}
                                                    title={`Match ${segment.matchIndex + 1}`}
                                                >
                                                    {segment.text}
                                                </span>
                                            ) : (
                                                <span key={idx}>{segment.text}</span>
                                            )
                                        ))}
                                        {!testString && (
                                            <span className="text-gray-400">테스트 문자열을 입력하세요</span>
                                        )}
                                    </div>
                                </div>

                                {result && result.matches && result.matches.length > 0 && (
                                    <div className="border rounded-md p-4">
                                        <p className="font-semibold mb-3">매치 상세</p>
                                        <div className="space-y-2">
                                            {result.matches.map((match, matchIdx) => (
                                                <div key={matchIdx} className="border rounded-md bg-gray-50 p-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span
                                                            className="rounded-full px-2 py-0.5 text-xs font-bold"
                                                            style={{backgroundColor: HIGHLIGHT_COLORS[matchIdx % HIGHLIGHT_COLORS.length]}}
                                                        >
                                                            #{matchIdx + 1}
                                                        </span>
                                                        <span className="font-mono text-sm">&quot;{match.fullMatch}&quot;</span>
                                                        <span className="text-xs text-gray-500">(index: {match.index}~{match.endIndex})</span>
                                                        <button onClick={() => void handleCopy(match.fullMatch, '매치')} className="p-1 rounded hover:bg-gray-200 ml-auto">
                                                            <Copy className="h-3.5 w-3.5 text-gray-500"/>
                                                        </button>
                                                    </div>
                                                    {match.groups.length > 0 && (
                                                        <div className="mt-2">
                                                            <span className="text-xs text-gray-500">그룹: </span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {match.groups.map((group, gIdx) => (
                                                                    <span
                                                                        key={gIdx}
                                                                        className={`rounded-full border px-2 py-0.5 text-xs ${group.captured ? 'border-blue-400 text-blue-700' : 'text-gray-500'}`}
                                                                    >
                                                                        ${group.index}: {group.captured ? `"${group.value}"` : '(미캡처)'}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {match.hasNamedGroups && (
                                                        <div className="mt-2">
                                                            <span className="text-xs text-gray-500">Named Groups: </span>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {Object.entries(match.namedGroups).map(([name, value]) => (
                                                                    <span key={name} className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                                                                        {name}: &quot;{value}&quot;
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {namedGroups.length > 0 && (
                                    <div className="border rounded-md p-4">
                                        <p className="font-semibold mb-3">
                                            <span className="flex items-center gap-2">
                                                Named Groups 정의
                                                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-normal text-purple-800">{namedGroups.length}개</span>
                                            </span>
                                        </p>
                                        <div className="space-y-2">
                                            {namedGroups.map((group, idx) => (
                                                <div key={idx} className="flex flex-wrap items-center gap-2 border rounded-md bg-gray-50 px-3 py-2">
                                                    <span className="rounded-full border px-2 py-0.5 text-xs">${group.index + 1}</span>
                                                    <span className="font-mono font-bold text-sm">{group.name}</span>
                                                    <span className="text-xs text-gray-500">패턴 내 위치: {group.position}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {compatibility?.detectedFeatures?.length > 0 && (
                                    <div className="border rounded-md p-4">
                                        <p className="font-semibold mb-3">감지된 특수 기능</p>
                                        <div className="space-y-2">
                                            {compatibility.detectedFeatures.map((feature, idx) => (
                                                <div key={idx} className="border rounded-md bg-gray-50 p-3">
                                                    <p className="text-sm font-medium">{feature.name}</p>
                                                    <p className="text-xs text-gray-500">예시: {feature.example}</p>
                                                    <p className="text-xs text-gray-500">지원 언어: {feature.supportedIn.join(', ')}</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {feature.matches.map((m, mIdx) => (
                                                            <span key={mIdx} className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-mono text-orange-800">
                                                                {m.value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!result && !compatibility && (
                                    <div className="border border-dashed rounded-md p-8 text-center text-sm text-gray-500">
                                        <p>정규식 패턴과 테스트 문자열을 입력한 뒤</p>
                                        <p className="mt-1"><strong>테스트</strong> 버튼을 눌러 결과를 확인하세요.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Tabs>
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm font-semibold mb-1">정규식 테스터 안내</p>
                <ul className="text-sm text-gray-500 list-disc ml-5 space-y-0.5">
                    <li>브라우저의 JavaScript 엔진으로 실행되므로 일부 언어별 고유 기능은 호환성 경고가 표시됩니다.</li>
                    <li><strong>Python</strong>의 Named Group 문법 (?P&lt;name&gt;...)은 자동으로 JavaScript 형식으로 변환됩니다.</li>
                    <li>각 언어의 Named Group 문법은 상단 Syntax 카드에서 확인할 수 있습니다.</li>
                </ul>
            </div>
        </div>
    )
}
