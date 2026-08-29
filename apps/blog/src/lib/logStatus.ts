/**
 * 로그 화면의 성공/실패 표기 — 요청 값과 응답 값이 다르다는 사실의 단일 진실.
 *
 * ⚠️ hvy-common 의 ApiResponseStatus 는 SUCCESS("SUCC") / FAIL("FAIL") 인데
 *    @JsonValue 가 없어서 요청과 응답이 서로 다른 값을 쓴다.
 *    - 요청(JSON → enum): Jackson 기본 규칙인 enum name() 이라 'SUCCESS' / 'FAIL' 만 유효하다.
 *      'SUCC' 를 보내면 400 이다(READ_UNKNOWN_ENUM_VALUES_AS_NULL 이 꺼져 있어 조용히 무시되지도 않는다).
 *    - 응답(SystemLogSearchResponse.status): 타입이 String 이라 DB 원문 'SUCC' / 'FAIL' 이 그대로 온다.
 *
 *    두 값을 한 파일에 나란히 둬야 다음 사람이 이 비대칭에 걸려 넘어지지 않는다.
 *    백엔드 쪽 증거는 LogSearchStatusFilterIntegrationTest 에 있다.
 */
import type { SearchField } from './gridSearch';

/** 검색 요청에 실리는 값 — enum name 이다. DB 코드('SUCC')가 아니다. */
export type LogStatusFilter = 'SUCCESS' | 'FAIL';

/**
 * 성공/실패 select 옵션 — 시스템 로그·API 로그가 공유한다(백엔드 파라미터 이름도 둘 다 status).
 *
 * "전체" 항목은 넣지 않는다 — DynamicSearchFields 가 sentinel 로 자동 삽입한다.
 * as const 를 쓰지 않는 이유: readonly 튜플이 되어 가변 배열인 SearchField.options 에 대입되지 않는다.
 */
export const LOG_STATUS_OPTIONS: NonNullable<SearchField['options']> = [
  { value: 'SUCCESS', label: '성공' },
  { value: 'FAIL', label: '실패' },
];

/**
 * 시스템 로그 응답의 status 원문('SUCC' | 'FAIL')을 배지 표기로 바꾼다.
 * 비교 대상이 'SUCCESS' 가 아니라 'SUCC' 인 것이 핵심 — 위 헤더 주석 참조.
 */
export function systemLogStatusBadge(status: unknown): { label: string; success: boolean } {
  const success = status === 'SUCC';
  return { label: success ? '성공' : '실패', success };
}
