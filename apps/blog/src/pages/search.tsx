import { cn } from '@hvy/ui';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { getTsid } from 'tsid-ts';
import SearchFilter from '@/components/search/SearchFilter';
import SearchPagination from '@/components/search/SearchPagination';
import SearchResult from '@/components/search/SearchResult';
import { usePostSearch } from '@/hooks/usePostSearch';
import { searchObjectInit } from '@/model/searchObject';
import { base64Decode, base64Encode } from '@/util/base64Util';

const SEARCH_PAGE_SIZE = 10;

export default function SearchPage() {
  const router = useRouter();
  // lg 미만에서 필터 패널 접기 — 기본 접힘이라 결과가 요약 바로 아래 노출된다
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  const queryParam = useMemo(() => {
    if (router.query?.q) {
      const decodeString = base64Decode(router.query.q as string);
      const newObj = JSON.parse(decodeString);
      newObj.searchCondition.keywords = newObj.searchCondition.keywords.filter(
        (k: any) => k.name.trim().length > 0,
      );
      newObj.pageSize = SEARCH_PAGE_SIZE;
      return { ...searchObjectInit, ...newObj };
    }
    if (router.query?.query) {
      const newObj = {
        searchCondition: {
          keywords: [{ id: getTsid().toString(), name: router.query?.query }],
          logic: 'AND',
        },
        pageSize: SEARCH_PAGE_SIZE,
      };
      return { ...searchObjectInit, ...newObj };
    }
    return null;
  }, [router.query?.q, router.query?.query]);

  const { data: searchedPostState } = usePostSearch(queryParam);

  const categories = queryParam?.categories ?? searchObjectInit.categories;
  const tags = queryParam?.tags ?? searchObjectInit.tags;
  const keywords =
    queryParam?.searchCondition?.keywords ?? searchObjectInit.searchCondition.keywords;
  const logic = queryParam?.searchCondition?.logic ?? searchObjectInit.searchCondition.logic;
  const searchType = queryParam?.searchType ?? searchObjectInit.searchType;
  const page = queryParam?.page ?? searchObjectInit.page;

  const goPage = (newPage: number) => {
    const targetPage = newPage - 1; // 1-based UI, 0-based backend
    if (page !== targetPage) {
      const newSearchAllParam = { ...(queryParam ?? searchObjectInit), page: targetPage };
      router.push({
        pathname: '/search',
        query: { q: base64Encode(JSON.stringify(newSearchAllParam)) },
      });
    }
  };

  const totalPage = searchedPostState?.totalPage || 0;
  const currentPage = page + 1; // 1-based for display
  const resultCount = searchedPostState?.list?.length || 0;
  const activeFilterCount = keywords.length + categories.length + tags.length;

  return (
    <div className="public-container pb-8 pt-6 sm:pt-10">
      <h1 className="visually-hidden">검색 결과</h1>
      <section className="public-card-surface mb-6 flex flex-wrap items-center gap-3 rounded-(--radius-card) border px-5 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <span className="public-label-text text-[11px] font-semibold uppercase tracking-[0.2em]">
          Search Summary
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="public-chip-surface public-muted-text flex rounded-full border px-3 py-1.5 text-sm">
            <span className="public-label-text mr-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
              Results
            </span>
            <span className="font-semibold text-dl-fg">{resultCount}</span>
          </div>
          <div className="public-chip-surface public-muted-text flex rounded-full border px-3 py-1.5 text-sm">
            <span className="public-label-text mr-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
              Pages
            </span>
            <span className="font-semibold text-dl-fg">{totalPage}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[var(--search-filter-w)_minmax(0,1fr)] lg:gap-8">
        <div className="lg:sticky lg:top-(--sticky-top) lg:max-h-[calc(100dvh-var(--sticky-top)-2rem)] lg:self-start lg:overflow-y-auto">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="search-filter-panel"
            className="public-control-surface flex w-full items-center justify-between rounded-full border px-4 py-2.5 text-sm font-semibold lg:hidden"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              검색 필터
            </span>
            <span className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-dl-primary px-1.5 text-[11px] font-bold text-dl-primary-fg">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={cn('h-4 w-4 transition', filtersOpen && 'rotate-180')} />
            </span>
          </button>
          <div
            id="search-filter-panel"
            className={cn('mt-3 lg:mt-0 lg:block', filtersOpen ? 'block' : 'hidden')}
          >
            <SearchFilter
              defaultLogic={logic}
              defaultSearchType={searchType}
              defaultKeyword={keywords}
              defaultCategories={categories}
              defaultTags={tags}
              pageSize={SEARCH_PAGE_SIZE}
            />
          </div>
        </div>
        <div className="space-y-6">
          <SearchResult posts={searchedPostState?.list} />
          {/* 결과 컬럼 내부에 두어야 lg 이상에서 버튼 묶음이 결과 중심에 정렬된다 */}
          <SearchPagination currentPage={currentPage} totalPage={totalPage} onPageChange={goPage} />
        </div>
      </div>
    </div>
  );
}
