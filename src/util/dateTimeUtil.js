import moment from 'moment'

/**
 * UTC 날짜 문자열을 브라우저의 로컬 타임존으로 변환하여 포맷팅합니다.
 *
 * @param {string} utcDateString - UTC 날짜 문자열 (예: "2024-01-15 10:30:00" 또는 "2024-01-15T10:30:00Z")
 * @param {string} format - 출력 포맷 (기본값: "YYYY-MM-DD HH:mm:ss")
 * @returns {string} 로컬 타임존으로 변환된 날짜 문자열
 *
 * @example
 * // UTC "2024-01-15 10:30:00"를 한국 시간으로 변환 (UTC+9)
 * formatUtcToLocal("2024-01-15 10:30:00") // "2024-01-15 19:30:00"
 *
 * @example
 * // 커스텀 포맷 지정
 * formatUtcToLocal("2024-01-15 10:30:00", "YYYY/MM/DD HH:mm") // "2024/01/15 19:30"
 */
export const formatUtcToLocal = (utcDateString, format = 'YYYY-MM-DD HH:mm:ss.SSS') => {
  if (!utcDateString) return ''

  // UTC로 파싱 후 로컬 타임존으로 변환
  return moment.utc(utcDateString).local().format(format)
}

/**
 * 로컬 날짜 문자열을 UTC로 변환하여 포맷팅합니다.
 *
 * @param {string} localDateString - 로컬 날짜 문자열
 * @param {string} format - 출력 포맷 (기본값: "YYYY-MM-DD HH:mm:ss")
 * @returns {string} UTC로 변환된 날짜 문자열
 */
export const formatLocalToUtc = (localDateString, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!localDateString) return ''

  // 로컬 시간으로 파싱 후 UTC로 변환
  return moment(localDateString).utc().format(format)
}

/**
 * 현재 브라우저의 타임존 오프셋을 반환합니다.
 *
 * @returns {string} 타임존 오프셋 (예: "+09:00", "-05:00")
 */
export const getTimezoneOffset = () => {
  return moment().format('Z')
}

/**
 * 현재 브라우저의 타임존 이름을 반환합니다.
 *
 * @returns {string} 타임존 이름 (예: "Asia/Seoul")
 */
export const getTimezoneName = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
