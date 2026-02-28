import React, {useCallback, useMemo, useState} from 'react'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '../../components/ui/tabs'
import {Button} from '../../components/ui/button'
import {Textarea} from '../../components/ui/textarea'
import {Switch} from '../../components/ui/switch'
import {Accordion, AccordionItem, AccordionTrigger, AccordionContent} from '../../components/ui/accordion'
import {ArrowLeft, Play, X, Copy} from 'lucide-react'
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

const SEVERITY_CLASS = {
    error: 'bg-red-50 border border-red-200 text-red-800',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border border-blue-200 text-blue-800'
}

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

        if (compatResult.isJsCompatible || compatResult.canConvert) {
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

    const handleCopy = useCallback((text, label) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} 복사됨`)
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

    const currentLang = useMemo(() => languages.find(l => l.id === tabValue) || languages[0], [languages, tabValue])

    return (
        <div className="p-4">
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/util')}>
                    <ArrowLeft className="h-5 w-5"/>
                </Button>
                <h1 className="text-3xl font-bold flex-1">정규식 테스터</h1>
                <Button onClick={handleTest} disabled={!pattern} className="mr-1">
                    <Play className="h-4 w-4 mr-1"/>
                    테스트
                </Button>
                <Button variant="outline" onClick={handleClear}>
                    <X className="h-4 w-4 mr-1"/>
                    초기화
                </Button>
            </div>

            {/* 언어 탭 */}
            <div className="border rounded-md">
                <Tabs value={tabValue} onValueChange={handleTabChange}>
                    <TabsList className="w-full flex border-b rounded-none h-auto">
                        {languages.map(lang => (
                            <TabsTrigger key={lang.id} value={lang.id} className="flex-1 flex flex-col py-2 h-auto">
                                <span>{lang.name}</span>
                                <span className="text-xs text-gray-500 font-normal">{lang.namedGroupSyntax}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {languages.map(lang => (
                        <TabsContent key={lang.id} value={lang.id}>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
                                {/* 왼쪽: 입력 (2/5) */}
                                <div className="md:col-span-2 space-y-4">
                                    {/* 정규식 패턴 입력 */}
                                    <div>
                                        <div className="flex items-center mb-1">
                                            <span className="text-sm font-medium flex-1">정규식 패턴</span>
                                            {pattern && (
                                                <button onClick={() => handleCopy(pattern, '패턴')} className="p-1 rounded hover:bg-gray-100">
                                                    <Copy className="h-3.5 w-3.5 text-gray-500"/>
                                                </button>
                                            )}
                                        </div>
                                        <Textarea
                                            value={pattern}
                                            onChange={(e) => setPattern(e.target.value)}
                                            rows={3}
                                            placeholder={`예: ${lang.namedGroupSyntax.replace('name', 'year')}\\d{4}`}
                                            className={`font-mono text-sm ${syntaxError ? 'border-red-500' : ''}`}
                                        />
                                        {syntaxError && <p className="text-xs text-red-500 mt-1">{syntaxError}</p>}
                                    </div>

                                    {/* 플래그 선택 */}
                                    <div>
                                        <p className="text-sm font-medium mb-2">플래그</p>
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                                {key: 'g', label: 'g (global)'},
                                                {key: 'i', label: 'i (ignore case)'},
                                                {key: 'm', label: 'm (multiline)'},
                                                {key: 's', label: 's (dotAll)'}
                                            ].map(({key, label}) => (
                                                <label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                                    <Switch
                                                        checked={flags[key]}
                                                        onCheckedChange={(checked) => setFlags(prev => ({...prev, [key]: checked}))}
                                                    />
                                                    <span>{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 테스트 문자열 입력 */}
                                    <div>
                                        <div className="flex items-center mb-1">
                                            <span className="text-sm font-medium flex-1">테스트 문자열</span>
                                            {testString && (
                                                <button onClick={() => handleCopy(testString, '테스트 문자열')} className="p-1 rounded hover:bg-gray-100">
                                                    <Copy className="h-3.5 w-3.5 text-gray-500"/>
                                                </button>
                                            )}
                                        </div>
                                        <Textarea
                                            value={testString}
                                            onChange={(e) => setTestString(e.target.value)}
                                            rows={6}
                                            placeholder="테스트할 문자열을 입력하세요"
                                            className="font-mono text-sm"
                                        />
                                    </div>

                                    {/* 예제 패턴 */}
                                    <div>
                                        <p className="text-sm font-medium mb-2">예제 패턴</p>
                                        <div className="flex flex-wrap gap-1">
                                            {EXAMPLE_PATTERNS.map((example, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleLoadExample(example)}
                                                    className="text-xs px-2 py-0.5 border rounded-full hover:bg-gray-100 transition-colors"
                                                >
                                                    {example.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 오른쪽: 결과 (3/5) */}
                                <div className="md:col-span-3 space-y-3">
                                    {/* 호환성 경고 */}
                                    {compatibility?.warnings?.length > 0 && (
                                        <div className="space-y-1">
                                            {compatibility.warnings.map((warn, idx) => (
                                                <div key={idx} className={`rounded p-3 text-sm ${SEVERITY_CLASS[warn.severity] || SEVERITY_CLASS.info}`}>
                                                    <strong>{warn.feature}:</strong> {warn.message}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 매칭 결과 하이라이트 */}
                                    <Accordion type="multiple" defaultValue={['match-result']}>
                                        <AccordionItem value="match-result">
                                            <AccordionTrigger className="font-semibold">
                                                <span className="flex items-center gap-2">
                                                    매칭 결과
                                                    {result && (
                                                        <span className={`text-xs px-2 py-0.5 rounded font-normal ${result.matchCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                            {result.matchCount}개
                                                        </span>
                                                    )}
                                                </span>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="bg-gray-50 border rounded p-3 font-mono text-sm whitespace-pre-wrap break-all min-h-[80px]">
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
                                            </AccordionContent>
                                        </AccordionItem>

                                        {/* 매치 상세 정보 */}
                                        {result && result.matches && result.matches.length > 0 && (
                                            <AccordionItem value="match-detail">
                                                <AccordionTrigger className="font-semibold">매치 상세</AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-2">
                                                        {result.matches.map((match, matchIdx) => (
                                                            <div key={matchIdx} className="bg-gray-50 rounded p-3">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span
                                                                        className="text-xs px-2 py-0.5 rounded font-bold"
                                                                        style={{backgroundColor: HIGHLIGHT_COLORS[matchIdx % HIGHLIGHT_COLORS.length]}}
                                                                    >
                                                                        #{matchIdx + 1}
                                                                    </span>
                                                                    <span className="font-mono text-sm">"{match.fullMatch}"</span>
                                                                    <span className="text-xs text-gray-500">(index: {match.index}~{match.endIndex})</span>
                                                                    <button onClick={() => handleCopy(match.fullMatch, '매치')} className="p-1 rounded hover:bg-gray-200 ml-auto">
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
                                                                                    className={`text-xs px-2 py-0.5 border rounded ${group.captured ? 'border-blue-400 text-blue-700' : 'text-gray-500'}`}
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
                                                                                <span key={name} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                                                                                    {name}: "{value}"
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}

                                        {/* Named Groups 정의 */}
                                        {namedGroups.length > 0 && (
                                            <AccordionItem value="named-groups">
                                                <AccordionTrigger className="font-semibold">
                                                    <span className="flex items-center gap-2">
                                                        Named Groups 정의
                                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-normal">{namedGroups.length}개</span>
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-2">
                                                        {namedGroups.map((group, idx) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <span className="text-xs px-2 py-0.5 border rounded">${group.index + 1}</span>
                                                                <span className="font-mono font-bold text-sm">{group.name}</span>
                                                                <span className="text-xs text-gray-500">패턴 내 위치: {group.position}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}

                                        {/* 감지된 기능 */}
                                        {compatibility?.detectedFeatures?.length > 0 && (
                                            <AccordionItem value="detected-features">
                                                <AccordionTrigger className="font-semibold">감지된 특수 기능</AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-3">
                                                        {compatibility.detectedFeatures.map((feature, idx) => (
                                                            <div key={idx}>
                                                                <p className="text-sm font-medium">{feature.name}</p>
                                                                <p className="text-xs text-gray-500">예시: {feature.example}</p>
                                                                <p className="text-xs text-gray-500">지원 언어: {feature.supportedIn.join(', ')}</p>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {feature.matches.map((m, mIdx) => (
                                                                        <span key={mIdx} className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-mono">
                                                                            {m.value}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}
                                    </Accordion>

                                    {/* 초기 안내 */}
                                    {!result && !compatibility && (
                                        <div className="border rounded p-6 text-center mt-2">
                                            <p className="text-gray-500">정규식 패턴과 테스트 문자열을 입력한 후</p>
                                            <p className="text-gray-500"><strong>테스트</strong> 버튼을 클릭하세요</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    )
}
