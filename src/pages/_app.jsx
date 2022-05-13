import '../styles/global.css'
import '../styles/d2coding-subset.css'
import '../styles/rainbow.css'
import CommonLayout from '../components/layout/CommonLayout'
import AdminLayout from '../components/layout/AdminLayout'
import {wrapper} from '../store'
import {SnackbarProvider} from "notistack"
import {useRouter} from "next/router"
import Loading from "../components/Loading"
import {useSelector} from "react-redux"


function Skyscape({Component, pageProps}) {
    const router = useRouter()
    const {isLoading} = useSelector((state) => state.common)

    if (router.pathname.startsWith('/admin')) {
        // TODO : 로그인한 상태인지 redux에서 확인해보고 로그인 상태가 아니라면 login 페이지로 보낸다

    }

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