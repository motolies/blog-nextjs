import {useCallback, useMemo, useState} from 'react'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '../../components/ui/tabs'
import {Button} from '../../components/ui/button'
import {Input} from '../../components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select'
import {Accordion, AccordionItem, AccordionTrigger, AccordionContent} from '../../components/ui/accordion'
import {ArrowLeft, BookOpenText, Copy, Network, ScanSearch, Sparkles} from 'lucide-react'
import {toast} from 'sonner'
import {useRouter} from 'next/router'
import {copyTextToClipboard} from '../../util/browserUtils'
import {CIDR_PRESETS, CIDR_TABLE, isIpInCidr, parseCidr, rangeToCidrBlocks, splitSubnet} from '../../util/cidrUtils'

const SPLIT_LIMIT = 1024

const formatCount = (value) => value.toLocaleString('ko-KR')

export default function CidrPage() {
    const router = useRouter()
    const [tabValue, setTabValue] = useState('cidr')

    const [cidrInput, setCidrInput] = useState('172.16.0.0/12')
    const [containsIp, setContainsIp] = useState('')

    const [rangeStart, setRangeStart] = useState('192.168.1.5')
    const [rangeEnd, setRangeEnd] = useState('192.168.1.20')

    const [splitCidr, setSplitCidr] = useState('192.168.0.0/24')
    const [splitPrefix, setSplitPrefix] = useState('26')

    // 입력이 바뀔 때마다 즉시 재계산 — 모두 순수 함수라 useMemo로 파생시킨다
    const cidrResult = useMemo(() => parseCidr(cidrInput), [cidrInput])
    const containsResult = useMemo(() => {
        if (!containsIp.trim()) {
            return null
        }
        return isIpInCidr(containsIp, cidrInput)
    }, [containsIp, cidrInput])
    const rangeResult = useMemo(() => rangeToCidrBlocks(rangeStart, rangeEnd), [rangeStart, rangeEnd])
    const splitSource = useMemo(() => parseCidr(splitCidr), [splitCidr])
    const splitResult = useMemo(() => splitSubnet(splitCidr, Number(splitPrefix), SPLIT_LIMIT), [splitCidr, splitPrefix])

    const rangeTotalAddresses = useMemo(
        () => rangeResult.blocks.reduce((sum, block) => sum + block.totalAddresses, 0),
        [rangeResult]
    )

    // 분할 탭의 선택 가능한 프리픽스 목록 (원본 프리픽스 이상만 허용)
    const splitPrefixOptions = useMemo(() => {
        const minPrefix = splitSource.info ? splitSource.info.prefix : 0
        return CIDR_TABLE.filter((row) => row.prefix >= minPrefix)
    }, [splitSource])

    const handleCopy = useCallback(async (text, label) => {
        try {
            await copyTextToClipboard(text)
            toast.success(`${label} 복사되었습니다.`)
        } catch (e) {
            toast.error(e.message || '클립보드 복사에 실패했습니다.')
        }
    }, [])

    // 대조표에서 프리픽스를 선택하면 현재 입력의 프리픽스만 교체한다
    const handlePrefixPick = useCallback((prefix) => {
        setCidrInput((previous) => {
            const ipPart = previous.trim().split('/')[0] || '0.0.0.0'
            return `${ipPart}/${prefix}`
        })
        setTabValue('cidr')
        toast.info(`/${prefix} 프리픽스를 적용했습니다.`)
    }, [])

    const renderValueCard = (label, value, copyLabel) => (
        <div className="border rounded-md p-3">
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-gray-500 dark:text-[#636d83]">{label}</p>
                <button
                    onClick={() => void handleCopy(value, copyLabel || label)}
                    className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-[rgba(44,49,58,0.7)]"
                    title="복사"
                >
                    <Copy className="h-3.5 w-3.5 text-gray-500 dark:text-[#636d83]"/>
                </button>
            </div>
            <p className="mt-1 font-mono text-sm sm:text-base break-all">{value}</p>
        </div>
    )

    const renderCidrTab = () => (
        <>
            <div className="border rounded-md p-4 mb-4">
                <p className="font-medium mb-3">CIDR 입력</p>
                <div className="relative">
                    <Input
                        value={cidrInput}
                        onChange={(e) => setCidrInput(e.target.value)}
                        placeholder="192.168.0.0/24"
                        className={`pr-8 font-mono ${cidrResult.error ? 'border-red-500' : ''}`}
                    />
                    <button
                        onClick={() => void handleCopy(cidrInput, 'CIDR이')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-[rgba(44,49,58,0.7)]"
                        title="복사"
                    >
                        <Copy className="h-4 w-4 text-gray-500 dark:text-[#636d83]"/>
                    </button>
                </div>
                {cidrResult.error
                    ? <p className="text-xs text-red-500 mt-1">{cidrResult.error}</p>
                    : <p className="text-xs text-gray-500 dark:text-[#636d83] mt-1">네트워크 주소가 아닌 값(10.0.0.5/8)을 입력해도 네트워크 주소로 정규화됩니다.</p>
                }

                <div className="mt-3">
                    <p className="text-xs text-gray-500 dark:text-[#636d83] mb-2">자주 쓰는 대역:</p>
                    <div className="flex flex-wrap gap-1">
                        {CIDR_PRESETS.map((preset) => (
                            <button
                                key={preset.cidr}
                                onClick={() => setCidrInput(preset.cidr)}
                                title={preset.description}
                                className="text-xs px-2 py-0.5 border rounded-full font-mono hover:bg-gray-100 dark:hover:bg-[rgba(44,49,58,0.7)] transition-colors"
                            >
                                {preset.cidr}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {cidrResult.info && (
                <>
                    <div className="border rounded-md p-4 mb-4 bg-blue-50 dark:bg-[rgba(97,175,239,0.08)]">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-xs text-gray-500 dark:text-[#636d83] mb-1">IP 주소 범위</p>
                            <button
                                onClick={() => void handleCopy(`${cidrResult.info.networkAddress} - ${cidrResult.info.broadcastAddress}`, 'IP 범위가')}
                                className="p-0.5 rounded hover:bg-white/60 dark:hover:bg-[rgba(44,49,58,0.7)]"
                                title="복사"
                            >
                                <Copy className="h-4 w-4 text-gray-500 dark:text-[#636d83]"/>
                            </button>
                        </div>
                        <p className="text-base sm:text-xl font-medium font-mono break-all">
                            {cidrResult.info.networkAddress} - {cidrResult.info.broadcastAddress}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="rounded-full border px-2 py-0.5 text-xs font-mono">{cidrResult.info.cidr}</span>
                            <span className="rounded-full border px-2 py-0.5 text-xs">클래스 {cidrResult.info.networkClass}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs ${cidrResult.info.isPrivate
                                ? 'bg-amber-100 text-amber-800 dark:bg-[rgba(229,192,123,0.12)] dark:text-[#e5c07b]'
                                : 'bg-green-100 text-green-800 dark:bg-[rgba(152,195,121,0.12)] dark:text-[#98c379]'}`}>
                                {cidrResult.info.isPrivate ? '사설/특수 대역' : '공인 IP 대역'}
                            </span>
                            <span className="rounded-full bg-gray-100 dark:bg-[rgba(44,49,58,0.7)] px-2 py-0.5 text-xs text-gray-600 dark:text-[#abb2bf]">
                                {cidrResult.info.rangeLabel}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                        {renderValueCard('네트워크 주소', cidrResult.info.networkAddress, '네트워크 주소가')}
                        {renderValueCard('브로드캐스트 주소', cidrResult.info.broadcastAddress, '브로드캐스트 주소가')}
                        {renderValueCard('첫 호스트', cidrResult.info.firstHost, '첫 호스트가')}
                        {renderValueCard('마지막 호스트', cidrResult.info.lastHost, '마지막 호스트가')}
                        {renderValueCard('넷마스크', cidrResult.info.netmask, '넷마스크가')}
                        {renderValueCard('와일드카드 마스크', cidrResult.info.wildcardMask, '와일드카드 마스크가')}
                        {renderValueCard('전체 주소 수', formatCount(cidrResult.info.totalAddresses), '전체 주소 수가')}
                        {renderValueCard('사용 가능 호스트', formatCount(cidrResult.info.usableHosts), '사용 가능 호스트 수가')}
                    </div>

                    <div className="border rounded-md p-4 mb-4">
                        <p className="font-medium mb-3">
                            <span className="flex items-center gap-2">
                                <ScanSearch className="h-4 w-4 text-sky-600"/>
                                IP 포함 여부 검사
                            </span>
                        </p>
                        <Input
                            value={containsIp}
                            onChange={(e) => setContainsIp(e.target.value)}
                            placeholder="172.20.10.1"
                            className={`font-mono ${containsResult?.error ? 'border-red-500' : ''}`}
                        />
                        {containsResult?.error && (
                            <p className="text-xs text-red-500 mt-1">{containsResult.error}</p>
                        )}
                        {containsResult && !containsResult.error && containsResult.contained !== null && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${containsResult.contained
                                    ? 'bg-green-100 text-green-800 dark:bg-[rgba(152,195,121,0.12)] dark:text-[#98c379]'
                                    : 'bg-gray-100 text-gray-600 dark:bg-[rgba(44,49,58,0.7)] dark:text-[#636d83]'}`}>
                                    {containsResult.contained ? '포함됨' : '포함되지 않음'}
                                </span>
                                <span className="font-mono">{containsIp.trim()}</span>
                                <span className="text-gray-500 dark:text-[#636d83]">
                                    은(는) {cidrResult.info.cidr} 대역에
                                    {containsResult.contained ? ' 속합니다.' : ' 속하지 않습니다.'}
                                </span>
                            </div>
                        )}
                        {!containsIp.trim() && (
                            <p className="text-xs text-gray-500 dark:text-[#636d83] mt-1">
                                검사할 IP를 입력하면 위 CIDR 대역에 속하는지 즉시 판정합니다.
                            </p>
                        )}
                    </div>
                </>
            )}
        </>
    )

    const renderRangeTab = () => (
        <>
            <div className="border rounded-md p-4 mb-4">
                <p className="font-medium mb-3">IP 범위 입력</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-[#636d83] mb-1">시작 IP</p>
                        <Input
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value)}
                            placeholder="192.168.1.5"
                            className="font-mono"
                        />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-[#636d83] mb-1">끝 IP</p>
                        <Input
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value)}
                            placeholder="192.168.1.20"
                            className="font-mono"
                        />
                    </div>
                </div>
                {rangeResult.error
                    ? <p className="text-xs text-red-500 mt-2">{rangeResult.error}</p>
                    : <p className="text-xs text-gray-500 dark:text-[#636d83] mt-2">임의의 범위는 하나의 CIDR로 표현되지 않으므로 여러 블록으로 분해됩니다.</p>
                }
            </div>

            {rangeResult.blocks.length > 0 && (
                <div className="border rounded-md p-4 mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <p className="font-medium">
                            CIDR 블록 {rangeResult.blocks.length}개
                            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-[#636d83]">
                                총 {formatCount(rangeTotalAddresses)}개 주소
                            </span>
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleCopy(rangeResult.blocks.map((block) => block.cidr).join('\n'), 'CIDR 목록이')}
                        >
                            <Copy className="h-4 w-4 mr-1"/>
                            전체 복사
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-3 w-12 font-medium text-gray-600 dark:text-[#7c8496]">#</th>
                                    <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">CIDR</th>
                                    <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">범위</th>
                                    <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">넷마스크</th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">주소 수</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rangeResult.blocks.map((block, index) => (
                                    <tr key={block.cidr} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-[rgba(44,49,58,0.5)]">
                                        <td className="py-2 px-3 text-gray-500 dark:text-[#636d83]">{index + 1}</td>
                                        <td className="py-2 px-3 font-mono">
                                            <button
                                                onClick={() => void handleCopy(block.cidr, 'CIDR이')}
                                                className="hover:underline"
                                                title="클릭하면 복사됩니다"
                                            >
                                                {block.cidr}
                                            </button>
                                        </td>
                                        <td className="py-2 px-3 font-mono text-xs">{block.networkAddress} - {block.broadcastAddress}</td>
                                        <td className="py-2 px-3 font-mono text-xs">{block.netmask}</td>
                                        <td className="py-2 px-3 text-right">{formatCount(block.totalAddresses)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    )

    const renderSplitTab = () => (
        <>
            <div className="border rounded-md p-4 mb-4">
                <p className="font-medium mb-3">분할할 CIDR</p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-3">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-[#636d83] mb-1">원본 CIDR</p>
                        <Input
                            value={splitCidr}
                            onChange={(e) => setSplitCidr(e.target.value)}
                            placeholder="192.168.0.0/24"
                            className={`font-mono ${splitSource.error ? 'border-red-500' : ''}`}
                        />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-[#636d83] mb-1">분할 프리픽스</p>
                        <Select value={splitPrefix} onValueChange={setSplitPrefix}>
                            <SelectTrigger className="w-full font-mono">
                                <SelectValue placeholder="/26"/>
                            </SelectTrigger>
                            <SelectContent>
                                {splitPrefixOptions.map((row) => (
                                    <SelectItem key={row.prefix} value={String(row.prefix)}>
                                        /{row.prefix} ({formatCount(row.usableHosts)} 호스트)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {splitResult.error
                    ? <p className="text-xs text-red-500 mt-2">{splitResult.error}</p>
                    : <p className="text-xs text-gray-500 dark:text-[#636d83] mt-2">원본 대역을 동일한 크기의 서브넷으로 나눕니다.</p>
                }
            </div>

            {splitResult.subnets.length > 0 && (
                <div className="border rounded-md p-4 mb-4">
                    <p className="font-medium mb-3">
                        서브넷 {formatCount(splitResult.totalCount)}개
                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-[#636d83]">
                            서브넷당 {formatCount(splitResult.subnets[0].usableHosts)} 호스트
                        </span>
                    </p>
                    {splitResult.truncated && (
                        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-[rgba(229,192,123,0.2)] dark:bg-[rgba(229,192,123,0.08)] dark:text-[#e5c07b]">
                            전체 {formatCount(splitResult.totalCount)}개 중 처음 {formatCount(splitResult.subnets.length)}개만 표시합니다.
                        </p>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-3 w-12 font-medium text-gray-600 dark:text-[#7c8496]">#</th>
                                    <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">네트워크</th>
                                    <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">사용 가능 범위</th>
                                    <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">브로드캐스트</th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">호스트</th>
                                </tr>
                            </thead>
                            <tbody>
                                {splitResult.subnets.map((subnet, index) => (
                                    <tr key={subnet.cidr} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-[rgba(44,49,58,0.5)]">
                                        <td className="py-2 px-3 text-gray-500 dark:text-[#636d83]">{index + 1}</td>
                                        <td className="py-2 px-3 font-mono">
                                            <button
                                                onClick={() => void handleCopy(subnet.cidr, 'CIDR이')}
                                                className="hover:underline"
                                                title="클릭하면 복사됩니다"
                                            >
                                                {subnet.cidr}
                                            </button>
                                        </td>
                                        <td className="py-2 px-3 font-mono text-xs">{subnet.firstHost} - {subnet.lastHost}</td>
                                        <td className="py-2 px-3 font-mono text-xs">{subnet.broadcastAddress}</td>
                                        <td className="py-2 px-3 text-right">{formatCount(subnet.usableHosts)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    )

    const renderGuide = () => (
        <Accordion type="single" collapsible>
            <AccordionItem value="guide" className="mt-4 overflow-hidden rounded-[1.25rem] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(239,246,255,0.92),rgba(248,250,252,0.94))] shadow-[0_14px_34px_rgba(14,116,228,0.08)] dark:border-[rgba(97,175,239,0.2)] dark:bg-[linear-gradient(135deg,rgba(40,44,52,0.92),rgba(37,41,48,0.94))] dark:shadow-[0_14px_34px_rgba(0,0,0,0.15)]">
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
                            <span className="mt-1 block text-base font-semibold tracking-[-0.02em] text-slate-900 dark:text-[#d7dae0]">
                                CIDR 프리픽스 대조표
                            </span>
                            <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-[#abb2bf]">
                                /0부터 /32까지 넷마스크와 주소 수를 한 번에 확인하고, 행을 눌러 바로 적용할 수 있습니다.
                            </span>
                        </span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="border-t border-sky-100/90 bg-white/70 dark:bg-[rgba(33,37,43,0.7)] px-4 pt-4 pb-4">
                        <div className="max-h-96 overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white/95 dark:bg-[rgba(33,37,43,0.95)]">
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-3 w-20 font-medium text-gray-600 dark:text-[#7c8496]">프리픽스</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">넷마스크</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">와일드카드</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">주소 수</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-600 dark:text-[#7c8496]">호스트 수</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {CIDR_TABLE.map((row) => (
                                        <tr
                                            key={row.prefix}
                                            onClick={() => handlePrefixPick(row.prefix)}
                                            className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-[rgba(44,49,58,0.5)] cursor-pointer"
                                        >
                                            <td className="py-2 px-3 font-mono font-bold">/{row.prefix}</td>
                                            <td className="py-2 px-3 font-mono text-xs">{row.netmask}</td>
                                            <td className="py-2 px-3 font-mono text-xs">{row.wildcardMask}</td>
                                            <td className="py-2 px-3 text-right">{formatCount(row.totalAddresses)}</td>
                                            <td className="py-2 px-3 text-right">{formatCount(row.usableHosts)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                <h1 className="text-xl sm:text-3xl font-bold">CIDR Calculator</h1>
                <Network className="h-5 w-5 text-sky-600"/>
            </div>

            <div className="border rounded-md">
                <Tabs value={tabValue} onValueChange={setTabValue}>
                    <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
                        <TabsTrigger value="cidr">
                            <span className="sm:hidden">CIDR → 범위</span>
                            <span className="hidden sm:inline">CIDR → IP 범위</span>
                        </TabsTrigger>
                        <TabsTrigger value="range">
                            <span className="sm:hidden">범위 → CIDR</span>
                            <span className="hidden sm:inline">IP 범위 → CIDR</span>
                        </TabsTrigger>
                        <TabsTrigger value="split">서브넷 분할</TabsTrigger>
                    </TabsList>

                    <div className="p-2 sm:p-4">
                        <TabsContent value="cidr">{renderCidrTab()}</TabsContent>
                        <TabsContent value="range">{renderRangeTab()}</TabsContent>
                        <TabsContent value="split">{renderSplitTab()}</TabsContent>
                    </div>
                </Tabs>
            </div>

            {renderGuide()}

            <div className="mt-4 p-3 bg-gray-100 dark:bg-[rgba(44,49,58,0.7)] rounded-md">
                <p className="text-sm font-semibold mb-1">CIDR이란?</p>
                <p className="text-sm text-gray-500 dark:text-[#636d83]">
                    CIDR(Classless Inter-Domain Routing)은 <span className="font-mono">192.168.0.0/24</span>처럼 네트워크 주소와
                    프리픽스 길이로 IP 대역을 표기하는 방식입니다. 프리픽스는 앞쪽 몇 비트가 네트워크를 가리키는지를 의미하며,
                    남은 비트 수만큼 주소를 담을 수 있습니다(<span className="font-mono">/24</span> → 256개).
                    일반적으로 네트워크 주소와 브로드캐스트 주소는 호스트에 할당하지 않으므로 사용 가능 호스트는 2개 적지만,
                    <span className="font-mono"> /31</span>은 라우터 간 P2P 링크용으로 2개(RFC 3021),
                    <span className="font-mono"> /32</span>는 단일 호스트로 취급합니다.
                    이 도구는 IPv4만 지원하며 모든 계산은 브라우저에서 처리됩니다.
                </p>
            </div>
        </div>
    )
}
