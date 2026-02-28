import { format } from 'date-fns'

/**
 * UTC 날짜 문자열을 브라우저의 로컬 타임존으로 변환하여 포맷팅합니다.
 *
 * @param {string} utcDateString - UTC 날짜 문자열 (예: "2024-01-15 10:30:00" 또는 "2024-01-15T10:30:00Z")
 * @param {string} fmt - 출력 포맷 (기본값: "yyyy-MM-dd HH:mm:ss")
 * @returns {string} 로컬 타임존으로 변환된 날짜 문자열
 */
export const formatUtcToLocal = (utcDateString, fmt = 'yyyy-MM-dd HH:mm:ss.SSS') => {
  if (!utcDateString) return ''

  // UTC 문자열을 Date로 파싱 (Z가 없으면 붙여서 UTC로 인식하게 함)
  const dateStr = utcDateString.endsWith('Z') ? utcDateString : utcDateString + 'Z'
  return format(new Date(dateStr), fmt)
}
