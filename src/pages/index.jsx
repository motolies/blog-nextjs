import {useEffect, useState} from "react"
import service from "../service"
import {SearchEngineComponent} from "../components/SearchEngineComponent"
import {Box} from "@mui/material"

export default function IndexPage({post}) {
    const [searchEngine, setSearchEngine] = useState([])
    useEffect(() => {
        service.search.getAll().then(res => {
            console.log(res)
            setSearchEngine(res.data)
        })
    }, [])

    return (
        <>
            <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between'}}>
                {searchEngine.map((s) =>
                    <SearchEngineComponent key={s.id} name={s.name} url={s.url}/>
                )}
                {/*TODO: 비어있는 박스를 계산해서 넣어주면 한 칸 당길 수 있다.*/}
            </Box>
            <hr/>
        </>
    )
}


