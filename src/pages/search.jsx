import {useRouter} from "next/router"
import {useEffect, useState} from "react"
import {useSnackbar} from "notistack"
import {useDispatch, useSelector} from "react-redux"
import {searchMultiple} from "../store/actions/postActions"
import SearchResult from "../components/search/SearchResult"
import {base64Decode, base64Encode} from "../util/base64Util"
import SearchFilter from "../components/search/SearchFilter"
import {searchObjectInit} from "../model/searchObject"
import {Pagination} from "@mui/lab"
import {Stack} from "@mui/material"
import {uuidV4Generator} from "../util/uuidUtil";

export default function SearchPage({children}) {
  const {enqueueSnackbar, closeSnackbar} = useSnackbar()

  const dispatch = useDispatch()
  const router = useRouter()

  const searchedPostState = useSelector((state) => state.post.searchedPost)

  const [searchAllParam, setSearchAllParam] = useState(searchObjectInit)
  const [categories, setCategories] = useState(searchObjectInit.categories)
  const [tags, setTags] = useState(searchObjectInit.tags)
  const [keywords, setKeywords] = useState(searchObjectInit.searchCondition.keywords)
  const [logic, setLogic] = useState(searchObjectInit.searchCondition.logic)
  const [searchType, setSearchType] = useState(searchObjectInit.searchType)
  const [page, setPage] = useState(searchObjectInit.page)
  const [pageSize, setPageSize] = useState(searchObjectInit.pageSize)

  useEffect(() => {
    if (router.query?.q) {
      // 디코딩을 한 다음에 각각 분배한다.
      const decodeString = base64Decode(router.query.q)
      const newObj = JSON.parse(decodeString)
      newObj.searchCondition.keywords = newObj.searchCondition.keywords.filter(k => k.name.trim().length > 0)

      const newSearchAllParam = {...searchObjectInit, ...newObj}
      setSearchAllParam(newSearchAllParam)

      console.log("searchAllParam => ", searchAllParam)
      dispatch(searchMultiple({searchAllParam: newSearchAllParam}))
    } else if (router.query?.query) {
      const newObj = {
        searchCondition: {
          keywords: [{
            id: uuidV4Generator(),
            name: router.query?.query
          }],
          logic: "AND"
        }
      }
      const newSearchAllParam = {...searchObjectInit, ...newObj}
      setSearchAllParam(newSearchAllParam)

      console.log("searchAllParam => ", searchAllParam)
      dispatch(searchMultiple({searchAllParam: newSearchAllParam}))
    }

  }, [router.query?.q, router.query?.query])

  useEffect(() => {
    setCategories(searchAllParam.categories)
    setTags(searchAllParam.tags)
    setKeywords(searchAllParam.searchCondition.keywords)
    setLogic(searchAllParam.searchCondition.logic)
    setSearchType(searchAllParam.searchType)
    setPage(searchAllParam.page)
    setPageSize(searchAllParam.pageSize)

  }, [searchAllParam])

  const goPage = (event, newPage) => {
    if (page !== newPage) {
      const newSearchAllParam = {...searchAllParam, ...{page: newPage}}
      router.push({
        pathname: '/search',
        query: {q: base64Encode(JSON.stringify(newSearchAllParam))}
      })
    }
  }

  return (
      <div>
        <SearchFilter
            defaultLogic={logic}
            defaultSearchType={searchType}
            defaultKeyword={keywords}
            defaultCategories={categories}
            defaultTags={tags}/>
        <SearchResult/>
        <Stack spacing={2} alignItems="center">
          <Pagination
              count={searchedPostState.totalPage} page={page} onChange={goPage}
              color="primary"
              sx={{
                '& .Mui-selected': {
                  backgroundColor: '#f0e3c1',
                  color: 'white',
                  opacity: 0.8
                }, "& .MuiPaginationItem-root": {
                  color: "black",
                  fontFamily: 'Montserrat',
                }
              }}
          />
        </Stack>
      </div>
  )
}