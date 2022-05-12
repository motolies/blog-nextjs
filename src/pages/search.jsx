import {useRouter} from "next/router"
import {useEffect, useState} from "react"
import {useSnackbar} from "notistack"
import {useDispatch} from "react-redux"
import {searchMultiple} from "../store/actions/postActions"
import SearchResult from "../components/search/SearchResult"
import {base64Decode} from "../util/base64Util"
import SearchFilter from "../components/search/SearchFilter"
import {searchObjectInit} from "../model/searchObject"

export default function Search({children}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()

    const dispatch = useDispatch()
    const router = useRouter()

    const [searchAllParam, setSearchAllParam] = useState(searchObjectInit)
    const [categories, setCategories] = useState(searchObjectInit.categories)
    const [tags, setTags] = useState(searchObjectInit.tags)
    const [keywords, setKeywords] = useState(searchObjectInit.searchCondition.keywords)
    const [logic, setLogic] = useState(searchObjectInit.searchCondition.logic)
    const [searchType, setSearchType] = useState(searchObjectInit.searchType)
    const [page, setPage] = useState(searchObjectInit.page)
    const [pageSize, setPageSize] = useState(searchObjectInit.pageSize)


    useEffect(() => {
        // 디코딩을 한 다음에 각각 분배한다.
        const decodeString = base64Decode(router.query.q)
        const newObj = JSON.parse(decodeString)

        const newSearchAllParam = {...searchObjectInit, ...newObj}
        setSearchAllParam(newSearchAllParam)

        console.log("searchAllParam => ", searchAllParam)
        dispatch(searchMultiple({searchAllParam:newSearchAllParam}))

    }, [router.query.q])

    useEffect(() => {
        setCategories(searchAllParam.categories)
        setTags(searchAllParam.tags)
        setKeywords(searchAllParam.searchCondition.keywords)
        setLogic(searchAllParam.searchCondition.logic)
        setSearchType(searchAllParam.searchType)
        setPage(searchAllParam.page)
        setPageSize(searchAllParam.pageSize)

    }, [searchAllParam])

    return (
        <div>
            <SearchFilter
                          defaultLogic={logic}
                          defaultSearchType={searchType}
                          defaultKeyword={keywords}
                          defaultCategories={categories}
                          defaultTags={tags}/>
            <SearchResult/>
        </div>
    )
}