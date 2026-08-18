import { describe, expect, it } from 'vitest';
import { groupHeaderBefore } from './optionGroups';

describe('groupHeaderBefore', () => {
  it('그룹이 없으면 헤더도 없다', () => {
    expect(groupHeaderBefore({}, undefined)).toBeNull();
    expect(groupHeaderBefore({}, { group: '아시아' })).toBeNull();
  });

  it('첫 옵션(앞이 없음)은 자기 그룹 헤더를 낸다', () => {
    expect(groupHeaderBefore({ group: '아시아' }, undefined)).toBe('아시아');
  });

  it('앞 옵션과 같은 그룹이면 헤더를 반복하지 않는다', () => {
    expect(groupHeaderBefore({ group: '아시아' }, { group: '아시아' })).toBeNull();
  });

  it('그룹이 갈리는 자리에 헤더를 낸다', () => {
    expect(groupHeaderBefore({ group: '유럽' }, { group: '아시아' })).toBe('유럽');
  });

  // 무그룹 → 그룹 전환: 앞이 그룹 없음이어도 새 그룹의 시작이다.
  it('무그룹 옵션 뒤의 그룹 옵션도 헤더를 낸다', () => {
    expect(groupHeaderBefore({ group: '아시아' }, {})).toBe('아시아');
  });
});
