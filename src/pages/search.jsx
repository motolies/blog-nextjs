import {useRouter} from "next/router"
import {useEffect, useState} from "react"
import SearchFilter from "../components/search/SearchFilter"
import {useSnackbar} from "notistack"
import {useDispatch} from "react-redux"
import {searchSingle} from "../store/actions/postActions"

export default function Search({children}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()

    const dispatch = useDispatch()
    const router = useRouter()
    const [searchText, setSearchText] = useState(router.query.q)
    const [searchType, setSearchType] = useState(router.query.type || 'TITLE')

    const defaultPage = 1
    const defaultLimit = 100

    useEffect(() => {
        // 특정 파라미터가 변경되는 때에도 실행할 수 있는 것 같다.
        setSearchText(router.query.q)
        setSearchType(router.query.type || 'TITLE')
    }, [router.query.q])

    useEffect(() => {
        document.title = `Search: ${searchText}`

        mainSearch({
            text: searchText
            , type: searchType
            , page: defaultPage
            , pageSize: defaultLimit
        })
    }, [searchText, searchType])

    const mainSearch = ({text, type, category, tags, page, pageSize}) => {
        dispatch(searchSingle(
            {
                searchText: text
                , searchType: type
                , category,
                page: page
                , pageSize: pageSize
            }))
    }

    const onSearching = ({text, type, category, tags}) => {
        console.log({text, type, category, tags})

        mainSearch({text, type, category, tags, page: defaultPage, pageSize: defaultLimit})
    }

    return (
        <div>
            <SearchFilter onSearch={onSearching} defaultType={searchType} defaultText={searchText}/>
        </div>
    )
}