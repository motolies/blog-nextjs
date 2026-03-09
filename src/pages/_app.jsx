import '../styles/global.css'
import '../styles/d2coding-subset.css'
import '../styles/rainbow.css'
import '../styles/ckeditor.css'
import CommonLayout from '../components/layout/common/CommonLayout'
import UtilityLayout from '../components/layout/common/UtilityLayout'
import AdminLayout from '../components/layout/admin/AdminLayout'
import {wrapper} from '../store'
import {Toaster} from 'sonner'
import {useRouter} from "next/router"
import Loading from "../components/Loading"
import {useDispatch, useSelector} from "react-redux"
import {
  LOAD_USER_REQUEST,
  SERVER_LOAD_USER_REQUEST_SUCCESS
} from "../store/types/userTypes"
import service from "../service"
import {useEffect, useRef} from "react"
import {buildBackendAuthConfig} from "../lib/ssrRequestAuth"

function Skyscape({Component, pageProps}) {
  const router = useRouter()
  const dispatch = useDispatch()
  const {isLoading} = useSelector((state) => state.common)
  const {isAuthenticated} = useSelector((state) => state.user)
  const hasBootstrappedProfileRef = useRef(false)
  const isAdminRoute = router.pathname.startsWith('/admin')
  const isUtilRoute = router.pathname.startsWith('/util')
  const isLoginRoute = router.pathname === '/login'
  const shouldCheckClientAuth = isAdminRoute || isLoginRoute

  useEffect(() => {
    if (typeof window === 'undefined' || hasBootstrappedProfileRef.current) {
      return
    }

    hasBootstrappedProfileRef.current = true
    dispatch({type: LOAD_USER_REQUEST})
  }, [dispatch])

  useEffect(() => {
    if (!shouldCheckClientAuth || isAuthenticated === null) {
      return
    }

    if (isAdminRoute) {
      if (isAuthenticated === false) {
        router.replace('/login')
      }
      return
    }

    if (isLoginRoute && isAuthenticated === true) {
      router.replace('/admin')
    }
  }, [isAdminRoute, isAuthenticated, isLoginRoute, router, shouldCheckClientAuth])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const {body, documentElement} = document

    if (isAdminRoute) {
      body.dataset.adminUi = 'admin'
      body.classList.add('admin-route')
      documentElement.dataset.adminUi = 'admin'
      return
    }

    delete body.dataset.adminUi
    body.classList.remove('admin-route')
    delete documentElement.dataset.adminUi
  }, [isAdminRoute])

  return (
      <>
        <Toaster richColors duration={2000} position="top-right" />
        {isLoading && <Loading/>}
        {isAdminRoute ?
            <AdminLayout>
              <Component {...pageProps} />
            </AdminLayout>
            : <CommonLayout>
              {isUtilRoute ? (
                  <UtilityLayout>
                    <Component {...pageProps} />
                  </UtilityLayout>
              ) : (
                  <Component {...pageProps} />
              )}
            </CommonLayout>}
      </>
  )
}

Skyscape.getInitialProps = wrapper.getInitialAppProps(
    store => async ({Component, ctx}) => {
      const req = ctx.req
      const authConfig = buildBackendAuthConfig(req)

      if (authConfig) {
        try {
          const res = await service.user.profile(authConfig)
          store.dispatch({
            type: SERVER_LOAD_USER_REQUEST_SUCCESS,
            payload: res.data,
          })
        } catch (err) {
          // 인증 실패시 로그만 기록하고 계속 진행
          console.error('서버사이드 인증 실패:', err?.response?.status || err.message)
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
