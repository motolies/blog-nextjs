import { describe, expect, it } from 'vitest';
import { LOG_STATUS_OPTIONS, systemLogStatusBadge } from './logStatus';

/**
 * 이 테스트가 지키는 것은 "요청 값과 응답 값이 다르다"는 사실 하나다.
 * 둘을 같게 맞추려는 선의의 수정이 들어오면 여기서 걸린다.
 */
describe('LOG_STATUS_OPTIONS', () => {
  it("요청 값은 enum name 이다 — DB 코드 'SUCC' 를 보내면 백엔드가 400 을 낸다", () => {
    expect(LOG_STATUS_OPTIONS.map((option) => option.value)).toEqual(['SUCCESS', 'FAIL']);
  });

  it('라벨은 한글이다 — 화면에 내부 코드가 노출되지 않는다', () => {
    expect(LOG_STATUS_OPTIONS.map((option) => option.label)).toEqual(['성공', '실패']);
  });

  it('"전체" 항목은 넣지 않는다 — DynamicSearchFields 가 자동 삽입한다', () => {
    expect(LOG_STATUS_OPTIONS).toHaveLength(2);
  });
});

describe('systemLogStatusBadge', () => {
  it("응답 값은 DB 원문이라 'SUCC' 가 성공이다 — 요청 값('SUCCESS')과 다르다", () => {
    expect(systemLogStatusBadge('SUCC')).toEqual({ label: '성공', success: true });
  });

  it("요청 값인 'SUCCESS' 는 응답에 오지 않으므로 성공으로 보지 않는다", () => {
    expect(systemLogStatusBadge('SUCCESS').success).toBe(false);
  });

  it('FAIL 과 예상 밖의 값은 모두 실패로 본다 — 오류를 놓치는 쪽보다 안전하다', () => {
    expect(systemLogStatusBadge('FAIL')).toEqual({ label: '실패', success: false });
    expect(systemLogStatusBadge(null).success).toBe(false);
    expect(systemLogStatusBadge(undefined).success).toBe(false);
    expect(systemLogStatusBadge('').success).toBe(false);
  });
});
