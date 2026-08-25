/**
 * 결정적 목데이터 — 그리드 · 결합 시나리오 데모 공용.
 *
 * ⚠️ `Math.random()` · `Date.now()` 를 쓰지 않는다. 서버 렌더와 클라이언트 하이드레이션이
 * 다른 값을 만들면 hydration mismatch 가 난다 — 값은 전부 인덱스에서 파생한다.
 *
 * 아래 숫자들은 임의값이 아니라 **검증 장치**다. 줄이거나 늘리면 데모가 확인하던 동작이
 * 조용히 사라진다(에러는 나지 않는다) — 상수마다 그 근거를 주석에 남겨 둔다.
 */

export type DemoStatus = 'DRAFT' | 'EDITING' | 'PUBLISHED' | 'ARCHIVED' | 'ERROR';

/** Badge 의 tone 유니온과 같은 값이다 — `ui` 의 진행 국면 구분(v3 §ds-09)을 따른다. */
export type DemoStatusTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

/**
 * 상태 5종 — tone 5종과 **1:1** 이다. 하나라도 줄이면 badge 데모가 tone 전수를 못 보여준다.
 *
 * 어휘 선택에도 근거가 있다. `EDITING`(수정중)은 발행본 위에 초안이 얹힌 상태(`Post.hasDraft`)고,
 * neutral 슬롯이 `PRIVATE`(비공개)가 아니라 `ARCHIVED`(보관)인 이유는 `publicYn`(공개) 열과
 * 뜻이 겹치지 않기 위해서다 — 「상태: 비공개」와 「공개: N」이 한 행에 같이 뜨면 데모가
 * 스스로를 반박한다.
 */
export const DEMO_STATUS_META: Readonly<
  Record<DemoStatus, { readonly label: string; readonly tone: DemoStatusTone }>
> = {
  DRAFT: { label: '초안', tone: 'primary' },
  EDITING: { label: '수정중', tone: 'warning' },
  PUBLISHED: { label: '발행', tone: 'success' },
  ARCHIVED: { label: '보관', tone: 'neutral' },
  ERROR: { label: '색인오류', tone: 'danger' },
};

export const DEMO_STATUSES: readonly DemoStatus[] = [
  'DRAFT',
  'EDITING',
  'PUBLISHED',
  'ARCHIVED',
  'ERROR',
];

/** `DataGrid<T extends Record<string, unknown>>` 제약을 만족시키는 인덱스 시그니처를 둔다. */
export type DemoPost = {
  readonly rowNum: number;
  readonly postId: string;
  readonly author: string;
  readonly status: DemoStatus;
  readonly category: string;
  readonly viewCount: number;
  readonly writtenAt: string;
  readonly [key: string]: unknown;
};

const AUTHORS = [
  '김민준',
  '이서연',
  '박지호',
  '최수아',
  '정도윤',
  '한지우',
  '오하은',
  '서준서',
] as const;

/**
 * 카테고리 3종 — 주기(3)가 상태(5)·작성자(8)와 서로소라 세 축의 조합이 한쪽으로 쏠리지 않는다.
 * 값에 코드가 아니라 **라벨**을 담는 것도 의도다 — 그리드는 라벨을, 폼 Select 는 코드를 다뤄야
 * view 모드의 "코드가 아니라 라벨을 그린다" 검증이 성립한다.
 */
const CATEGORIES = ['개발', '에세이', '리뷰'] as const;

/**
 * 57건인 이유: 페이지당 20건 기준 3페이지 + **부분 끝 페이지**(17건)가 생겨
 * Pager 의 경계 동작(마지막 페이지 비활성 · 건수 어긋남)이 눈에 보인다.
 */
export const DEMO_POSTS: readonly DemoPost[] = Array.from({ length: 57 }, (_, index) => ({
  rowNum: index + 1,
  postId: `POST-${100001 + index}`,
  author: AUTHORS[index % AUTHORS.length] ?? '',
  status: DEMO_STATUSES[index % DEMO_STATUSES.length] ?? 'DRAFT',
  category: CATEGORIES[index % CATEGORIES.length] ?? '개발',
  // 9주기 변화 — 천단위 구분자와 우측 정렬을 같은 열에서 대조하는 자리다.
  viewCount: 12000 + (index % 9) * 3500,
  writtenAt: `2026-07-${String((index % 28) + 1).padStart(2, '0')}`,
}));

/**
 * 태그 12종 — multiselect 에디터용. **12개인 이유**: 10(searchThreshold)을 넘겨야
 * 셀 안에서도 검색 입력이 붙는다. 못 넘기면 셀 편집기에서 그 동작을 확인할 수 없다.
 * (선택 요약(칩)은 문턱 없이 1개부터 붙으므로 개수 조건이 아니다.)
 *
 * 절반을 value ≠ label 로 둔 것도 의도다 — view 모드가 "코드가 아니라 라벨을 그린다"를
 * 증명하는 데모라, 슬러그와 라벨이 대소문자만 다르면 그 검증이 눈에 보이지 않는다.
 */
export const DEMO_TAG_OPTIONS = [
  { value: 'react', label: 'React' },
  { value: 'nextjs', label: 'Next.js' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'css', label: 'CSS' },
  { value: 'testing', label: '테스트' },
  { value: 'performance', label: '성능' },
  { value: 'a11y', label: '접근성' },
  { value: 'design-system', label: '디자인 시스템' },
  { value: 'spring', label: 'Spring' },
  { value: 'database', label: '데이터베이스' },
  { value: 'devops', label: 'DevOps' },
  { value: 'retrospective', label: '회고' },
] as const;

/**
 * 인라인 편집 데모용 — 편집기 종류마다 필요한 데이터 모양이 달라 필드를 덧댄다:
 * checkbox 는 'Y'/'N' 코드 컬럼, multiselect 는 **값 배열**이다.
 */
export type DemoEditablePost = DemoPost & {
  readonly publicYn: 'Y' | 'N';
  readonly tags: readonly string[];
};

/** 30건이면 스크롤이 생겨 "가상 스크롤로 밀려난 에디터의 커밋 유지"를 확인할 수 있다. */
export const DEMO_EDITABLE_POSTS: readonly DemoEditablePost[] = DEMO_POSTS.slice(0, 30).map(
  (post, index) => ({
    ...post,
    publicYn: index % 4 === 0 ? 'N' : 'Y',
    // 첫 행은 7개 — 요약 임계값(5)을 넘긴 상태를 **열자마자** 보여준다.
    // 나머지는 0~2개로 두어 임계값 아래의 평소 모습이 같은 열에 함께 보인다.
    tags:
      index === 0
        ? DEMO_TAG_OPTIONS.slice(0, 7).map((tag) => tag.value)
        : DEMO_TAG_OPTIONS.slice(index % 5, (index % 5) + (index % 3)).map((tag) => tag.value),
  }),
);
