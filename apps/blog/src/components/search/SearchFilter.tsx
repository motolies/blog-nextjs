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

const controlClassName = 'public-control-surface h-11 w-full rounded-[1.15rem] border px-4';
const fieldLabelClassName =
  'public-label-text text-[11px] font-semibold uppercase tracking-[0.18em]';
const sectionClassName = 'public-muted-panel rounded-[1.35rem] border p-3.5';

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
    <div className="surface-panel-strong rounded-[1.75rem] p-5">
      <div className="mb-5">
        <div>
          <p className="public-label-text text-xs font-semibold uppercase tracking-[0.18em]">
            Filter Stack
          </p>
        </div>
      </div>

      <div className="grid gap-4">
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
          <div className="public-muted-panel rounded-[1.5rem] border border-dashed p-3.5">
            <p className="public-label-text mb-2 text-xs font-semibold uppercase tracking-[0.18em]">
              Keywords
            </p>
            <div className="flex min-h-11 flex-wrap gap-2">
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
          className="h-11 w-full rounded-[1.15rem] bg-dl-primary text-dl-primary-fg hover:bg-dl-primary-hover"
          onClick={onSearching}
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  );
}
