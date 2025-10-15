import service from "../service"
import {SearchEngineComponent} from "../components/SearchEngineComponent"
import {Box} from "@mui/material"
import LinkIcon from '@mui/icons-material/Link'

export default function IndexPage({engines, favorites}) {

    return (
        <>
            <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between'}}>
                {engines.map((s) =>
                    <SearchEngineComponent key={s.id} name={s.name} url={s.url}/>
                )}
                {/*TODO: 비어있는 박스를 계산해서 넣어주면 한 칸 당길 수 있다.*/}
            </Box>
            <hr/>
            {favorites.map((c) =>
                <Box key={c.name}>
                    <h3>{c.name}</h3>
                    <Box component="ul" sx={{margin: 0}}>
                        {c.links.map((c) =>
                            <Box component="li" key={c.name} sx={{display: 'inline-table', padding: '.5rem 1rem .5rem .5rem'}}>
                                <a href={c.url} target="_blank" rel="noreferrer">
                                    <Box sx={{display: 'inline-flex', alignItems: 'center'}}>
                                        <LinkIcon/><span>{c.name}</span>
                                    </Box>
                                </a>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}
        </>
    )
}
export async function getServerSideProps(context) {
    const cookie = context.req?.headers?.cookie
    const headers = cookie ? { Cookie: cookie } : undefined
    const enginesReq = await service.search.getAll(headers ? { headers } : undefined)
    const favoritesResponse = await service.favorite.getFavorites(headers ? { headers } : undefined)
    return {
        props: {
            engines: enginesReq.data,
            favorites: favoritesResponse
        }
    }
}
