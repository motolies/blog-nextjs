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
    const searchText = router.query.q

    const [searchType, setSearchType] = useState(router.query.type)

    useEffect(() => {
        if (searchType === undefined) {
            setSearchType("TITLE")
        }

        document.title = `Search: ${searchText}`
    }, [])

    const onSearching = ({text, type, category, tags}) => {
        console.log({text, type, category, tags})
        enqueueSnackbar(`검색 api 시도 중! loading bar 돌리자~`, {variant: "success"})
        const defaultPage = 1
        const defaultLimit = 10
        dispatch(searchSingle(
            {
                searchText: text
                , searchType: type
                , category,
                page: defaultPage
                , pageSize: defaultLimit
            }))
    }

    return (
        <div>
            <SearchFilter onSearch={onSearching} defaultType={searchType} defaultText={searchText}/>
        </div>
    )
}