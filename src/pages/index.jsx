import service from "../service"
import {SearchEngineComponent} from "../components/SearchEngineComponent"
import {Box} from "@mui/material"
import LinkIcon from '@mui/icons-material/Link'

export default function IndexPage({engines}) {

    const favoriteSite = [
        {
            name: "Community",
            links: [
                {name: "clien", url: "http://www.clien.net/"},
                {name: "okky", url: "https://okky.kr/"},
                {name: "gorani", url: "https://gorani.kr/"},
                {name: "AAGAG", url: "https://aagag.com/mirror/?target=_blank&time=12"},
                {name: "뽐뿌", url: "http://www.ppomppu.co.kr/"},
                {name: "뽐뿌 - 캠핑포럼", url: "http://m.ppomppu.co.kr/new/bbs_list.php?id=camping"},
                {name: "뽐뿌 - 낚시포럼", url: "http://m.ppomppu.co.kr/new/bbs_list.php?id=fishing"},
            ]
        },
        {
            name: "Membership",
            links: [
                {name: "네이버플러스 X Lgu+", url: "https://nid.naver.com/membership/partner/uplus"},
                {name: "네이버플러스", url: "https://nid.naver.com/membership/my?m=viewSaving"},
            ]
        },
        {
            name: "<devTools>",
            links: [
                {name: "Make readme.md", url: "https://www.makeareadme.com/"},
                {name: "Code Sandbox", url: "https://codesandbox.io"},
                {name: "Js Fiddle", url: "https://jsfiddle.net/user/fiddles/all/"},
                {name: "Encoding", url: "https://coderstoolbox.net/"},
                {name: "Json to JavaClass", url: "https://codebeautify.org/json-to-java-converter"},
                {name: "Epoch & Unix Timestamp", url: "https://www.epochconverter.com/"},
                {name: "regex101(정규식 검색)", url: "https://regex101.com/library"},
                {name: "정규식 테스트", url: "https://regexr.com"},
                {name: "정규식 테스트(.net)", url: "http://regexstorm.net/tester"},
            ]
        },
        {
            name: "WebTools",
            links: [
                {name: "웹용 포토샵", url: "https://www.photopea.com"},
                {name: "Calc Cidr(IP대역계산)", url: "https://www.ipaddressguide.com/cidr"},
            ]
        },
        {
            name: "GeoService",
            links: [
                {name: "네이버 마이플레이스", url: "https://m.store.naver.com/myplace/home"},
            ]
        },
        {
            name: "etc",
            links: [
                {name: "VPN Gate", url: "http://www.vpngate.net/en/"},
                {name: "Almost 2,400 DOS GAMES using PC Browsers", url: "https://archive.org/details/softwarelibrary_msdos_games/v2"},
                {name: "Internet Arcade", url: "https://archive.org/details/internetarcade"},
            ]
        },
        {
            name: "철물점",
            links: [
                {name: "아이베란다", url: "http://www.iveranda.com/"},
            ]
        },
        {
            name: "Streaming",
            links: [
                {name: "누누.tv", url: "https://nunutv1.me/"},
            ]
        },
    ]

    return (
        <>
            <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between'}}>
                {engines.map((s) =>
                    <SearchEngineComponent key={s.id} name={s.name} url={s.url}/>
                )}
                {/*TODO: 비어있는 박스를 계산해서 넣어주면 한 칸 당길 수 있다.*/}
            </Box>
            <hr/>
            {favoriteSite.map((c) =>
                <Box key={c.name}>
                    <h3>{c.name}</h3>
                    <ul className={'list'}>
                        {c.links.map((c) =>
                            <li key={c.name} className={'item'}>
                                <a href={c.url} target="_blank" rel="noreferrer">
                                    <Box sx={{display: 'inline-flex', alignItems: 'center'}}>
                                        <LinkIcon/><span>{c.name}</span>
                                    </Box>
                                </a>
                            </li>
                        )}
                    </ul>
                </Box>
            )}

            <style jsx>
                {`
                  ul.list {
                    margin: 0px;
                  }

                  li.item {
                    display: inline-table;
                    padding: .5rem 1rem .5rem .5rem;
                  }
                `}
            </style>
        </>
    )
}
export async function getServerSideProps(context) {
    const cookie = context.req?.headers?.cookie
    const headers = cookie ? { Cookie: cookie } : undefined
    const enginesReq = await service.search.getAll(headers ? { headers } : undefined)
    return {
        props: {
            engines: enginesReq.data
        }
    }
}
