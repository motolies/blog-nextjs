import '../styles/global.css'
import '../styles/d2coding-subset.css'
import '../styles/rainbow.css'
import '../styles/ck5.custom.css'
import '../styles/mui-data-grid.css'
import CommonLayout from '../components/layout/common/CommonLayout'
import AdminLayout from '../components/layout/admin/AdminLayout'
import {wrapper} from '../store'
import {SnackbarProvider} from "notistack"
import {useRouter} from "next/router"
import Loading from "../components/Loading"
import {useSelector} from "react-redux"
import {SERVER_LOAD_USER_REQUEST_SUCCESS} from "../store/types/userTypes"
import service from "../service"
import {useEffect} from "react"
import {useDispatch} from "react-redux"
import {LOAD_USER_REQUEST} from "../store/types/userTypes"

function Skyscape({Component, pageProps}) {
    const router = useRouter()
    const dispatch = useDispatch()
    const {isLoading} = useSelector((state) => state.common)
    const {isAuthenticated} = useSelector((state) => state.user)

    useEffect(() => {
        // 사용자 정보를 로드합니다 (SSR이 아닌 경우)
        if (typeof window !== 'undefined' && !isAuthenticated) {
            dispatch({type: LOAD_USER_REQUEST})
        }
    }, [])

    useEffect(() => {
        if (router.pathname.startsWith('/admin') && !isAuthenticated) {
            // TODO : 로그인한 상태인지 redux에서 확인해보고 로그인 상태가 아니라면 login 페이지로 보낸다, provider 같은걸 만들면 화면 깜빡임을 없을 수 있을 것 같다.
            router.push('/login')
        }
    }, [router.query.q, isAuthenticated])

    return (
        <SnackbarProvider autoHideDuration={2000}>
            {isLoading && <Loading/>}
            {router.pathname.startsWith('/admin') ?
                <AdminLayout>
                    <Component {...pageProps} />
                </AdminLayout>
                : <CommonLayout>
                    <Component {...pageProps} />
                </CommonLayout>}
        </SnackbarProvider>
    )
}

Skyscape.getInitialProps = wrapper.getInitialAppProps(
    store => async ({Component, ctx}) => {
        const req = ctx.req
        const cookie = req?.headers?.cookie

        // 디버깅용: 들어온 쿠키 키만 로깅 (값은 마스킹)
        if (cookie) {
            try {
                const keys = cookie.split(';').map(s => s.split('=')[0].trim())
                console.log('[SSR] Incoming Cookie keys:', keys.join(','), `len=${cookie.length}`)
            } catch (_) {}
        } else {
            console.log('[SSR] No Cookie on incoming request')
        }

        if (cookie) {
            try {
                // 백엔드가 Cookie에서 Authorization을 직접 읽으므로 Cookie만 전달
                const headers = { Cookie: cookie }

                console.log('[SSR] Forward Cookie to API')

                const res = await service.user.profile({ headers })
                store.dispatch({
                    type: SERVER_LOAD_USER_REQUEST_SUCCESS,
                    user: res.data,
                })
            } catch (err) {
                // 인증 실패시 로그만 기록하고 계속 진행
                console.log('서버사이드 인증 실패:', err?.response?.status || err.message)
            }
        }

        return {
            pageProps: {
                // 페이지 레벨 getInitialProps 호출
                ...(Component.getInitialProps
                    ? await Component.getInitialProps({...ctx, store})
                    : {}),
                pathname: ctx.pathname,
            },
        }
    }
)

export default wrapper.withRedux(Skyscape)
