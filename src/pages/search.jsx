import {useRouter} from "next/router"
import {useEffect, useState} from "react"
import SearchFilter from "../components/search/SearchFilter"

export default function Search({children}) {
    const router = useRouter()
    const searchText = router.query.q

    const [searchType, setSearchType] = useState(router.query.type)

    useEffect(() => {
        if(searchType === undefined) {
            setSearchType("TITLE")
        }

        document.title = `Search: ${searchText}`
    }, [])

    return (
        <div>
            <h3>검색</h3>
            <SearchFilter searchType={searchType} searchText={searchText}/>
        </div>
    )
}