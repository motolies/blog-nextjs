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
import {useDispatch, useSelector} from "react-redux"
import {
  LOAD_USER_REQUEST,
  SERVER_LOAD_USER_REQUEST_SUCCESS
} from "../store/types/userTypes"
import service from "../service"
import {useEffect} from "react"

function Skyscape({Component, pageProps}) {
  const router = useRouter()
  const dispatch = useDispatch()
  const {isLoading} = useSelector((state) => state.common)
  const {isAuthenticated} = useSelector((state) => state.user)

  useEffect(() => {
    // 사용자 정보를 로드합니다 (CSR에서, 아직 인증 상태를 모를 때만)
    if (typeof window !== 'undefined' && isAuthenticated === null) {
      dispatch({type: LOAD_USER_REQUEST});
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // 인증 상태가 아직 확인되지 않은 경우 라우팅하지 않음
    if (isAuthenticated === null) {
      return;
    }

    // 보호 라우트 접근 제어: /admin* 은 인증 필요
    if (router.pathname.startsWith('/admin')) {
      if (isAuthenticated === false) {
        router.replace('/login');
      }
      return;
    }

    // 로그인 페이지에서 인증이 확인되면 관리자 홈으로
    if (router.pathname === '/login' && isAuthenticated === true) {
      router.replace('/admin');
    }
  }, [isAuthenticated, router]);

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
          console.log('[SSR] Incoming Cookie keys:', keys.join(','),
              `len=${cookie.length}`)
        } catch (_) {
        }
      } else {
        console.log('[SSR] No Cookie on incoming request')
      }

      if (cookie) {
        try {
          // Cookie에서 Authorization 값 추출
          const authToken = cookie.split(';')
              .map(c => c.trim())
              .find(c => c.startsWith('Authorization='))
              ?.split('=')[1]

          const headers = {
            Cookie: cookie,
            ...(authToken && {Authorization: `Bearer ${authToken}`})
          }

          console.log('[SSR] Forward Cookie to API, hasAuthToken:', !!authToken)

          const res = await service.user.profile({headers})
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
