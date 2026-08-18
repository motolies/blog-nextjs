import {format, isValid} from 'date-fns'

// 오프셋(Z 또는 ±HH:MM / ±HHMM)이 문자열 끝에 붙어있는지 판별한다.
const OFFSET_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/

// 서버 시간 값을 Date로 파싱한다.
// - epoch number: 그대로 파싱
// - 오프셋 포함 문자열(신 백엔드 Instant ISO, Jira 시간 등): 그대로 파싱
// - 오프셋 없는 naive 문자열(구 백엔드 UTC 벽시계): 'Z'를 붙여 UTC로 해석
// 파싱 불가한 값은 null을 반환한다.
export const parseServerDate = (input: string | number | null | undefined): Date | null => {
    if (input === null || input === undefined || input === '') {
        return null
    }
    const date = typeof input === 'number'
        ? new Date(input)
        : new Date(OFFSET_PATTERN.test(input) ? input : `${input}Z`)
    return isValid(date) ? date : null
}

// 서버 시간을 브라우저 로컬 타임존 기준으로 포맷한다. 파싱 실패 시 빈 문자열을 반환한다.
export const formatUtcToLocal = (input: string | number | null | undefined, fmt: string = 'yyyy-MM-dd HH:mm:ss.SSS'): string => {
    const date = parseServerDate(input)
    return date ? format(date, fmt) : ''
}

// 날짜만 포맷하는 편의 함수 (기본 'yyyy-MM-dd')
export const formatLocalDate = (input: string | number | null | undefined, fmt: string = 'yyyy-MM-dd'): string => {
    return formatUtcToLocal(input, fmt)
}

// 날짜+시간(초 제외) 포맷 편의 함수 (기본 'yyyy-MM-dd HH:mm')
export const formatLocalDateTime = (input: string | number | null | undefined, fmt: string = 'yyyy-MM-dd HH:mm'): string => {
    return formatUtcToLocal(input, fmt)
}
