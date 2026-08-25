'use client';

import { Select, type SelectOption } from '@hvy/ui';

/**
 * 옵션 그룹 — 같은 group 은 연속 배치가 전제다(순서는 호출부 몫, ui 는 정렬하지 않는다).
 * 그룹에 속한 옵션은 들여써서 헤더가 상위 계층으로 읽힌다("회고"는 무그룹이라 안 들여쓴다).
 * 헤더는 시각 전용이라 키보드 이동·검색 인덱스에 끼어들지 않는다 —
 * 검색으로 좁히면 남은 옵션의 그룹 헤더만 따라 남는다.
 * clearable — 트리거 × 와 선택된 옵션 재클릭, 두 경로 모두 선택 취소다.
 */
/**
 * 10개인 이유: 아래 `searchThreshold={5}` 를 넘겨야 검색 입력이 붙는다.
 * 줄이면 이 데모가 보여주려던 "검색 + 그룹 헤더가 함께 좁혀지는" 동작이 사라진다.
 */
const TAGS: readonly SelectOption[] = [
  { value: 'react', label: 'React', group: '프론트엔드' },
  { value: 'nextjs', label: 'Next.js', group: '프론트엔드' },
  { value: 'css', label: 'CSS', group: '프론트엔드' },
  { value: 'spring', label: 'Spring', group: '백엔드' },
  { value: 'database', label: '데이터베이스', group: '백엔드' },
  { value: 'devops', label: 'DevOps', group: '백엔드' },
  { value: 'testing', label: '테스트', group: '품질' },
  { value: 'a11y', label: '접근성', group: '품질' },
  { value: 'performance', label: '성능', group: '품질' },
  { value: 'retrospective', label: '회고' },
];

export function SelectGroupsDemo() {
  return (
    <div className="max-w-xs">
      <Select placeholder="태그 선택" options={TAGS} searchThreshold={5} clearable />
    </div>
  );
}
