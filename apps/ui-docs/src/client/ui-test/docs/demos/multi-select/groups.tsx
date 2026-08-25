'use client';

import { MultiSelect, type SelectOption } from '@hvy/ui';

/**
 * 옵션 그룹 — Select 와 같은 계약(SelectOption.group). 전체 토글 행은 그룹 밖이다.
 * 헤더는 시각 전용이라 전체 토글·검색·키보드 이동이 그룹을 몰라도 그대로 동작한다.
 */
const TAGS: readonly SelectOption[] = [
  { value: 'react', label: 'React', group: '프론트엔드' },
  { value: 'nextjs', label: 'Next.js', group: '프론트엔드' },
  { value: 'spring', label: 'Spring', group: '백엔드' },
  { value: 'database', label: '데이터베이스', group: '백엔드' },
  { value: 'devops', label: 'DevOps', group: '백엔드' },
];

export function MultiSelectGroupsDemo() {
  return (
    <div className="max-w-xs">
      <MultiSelect placeholder="전체" options={TAGS} selectAllLabel="전체" />
    </div>
  );
}
