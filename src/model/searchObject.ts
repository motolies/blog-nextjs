import type { SearchObject } from '@/types/post'

export const searchObjectInit: SearchObject = {
  searchType: "TITLE",
  searchCondition: {
    keywords: [],
    logic: "AND"
  },
  categories: [],
  tags: [],
  page: 0,
  pageSize: 100
}
