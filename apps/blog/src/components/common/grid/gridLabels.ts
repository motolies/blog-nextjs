import type { PagerLabels } from '@hvy/ui';

/** 그리드 크롬 한국어 라벨 — 페이지마다 복제하면 문구가 갈라져 여기서 중앙 소유한다. */

export const PAGER_LABELS: PagerLabels = {
  first: '첫 페이지',
  prev: '이전 페이지',
  next: '다음 페이지',
  last: '마지막 페이지',
  jump: '페이지 이동',
  atFirst: '첫 페이지입니다',
  atLast: '마지막 페이지입니다',
};

export const COLUMN_SETTINGS_LABELS = {
  title: '컬럼 설정',
  description: '표시할 컬럼과 순서를 조정합니다.',
  reorder: '순서 변경',
  reorderHint: '드래그 또는 ↑↓ 키로 순서를 바꿉니다.',
  reorderAnnouncement: (name: string, position: number, total: number) =>
    `${name}, ${position}번째로 이동(전체 ${total}개)`,
  visibleColumn: '컬럼 표시',
  alwaysVisible: '이 컬럼은 끌 수 없습니다 — 행 식별에 필요합니다.',
  pinnedFixed: '고정열은 일반열 아래로 내릴 수 없습니다.',
  reset: '초기화',
  cancel: '취소',
  apply: '적용',
};

export const SELECTION_LABELS = {
  selectAllLabel: '전체 선택',
  selectRowLabel: '행 선택',
};

export const GRID_EMPTY = { title: '데이터가 없습니다' };

export const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100] as const;
