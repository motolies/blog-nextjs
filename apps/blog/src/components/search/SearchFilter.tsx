import { Button, Input, Select, showToast } from '@hvy/ui';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getTsid } from 'tsid-ts';
import { ConditionComponent } from '@/components/ConditionComponent';
import { buildSearchHref } from '@/lib/searchHref';
import { searchObjectInit } from '@/model/searchObject';
import type { Tag } from '@/types/tag';
import SearchCategory from './SearchCategory';
import SearchTag from './SearchTag';

interface KeywordItem {
  id: string;
  name: string;
}

interface CategoryItem {
  id: string;
  name: string;
}

interface SearchFilterProps {
  onSearch?: () => void;
  defaultLogic?: string;
  defaultKeyword?: any[];
  defaultSearchType?: string;
  defaultCategories?: any[];
  defaultTags?: any[];
  pageSize?: number;
}

const searchTypes = [
  { name: '제목', value: 'TITLE' },
  { name: '내용', value: 'CONTENT' },
  { name: '제목+내용', value: 'FULL' },
];
const searchLogic = [
  { name: 'AND', value: 'AND' },
  { name: 'OR', value: 'OR' },
];

/* 높이는 lg 미만에서 한 단계 내린다 — 이 필터는 모바일에서 접이식 바 아래 세로로 쌓여
   컨트롤 수만큼 높이가 곱해지는 자리다. 데스크톱 44px 는 그대로 둔다. */
const controlClassName =
  'public-control-surface public-text-body h-10 w-full rounded-(--radius-card) border px-(--public-chip-pad-x) lg:h-11';
const fieldLabelClassName =
  'public-label-text public-text-meta font-semibold uppercase tracking-[0.18em]';
const sectionClassName = 'public-muted-panel rounded-(--radius-card) border p-(--public-pad-card)';

export default function SearchFilter({
  onSearch,
  defaultLogic,
  defaultKeyword,
  defaultSearchType,
  defaultCategories,
  defaultTags,
  pageSize = searchObjectInit.pageSize,
}: SearchFilterProps) {
  const router = useRouter();

  const [logic, setLogic] = useState<string>('');
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [searchType, setSearchType] = useState<string>('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (defaultLogic !== undefined) setLogic(defaultLogic);
    if (defaultKeyword !== undefined) setKeywords(defaultKeyword);
    if (defaultSearchType !== undefined) setSearchType(defaultSearchType);
    if (defaultCategories !== undefined) setCategories(defaultCategories);
    if (defaultTags !== undefined) setTags(defaultTags);
  }, [defaultLogic, defaultKeyword, defaultSearchType, defaultCategories, defaultTags]);

  const [keyword, setKeyword] = useState<string>('');

  const onDeleteKeyword = (deleteKeywordId: string) => {
    setKeywords(keywords.filter((k) => k.id !== deleteKeywordId));
  };
  const addKeyword = () => {
    if (keyword.length < 2) {
      showToast('검색어는 2글자 이상이어야 합니다.', 'error');
      setKeyword('');
      return;
    }
    setKeywords([...keywords, { id: getTsid().toString(), name: keyword.trim() }]);
    setKeyword('');
  };

  const onChangeAddCategory = (category: CategoryItem) => {
    setCategories([...categories, { id: category.id, name: category.name }]);
  };
  const onChangeDeleteCategory = (deleteCategoryId: string) => {
    setCategories(categories.filter((cat) => cat.id !== deleteCategoryId));
  };

  const onChangeAddTag = (tag: Tag) => {
    setTags([...tags, tag]);
  };
  const onChangeDeleteTag = (deleteTagId: string) => {
    setTags(tags.filter((tag) => tag.id !== deleteTagId));
  };

  const onSearching = () => {
    const condition = {
      ...searchObjectInit,
      ...{
        page: 0,
        pageSize,
        searchType: searchType,
        searchCondition: {
          keywords: [...keywords],
          logic: logic,
        },
        categories: [...categories],
        tags: [...tags],
      },
    };
    router.push(buildSearchHref(condition));
  };

  return (
    <div className="surface-panel-strong rounded-(--radius-panel) p-(--public-pad-panel)">
      <div className="mb-4 lg:mb-5">
        <div>
          <p className="public-label-text public-text-meta font-semibold uppercase tracking-[0.18em]">
            Filter Stack
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:gap-4">
        <div className={sectionClassName}>
          <p className={fieldLabelClassName}>Search Scope</p>
          <div className="mt-2">
            <Select
              value={searchType}
              onValueChange={setSearchType}
              placeholder="검색 범위"
              options={searchTypes.map((option) => ({ value: option.value, label: option.name }))}
              className={controlClassName}
            />
          </div>
        </div>

        <div className={sectionClassName}>
          <div className="grid gap-3">
            <div>
              <p className={fieldLabelClassName}>Keyword Logic</p>
              <div className="mt-2">
                <Select
                  value={logic}
                  onValueChange={setLogic}
                  placeholder="AND | OR"
                  options={searchLogic.map((option) => ({
                    value: option.value,
                    label: option.name,
                  }))}
                  className={controlClassName}
                />
              </div>
            </div>

            <div>
              <p className={fieldLabelClassName}>Keyword Input</p>
              <div className="mt-2">
                <Input
                  placeholder="검색어를 추가하세요"
                  value={keyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
                  type="search"
                  className={controlClassName}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') addKeyword();
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {keywords.length > 0 ? (
          <div className="public-muted-panel rounded-(--radius-card) border border-dashed p-(--public-pad-card)">
            <p className="public-label-text public-text-meta mb-2 font-semibold uppercase tracking-[0.18em]">
              Keywords
            </p>
            <div className="flex min-h-10 flex-wrap gap-2 lg:min-h-11">
              {keywords.map((kw) => (
                <ConditionComponent
                  key={kw.id}
                  id={kw.id}
                  name={kw.name}
                  onDelete={onDeleteKeyword}
                />
              ))}
            </div>
          </div>
        ) : null}

        <SearchCategory
          defaultCategory={categories}
          onChangeAddCategory={onChangeAddCategory}
          onChangeDeleteCategory={onChangeDeleteCategory}
        />

        <SearchTag
          defaultTag={tags}
          onChangeAddTag={onChangeAddTag}
          onChangeDeleteTag={onChangeDeleteTag}
        />

        <Button
          variant="primary"
          className="h-10 w-full rounded-(--radius-card) bg-dl-primary text-dl-primary-fg hover:bg-dl-primary-hover lg:h-11"
          onClick={onSearching}
        >
          <Search className="size-(--public-icon)" />
          Search
        </Button>
      </div>
    </div>
  );
}
