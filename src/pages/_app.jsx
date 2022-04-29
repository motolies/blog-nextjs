import '../styles/global.css'
import '../styles/d2coding-subset.css'
import '../styles/rainbow.css'
import CommonLayout from '../components/layout/CommonLayout'
import AdminLayout from '../components/layout/AdminLayout'
import {wrapper} from '../store'
import App from "next/app"
import {SnackbarProvider} from "notistack"


class Skyscape extends App {
    static getInitialProps = wrapper.getInitialAppProps(store => async ({Component, ctx}) => {

        return {
            pageProps: {
                // Call page-level getInitialProps
                // DON'T FORGET TO PROVIDE STORE TO PAGE
                ...(Component.getInitialProps ? await Component.getInitialProps({...ctx, store}) : {}),
                // Some custom thing for all pages
                pathname: ctx.pathname,
            },
        }

    })


    render() {
        const {Component, pageProps} = this.props


        if (this.props.router.pathname.startsWith('/admin')) {
            // TODO : 로그인한 상태인지 backend로 보내서 사용자 정보를 가져와 본다.
            // router.push('/admin')
            return (
                <SnackbarProvider autoHideDuration={3000}>
                    <AdminLayout>
                        <Component {...pageProps}/>
                    </AdminLayout>
                </SnackbarProvider>
            )
        } else {
            return (
                <SnackbarProvider autoHideDuration={3000}>
                    <CommonLayout>
                        <Component {...pageProps} />
                    </CommonLayout>
                </SnackbarProvider>
            )
        }
    }


}


export default wrapper.withRedux(Skyscape)