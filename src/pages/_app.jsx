import '../styles/global.css'
import '../styles/d2coding-subset.css'
import '../styles/rainbow.css'
import '../styles/ck5.custom.css'
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

function Skyscape({Component, pageProps}) {
    const router = useRouter()
    const {isLoading} = useSelector((state) => state.common)
    const {isAuthenticated} = useSelector((state) => state.user)


    useEffect(() => {
        if (router.pathname.startsWith('/admin') && !isAuthenticated) {
            // TODO : 로그인한 상태인지 redux에서 확인해보고 로그인 상태가 아니라면 login 페이지로 보낸다, provider 같은걸 만들면 화면 깜빡임을 없을 수 있을 것 같다.
            router.push('/login')
        }
    }, [router.query.q])

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
    store =>

        async ({Component, ctx}) => {

            const req = ctx.req
            const cookie = req?.headers?.cookie

            if (cookie) {
                // 서버 환경일 때만 쿠키를 심어줌. 클라이언트 환경일 때는 브라우저가 자동으로 쿠키를 넣어줌
                axiosClient.defaults.headers.Cookie = cookie

                await service.user.profile()
                    .then(res => {
                        store.dispatch({
                            type: SERVER_LOAD_USER_REQUEST_SUCCESS,
                            user: res.data,
                        })
                    })
                    .catch(err => {
                        console.log(err)
                    })
            }

            return {
                pageProps: {
                    // Call page-level getInitialProps
                    // DON'T FORGET TO PROVIDE STORE TO PAGE
                    ...(Component.getInitialProps ? await Component.getInitialProps({...ctx, store}) : {}),
                    // Some custom thing for all pages
                    pathname: ctx.pathname,
                },
            }
        }
)


export default wrapper.withRedux(Skyscape)