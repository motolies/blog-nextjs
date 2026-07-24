const IPV4_ADDRESS_SPACE = 4294967296
const IPV4_MAX_LONG = IPV4_ADDRESS_SPACE - 1

export interface CidrInfo {
    cidr: string
    prefix: number
    networkAddress: string
    broadcastAddress: string
    firstHost: string
    lastHost: string
    netmask: string
    wildcardMask: string
    totalAddresses: number
    usableHosts: number
    networkClass: string
    isPrivate: boolean
    rangeLabel: string
    startLong: number
    endLong: number
}

export interface CidrTableRow {
    prefix: number
    netmask: string
    wildcardMask: string
    totalAddresses: number
    usableHosts: number
}

export interface CidrPreset {
    cidr: string
    description: string
}

interface SpecialRange {
    network: string
    prefix: number
    label: string
    isPrivate: boolean
}

// RFC로 예약된 특수 대역 — 프리픽스가 긴(구체적인) 항목이 우선 매칭된다.
const SPECIAL_RANGES: SpecialRange[] = [
    {network: '0.0.0.0', prefix: 8, label: '현재 네트워크 (RFC1122)', isPrivate: false},
    {network: '10.0.0.0', prefix: 8, label: '사설망 (RFC1918)', isPrivate: true},
    {network: '100.64.0.0', prefix: 10, label: 'CGNAT 공유 대역 (RFC6598)', isPrivate: true},
    {network: '127.0.0.0', prefix: 8, label: '루프백 (RFC1122)', isPrivate: true},
    {network: '169.254.0.0', prefix: 16, label: '링크 로컬 (RFC3927)', isPrivate: true},
    {network: '172.16.0.0', prefix: 12, label: '사설망 (RFC1918)', isPrivate: true},
    {network: '192.0.2.0', prefix: 24, label: '문서용 TEST-NET-1 (RFC5737)', isPrivate: false},
    {network: '192.168.0.0', prefix: 16, label: '사설망 (RFC1918)', isPrivate: true},
    {network: '198.18.0.0', prefix: 15, label: '벤치마크 테스트 (RFC2544)', isPrivate: false},
    {network: '198.51.100.0', prefix: 24, label: '문서용 TEST-NET-2 (RFC5737)', isPrivate: false},
    {network: '203.0.113.0', prefix: 24, label: '문서용 TEST-NET-3 (RFC5737)', isPrivate: false},
    {network: '224.0.0.0', prefix: 4, label: '멀티캐스트 (RFC5771)', isPrivate: false},
    {network: '240.0.0.0', prefix: 4, label: '예약 대역 (RFC1112)', isPrivate: false}
]

export const CIDR_PRESETS: CidrPreset[] = [
    {cidr: '10.0.0.0/8', description: 'RFC1918 사설망 (A 클래스)'},
    {cidr: '172.16.0.0/12', description: 'RFC1918 사설망 (B 클래스)'},
    {cidr: '192.168.0.0/16', description: 'RFC1918 사설망 (C 클래스)'},
    {cidr: '192.168.0.0/24', description: '일반 가정용 공유기 대역'},
    {cidr: '100.64.0.0/10', description: 'CGNAT 공유 대역'},
    {cidr: '127.0.0.0/8', description: '루프백'},
    {cidr: '169.254.0.0/16', description: '링크 로컬'},
    {cidr: '0.0.0.0/0', description: '전체 IPv4 주소'}
]

// IPv4 점10진 표기 검사 — 옥텟 4개, 0~255, 8진수로 오해될 수 있는 선행 0은 거부
export const isValidIpv4 = (ip: string): boolean => {
    if (typeof ip !== 'string') {
        return false
    }

    const octets = ip.trim().split('.')

    if (octets.length !== 4) {
        return false
    }

    return octets.every((octet) => (
        /^\d{1,3}$/.test(octet)
        && Number(octet) <= 255
        && (octet === '0' || !octet.startsWith('0'))
    ))
}

// IPv4 문자열을 32비트 정수로 변환 — 비트 연산은 부호 있는 32비트라 산술 연산으로 처리
export const ipToLong = (ip: string): number => {
    if (!isValidIpv4(ip)) {
        throw new Error(`유효하지 않은 IPv4 주소입니다: ${ip}`)
    }

    return ip.trim().split('.').reduce((accumulator, octet) => accumulator * 256 + Number(octet), 0)
}

// 32비트 정수를 IPv4 문자열로 변환
export const longToIp = (value: number): string => {
    if (!Number.isInteger(value) || value < 0 || value > IPV4_MAX_LONG) {
        throw new Error(`IPv4 범위를 벗어난 값입니다: ${value}`)
    }

    return [
        Math.floor(value / 16777216) % 256,
        Math.floor(value / 65536) % 256,
        Math.floor(value / 256) % 256,
        value % 256
    ].join('.')
}

// 프리픽스 길이에 해당하는 넷마스크 정수값 (예: 12 → 255.240.0.0)
export const netmaskLongFromPrefix = (prefix: number): number => IPV4_ADDRESS_SPACE - 2 ** (32 - prefix)

// 프리픽스별 사용 가능 호스트 수 — /31은 RFC3021 P2P, /32는 단일 호스트로 예외 처리
const countUsableHosts = (prefix: number, totalAddresses: number): number => {
    if (prefix >= 32) {
        return 1
    }

    if (prefix === 31) {
        return 2
    }

    return totalAddresses - 2
}

// 첫 옥텟 기준 전통적 네트워크 클래스 판정
const resolveNetworkClass = (firstOctet: number): string => {
    if (firstOctet < 128) {
        return 'A'
    }

    if (firstOctet < 192) {
        return 'B'
    }

    if (firstOctet < 224) {
        return 'C'
    }

    if (firstOctet < 240) {
        return 'D (멀티캐스트)'
    }

    return 'E (예약)'
}

// 네트워크 주소가 속한 특수 대역을 찾아 가장 구체적인(프리픽스가 긴) 항목을 반환
const resolveSpecialRange = (networkLong: number): SpecialRange | null => {
    let matched: SpecialRange | null = null

    for (const range of SPECIAL_RANGES) {
        const start = ipToLong(range.network)
        const end = start + 2 ** (32 - range.prefix) - 1
        const isMoreSpecific = matched === null || range.prefix > matched.prefix

        if (networkLong >= start && networkLong <= end && isMoreSpecific) {
            matched = range
        }
    }

    return matched
}

// 네트워크 주소 정수값과 프리픽스로 CIDR 상세 정보를 구성
const buildCidrInfo = (networkLong: number, prefix: number): CidrInfo => {
    const totalAddresses = 2 ** (32 - prefix)
    const endLong = networkLong + totalAddresses - 1
    const usableHosts = countUsableHosts(prefix, totalAddresses)
    const isSmallBlock = prefix >= 31
    const specialRange = resolveSpecialRange(networkLong)

    return {
        cidr: `${longToIp(networkLong)}/${prefix}`,
        prefix,
        networkAddress: longToIp(networkLong),
        broadcastAddress: longToIp(endLong),
        firstHost: longToIp(isSmallBlock ? networkLong : networkLong + 1),
        lastHost: longToIp(isSmallBlock ? endLong : endLong - 1),
        netmask: longToIp(netmaskLongFromPrefix(prefix)),
        wildcardMask: longToIp(totalAddresses - 1),
        totalAddresses,
        usableHosts,
        networkClass: resolveNetworkClass(Math.floor(networkLong / 16777216)),
        isPrivate: specialRange ? specialRange.isPrivate : false,
        rangeLabel: specialRange ? specialRange.label : '공인 IP 대역',
        startLong: networkLong,
        endLong
    }
}

// CIDR 문자열을 파싱 — 네트워크 주소가 아닌 입력(10.0.0.5/8)은 네트워크 주소로 정규화, 프리픽스 생략은 /32
export const parseCidr = (input: string): { info: CidrInfo | null; error: string | null } => {
    const value = (input || '').trim()

    if (!value) {
        return {info: null, error: 'CIDR을 입력하세요. (예: 192.168.0.0/24)'}
    }

    const segments = value.split('/')

    if (segments.length > 2) {
        return {info: null, error: 'CIDR 형식이 올바르지 않습니다. (예: 192.168.0.0/24)'}
    }

    const [ipPart, prefixPart] = segments

    if (!isValidIpv4(ipPart)) {
        return {info: null, error: `IPv4 주소 형식이 올바르지 않습니다: ${ipPart || '(비어 있음)'}`}
    }

    let prefix = 32

    if (segments.length === 2) {
        if (!/^\d{1,2}$/.test(prefixPart.trim())) {
            return {info: null, error: '프리픽스는 0~32 사이의 숫자여야 합니다.'}
        }

        prefix = Number(prefixPart.trim())

        if (prefix > 32) {
            return {info: null, error: '프리픽스는 0~32 사이의 숫자여야 합니다.'}
        }
    }

    const ipLong = ipToLong(ipPart)
    const blockSize = 2 ** (32 - prefix)
    const networkLong = ipLong - (ipLong % blockSize)

    return {info: buildCidrInfo(networkLong, prefix), error: null}
}

// 임의의 IP 범위를 덮는 최소 개수의 CIDR 블록으로 분해 (그리디)
export const rangeToCidrBlocks = (startIp: string, endIp: string): { blocks: CidrInfo[]; error: string | null } => {
    if (!isValidIpv4(startIp)) {
        return {blocks: [], error: `시작 IP 형식이 올바르지 않습니다: ${(startIp || '').trim() || '(비어 있음)'}`}
    }

    if (!isValidIpv4(endIp)) {
        return {blocks: [], error: `끝 IP 형식이 올바르지 않습니다: ${(endIp || '').trim() || '(비어 있음)'}`}
    }

    const startLong = ipToLong(startIp)
    const endLong = ipToLong(endIp)

    if (startLong > endLong) {
        return {blocks: [], error: '시작 IP가 끝 IP보다 클 수 없습니다.'}
    }

    const blocks: CidrInfo[] = []
    let current = startLong

    while (current <= endLong) {
        const remaining = endLong - current + 1
        let blockSize = 1

        // 시작 주소의 정렬과 남은 주소 수를 동시에 만족하는 최대 블록 크기를 찾는다
        while (blockSize * 2 <= remaining && current % (blockSize * 2) === 0) {
            blockSize *= 2
        }

        // 부동소수 오차를 피하려고 log2 대신 배수 루프로 프리픽스를 계산한다
        let prefix = 32
        let unit = 1

        while (unit < blockSize) {
            unit *= 2
            prefix -= 1
        }

        blocks.push(buildCidrInfo(current, prefix))
        current += blockSize
    }

    return {blocks, error: null}
}

// CIDR을 더 긴 프리픽스의 서브넷으로 분할 — limit까지만 생성하고 잘림 여부를 함께 반환
export const splitSubnet = (
    cidr: string,
    newPrefix: number,
    limit: number = 1024
): { subnets: CidrInfo[]; totalCount: number; truncated: boolean; error: string | null } => {
    const {info, error} = parseCidr(cidr)

    if (error || !info) {
        return {subnets: [], totalCount: 0, truncated: false, error}
    }

    if (!Number.isInteger(newPrefix) || newPrefix < 0 || newPrefix > 32) {
        return {subnets: [], totalCount: 0, truncated: false, error: '분할 프리픽스는 0~32 사이의 숫자여야 합니다.'}
    }

    if (newPrefix < info.prefix) {
        return {
            subnets: [],
            totalCount: 0,
            truncated: false,
            error: `분할 프리픽스는 원본 프리픽스(/${info.prefix})보다 크거나 같아야 합니다.`
        }
    }

    const totalCount = 2 ** (newPrefix - info.prefix)
    const subnetSize = 2 ** (32 - newPrefix)
    const visibleCount = Math.min(totalCount, Math.max(1, limit))
    const subnets: CidrInfo[] = []

    for (let index = 0; index < visibleCount; index += 1) {
        subnets.push(buildCidrInfo(info.startLong + index * subnetSize, newPrefix))
    }

    return {subnets, totalCount, truncated: totalCount > visibleCount, error: null}
}

// 특정 IP가 CIDR 대역에 포함되는지 판정 — 판정 실패 시 contained는 null
export const isIpInCidr = (ip: string, cidr: string): { contained: boolean | null; info: CidrInfo | null; error: string | null } => {
    if (!isValidIpv4(ip)) {
        return {contained: null, info: null, error: `IPv4 주소 형식이 올바르지 않습니다: ${(ip || '').trim() || '(비어 있음)'}`}
    }

    const {info, error} = parseCidr(cidr)

    if (error || !info) {
        return {contained: null, info: null, error}
    }

    const ipLong = ipToLong(ip)

    return {contained: ipLong >= info.startLong && ipLong <= info.endLong, info, error: null}
}

// /0 ~ /32 프리픽스별 넷마스크·주소 수 대조표
export const CIDR_TABLE: CidrTableRow[] = Array.from({length: 33}, (_, prefix) => {
    const totalAddresses = 2 ** (32 - prefix)

    return {
        prefix,
        netmask: longToIp(netmaskLongFromPrefix(prefix)),
        wildcardMask: longToIp(totalAddresses - 1),
        totalAddresses,
        usableHosts: countUsableHosts(prefix, totalAddresses)
    }
})
