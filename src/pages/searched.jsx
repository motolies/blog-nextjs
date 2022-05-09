import {useRouter} from "next/router"
import {useEffect, useState} from "react"
import {useSnackbar} from "notistack"
import {useDispatch} from "react-redux"
import {searchSingle} from "../store/actions/postActions"
import SearchResult from "../components/search/SearchResult"
import service from "../service"
import {base64Decode} from "../util/base64Util"
import SearchFilterMultiple from "../components/search/SearchFilterMultiple"
import {uuidV4Generator} from "../util/uuidUtil"

export default function Search({children}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()

    const dispatch = useDispatch()
    const router = useRouter()

    const searchDefaultParams = {
        searchType: "TITLE",
        searchCondition: {
            keywords: [],
            logic: "AND"
        },
        categories: [],
        tags: [],
        page: 1,
        pageSize: 10
    }

    const [searchAllParam, setSearchAllParam] = useState(searchDefaultParams)
    const [categories, setCategories] = useState(searchDefaultParams.categories)
    const [tags, setTags] = useState(searchDefaultParams.tags)
    const [keywords, setKeywords] = useState(searchDefaultParams.searchCondition.keywords)
    const [logic, setLogic] = useState(searchDefaultParams.searchCondition.logic)
    const [searchType, setSearchType] = useState(searchDefaultParams.searchType)
    const [page, setPage] = useState(searchDefaultParams.page)
    const [pageSize, setPageSize] = useState(searchDefaultParams.pageSize)


    useEffect(() => {
        // 디코딩을 한 다음에 각각 분배한다.
        const decodeString = base64Decode(router.query.q)
        const newObj = JSON.parse(decodeString)
        setSearchAllParam({...searchDefaultParams, ...newObj})
    }, [router.query.q])

    useEffect(() => {
        setCategories(searchAllParam.categories)
        setTags(searchAllParam.tags)
        setKeywords(searchAllParam.searchCondition.keywords)
        setLogic(searchAllParam.searchCondition.logic)
        setSearchType(searchAllParam.searchType)
        setPage(searchAllParam.page)
        setPageSize(searchAllParam.pageSize)

        console.log("searchAllParam => ", searchAllParam)
        // TODO : 검색!!

    }, [searchAllParam])

    const onSearching = ({text, type, category, tags}) => {
        console.log({text, type, category, tags})
        enqueueSnackbar('검색할 때 get 방식으로 넘겨서 보내야 history가 작동한다. ', {variant: 'warning'})

    }

    return (
        <div>
            <h2>신규검색</h2>
            <SearchFilterMultiple onSearch={onSearching}
                                  defaultLogic={logic}
                                  defaultSearchType={searchType}
                                  defaultKeyword={keywords}
                                  defaultCategories={categories}
                                  defaultTags={tags}/>
            <SearchResult/>
        </div>
    )
}