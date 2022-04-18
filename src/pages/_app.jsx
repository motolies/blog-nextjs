import {useDispatch, useSelector} from 'react-redux';
import {useRouter} from 'next/router';
import CommonLayout from '../components/layout/CommonLayout';
import AdminLayout from '../components/layout/AdminLayout';

function MyApp({Component, pageProps}) {

    const router = useRouter();
    // const dispatch = useDispatch();


    if (router.pathname.startsWith('/admin')) {
        // TODO : 로그인한 상태인지 backend로 보내서 사용자 정보를 가져와 본다.
        // router.push('/admin')
        return (
            <AdminLayout>
                <Component {...pageProps} />
            </AdminLayout>
        )
    } else {
        return (
            <CommonLayout>
                <Component {...pageProps} />
            </CommonLayout>
        )
    }

}

export default MyApp
