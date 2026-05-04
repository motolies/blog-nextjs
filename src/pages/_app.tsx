import '../styles/global.css'
import '../styles/d2coding-subset.css'
import '../styles/rainbow.css'
import '../styles/ckeditor.css'
import '../styles/ckeditor-theme.css'
import CommonLayout from '../components/layout/common/CommonLayout'
import UtilityLayout from '../components/layout/common/UtilityLayout'
import AdminLayout from '../components/layout/admin/AdminLayout'
import {Toaster} from 'sonner'
import {useRouter} from "next/router"
import Loading from "../components/Loading"
import {useAuthStore} from "../store/useAuthStore"
import {useLoadingStore} from "../store/useLoadingStore"
import {useEffect, useRef, useState} from "react"
import {QueryClientProvider, HydrationBoundary} from '@tanstack/react-query'
import {makeQueryClient} from '../lib/queryClient'
import {ThemeProvider} from 'next-themes'
import type {AppProps} from 'next/app'

function Skyscape({Component, pageProps}: AppProps) {
  const [queryClient] = useState(() => makeQueryClient())
  const router = useRouter()
  const {isAuthenticated, loadProfile} = useAuthStore()
  const {isLoading} = useLoadingStore()
  const hasBootstrappedProfileRef = useRef(false)
  const isAdminRoute = router.pathname.startsWith('/admin')
  const isTestRoute = router.pathname.startsWith('/test')
  const isAdminLikeRoute = isAdminRoute || isTestRoute
  const isUtilRoute = router.pathname.startsWith('/util')
  const isLoginRoute = router.pathname === '/login'
  const shouldCheckClientAuth = isAdminLikeRoute || isLoginRoute

  useEffect(() => {
    if (typeof window === 'undefined' || hasBootstrappedProfileRef.current) {
      return
    }

    hasBootstrappedProfileRef.current = true
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (!shouldCheckClientAuth || isAuthenticated === null) {
      return
    }

    if (isAdminLikeRoute) {
      if (isAuthenticated === false) {
        router.replace('/login')
      }
      return
    }

    if (isLoginRoute && isAuthenticated === true) {
      router.replace('/admin')
    }
  }, [isAdminLikeRoute, isAuthenticated, isLoginRoute, router, shouldCheckClientAuth])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const {body, documentElement} = document

    if (isAdminLikeRoute) {
      body.dataset.adminUi = 'admin'
      body.classList.add('admin-route')
      documentElement.dataset.adminUi = 'admin'
      return
    }

    delete body.dataset.adminUi
    body.classList.remove('admin-route')
    delete documentElement.dataset.adminUi
  }, [isAdminLikeRoute])

  return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <HydrationBoundary state={pageProps.dehydratedState}>
            <Toaster richColors duration={2000} position="top-right" />
            {isLoading && <Loading/>}
            {isAdminLikeRoute ?
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
          </HydrationBoundary>
        </ThemeProvider>
      </QueryClientProvider>
  )
}

export default Skyscape
