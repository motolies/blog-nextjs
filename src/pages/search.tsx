import {useRouter} from "next/router"
import {useMemo} from "react"
import {usePostSearch} from "../hooks/usePostSearch"
import SearchResult from "../components/search/SearchResult"
import {base64Decode, base64Encode} from "../util/base64Util"
import SearchFilter from "../components/search/SearchFilter"
import {searchObjectInit} from "../model/searchObject"
import {getTsid} from 'tsid-ts'
import {Button} from '../components/ui/button'
import {ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight} from 'lucide-react'

const SEARCH_PAGE_SIZE = 10

export default function SearchPage() {
  const router = useRouter()

  const queryParam = useMemo(() => {
    if (router.query?.q) {
      const decodeString = base64Decode(router.query.q as string)
      const newObj = JSON.parse(decodeString)
      newObj.searchCondition.keywords = newObj.searchCondition.keywords.filter((k: any) => k.name.trim().length > 0)
      newObj.pageSize = SEARCH_PAGE_SIZE
      return {...searchObjectInit, ...newObj}
    }
    if (router.query?.query) {
      const newObj = {
        searchCondition: {
          keywords: [{id: getTsid().toString(), name: router.query?.query}],
          logic: "AND"
        },
        pageSize: SEARCH_PAGE_SIZE
      }
      return {...searchObjectInit, ...newObj}
    }
    return null
  }, [router.query?.q, router.query?.query])

  const {data: searchedPostState} = usePostSearch(queryParam)

  const categories = queryParam?.categories ?? searchObjectInit.categories
  const tags = queryParam?.tags ?? searchObjectInit.tags
  const keywords = queryParam?.searchCondition?.keywords ?? searchObjectInit.searchCondition.keywords
  const logic = queryParam?.searchCondition?.logic ?? searchObjectInit.searchCondition.logic
  const searchType = queryParam?.searchType ?? searchObjectInit.searchType
  const page = queryParam?.page ?? searchObjectInit.page

  const goPage = (newPage: number) => {
    const targetPage = newPage - 1  // 1-based UI, 0-based backend
    if (page !== targetPage) {
      const newSearchAllParam = {...(queryParam ?? searchObjectInit), page: targetPage}
      router.push({
        pathname: '/search',
        query: {q: base64Encode(JSON.stringify(newSearchAllParam))}
      })
    }
  }

  const totalPage = searchedPostState?.totalPage || 0
  const currentPage = page + 1  // 1-based for display
  const resultCount = searchedPostState?.list?.length || 0
  const keywordSummary = keywords.map((keyword: any) => keyword.name).join(', ')

  return (
      <div className="public-container px-4 pb-8 pt-28 sm:px-6 lg:px-8">
        <h1 className="visually-hidden">검색 결과</h1>
        <section className="mb-6 flex flex-wrap items-center gap-3 rounded-[1.4rem] border border-slate-200/80 bg-white/82 px-4 py-3 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:px-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Search Summary
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-sm text-slate-600">
              <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Results</span>
              <span className="font-semibold text-slate-950">{resultCount}</span>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-sm text-slate-600">
              <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Pages</span>
              <span className="font-semibold text-slate-950">{totalPage}</span>
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          <div className="xl:sticky xl:top-28 xl:self-start">
            <SearchFilter
                defaultLogic={logic}
                defaultSearchType={searchType}
                defaultKeyword={keywords}
                defaultCategories={categories}
                defaultTags={tags}
                pageSize={SEARCH_PAGE_SIZE}/>
          </div>
          <div className="space-y-6">
            <SearchResult posts={searchedPostState?.list}/>
          </div>
        </div>

        {totalPage > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 rounded-[1.5rem] border border-slate-200/80 bg-white/80 px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <Button
                  variant="outline" size="icon"
                  onClick={() => goPage(1)}
                  disabled={currentPage === 1}
                  aria-label="첫 페이지"
                  className="rounded-full border-slate-200 bg-white"
              >
                <ChevronsLeft className="h-4 w-4"/>
              </Button>
              <Button
                  variant="outline" size="icon"
                  onClick={() => goPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="이전 페이지"
                  className="rounded-full border-slate-200 bg-white"
              >
                <ChevronLeft className="h-4 w-4"/>
              </Button>

              {Array.from({length: totalPage}, (_, i) => i + 1)
                  .filter((p: number) => Math.abs(p - currentPage) <= 2)
                  .map((p: number) => (
                      <Button
                          key={p}
                          variant={p === currentPage ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => goPage(p)}
                          className={p === currentPage ? 'rounded-full bg-sky-600 text-white hover:bg-sky-600' : 'rounded-full border-slate-200 bg-white'}
                      >
                        {p}
                      </Button>
                  ))}

              <Button
                  variant="outline" size="icon"
                  onClick={() => goPage(currentPage + 1)}
                  disabled={currentPage === totalPage}
                  aria-label="다음 페이지"
                  className="rounded-full border-slate-200 bg-white"
              >
                <ChevronRight className="h-4 w-4"/>
              </Button>
              <Button
                  variant="outline" size="icon"
                  onClick={() => goPage(totalPage)}
                  disabled={currentPage === totalPage}
                  aria-label="마지막 페이지"
                  className="rounded-full border-slate-200 bg-white"
              >
                <ChevronsRight className="h-4 w-4"/>
              </Button>
            </div>
        )}
      </div>
  )
}
