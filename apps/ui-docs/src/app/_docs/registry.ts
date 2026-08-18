import type { UiDocsNavGroup } from '../../client/ui-test/shell';
import { badgeDoc } from './badge';
import { buttonDoc } from './button';
import { cardDoc } from './card';
import { checkboxDoc } from './checkbox';
import { dataGridDoc } from './data-grid';
import { datePickerDoc } from './date-picker';
import { dateTimePickerDoc } from './date-time-picker';
import { dialogDoc } from './dialog';
import { dialogPickerDoc } from './dialog-picker';
import { feedbackDoc } from './feedback';
import { fieldDoc } from './field';
import { formGridDoc } from './form-grid';
import { formSaveDoc } from './form-save';
import { gridDoc } from './grid';
import { iconsDoc } from './icons';
import { inputDoc } from './input';
import { multiSelectDoc } from './multi-select';
import { radioDoc } from './radio';
import { searchGridDoc } from './search-grid';
import { selectDoc } from './select';
import { switchDoc } from './switch';
import { tabsDoc } from './tabs';
import { toastDoc } from './toast';
import { tokensDoc } from './tokens';
import { tooltipDoc } from './tooltip';
import { treeGridDoc } from './tree-grid';
import { DOC_CATEGORIES, type DocCategory, type DocEntry } from './types';

/**
 * 문서 레지스트리 — **새 문서 추가 = 정의 파일 1개 + 여기 import 1줄**이다.
 * 사이드바·카테고리 인덱스·`[category]/[slug]` 라우트가 전부 이 배열에서 파생되므로
 * 다른 곳을 고칠 필요가 없다. 등록 순서가 사이드바 표시 순서다.
 */
export const DOCS: readonly DocEntry[] = [
  buttonDoc,
  inputDoc,
  datePickerDoc,
  dateTimePickerDoc,
  selectDoc,
  multiSelectDoc,
  checkboxDoc,
  radioDoc,
  switchDoc,
  tooltipDoc,
  fieldDoc,
  badgeDoc,
  cardDoc,
  tabsDoc,
  formGridDoc,
  dialogDoc,
  toastDoc,
  feedbackDoc,
  dataGridDoc,
  treeGridDoc,
  gridDoc,
  iconsDoc,
  tokensDoc,
  searchGridDoc,
  formSaveDoc,
  dialogPickerDoc,
];

export const CATEGORY_LABEL: Readonly<Record<DocCategory, string>> = {
  components: 'Components',
  layout: 'Layout',
  foundations: 'Foundations',
  examples: 'Examples',
};

/** URL 세그먼트가 유효한 카테고리인지 — `[category]` 동적 라우트의 1차 검문. */
export function isDocCategory(value: string): value is DocCategory {
  return (DOC_CATEGORIES as readonly string[]).includes(value);
}

export function docsInCategory(category: DocCategory): readonly DocEntry[] {
  return DOCS.filter((doc) => doc.category === category);
}

export function findDoc(category: string, slug: string): DocEntry | undefined {
  return DOCS.find((doc) => doc.category === category && doc.slug === slug);
}

export function docHref(doc: Pick<DocEntry, 'category' | 'slug'>): string {
  return `/${doc.category}/${doc.slug}`;
}

/**
 * 사이드바용 카테고리 그룹 — layout(RSC)이 만들어 셸(client)에 **직렬화 가능한
 * 배열**로 내린다. 셸이 레지스트리를 직접 import 하면 모든 데모가 셸 번들에
 * 딸려오기 때문에 이 간접 단계가 필요하다. 문서가 없는 카테고리는 그룹째 숨긴다.
 */
export function navGroups(): readonly UiDocsNavGroup[] {
  return DOC_CATEGORIES.flatMap((category) => {
    const docs = docsInCategory(category);
    if (docs.length === 0) return [];
    return [
      {
        label: CATEGORY_LABEL[category],
        href: `/${category}`,
        items: docs.map((doc) => ({ href: docHref(doc), title: doc.title })),
      },
    ];
  });
}
