import {useRouter} from "next/router"
import {useEffect, useState} from "react"
import SearchFilter from "../components/search/SearchFilter"
import {useSnackbar} from "notistack"

export default function Search({children}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()

    const router = useRouter()
    const searchText = router.query.q

    const [searchType, setSearchType] = useState(router.query.type)

    useEffect(() => {
        if(searchType === undefined) {
            setSearchType("TITLE")
        }

        document.title = `Search: ${searchText}`
    }, [])

    const onSearching = ({text, type, categories, tags}) => {
        enqueueSnackbar(`검색 api 시도 중!`, {variant: "success"})
    }

    return (
        <div>
            <SearchFilter onSearch={onSearching} defaultType={searchType} defaultText={searchText}/>
        </div>
    )
}