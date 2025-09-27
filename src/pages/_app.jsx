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
import axiosClient from "../service/axiosClient"
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

export default wrapper.withRedux(Skyscape)