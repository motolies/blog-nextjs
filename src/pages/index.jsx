import PostComponent from "../components/PostComponent"
import axiosClient from "../service/axiosClient"
import {LOAD_USER_REQUEST} from "../store/types/userTypes"
import service from "../service"

export default function Index({post}) {
    return (
        <>
            <PostComponent post={post}/>
        </>
    )
}


Index.getInitialProps = async (ctx) => {
    const {req, store} = ctx
    const state = store.getState()
    const cookie = req.headers.cookie

    if (cookie) {
        // 서버 환경일 때만 쿠키를 심어줌. 클라이언트 환경일 때는 브라우저가 자동으로 쿠키를 넣어줌
        axiosClient.defaults.headers.Cookie = cookie
    }
    if (!state.user.userName) { // 유저 정보 요청
        store.dispatch({
            type: LOAD_USER_REQUEST,
        })
    }

    const post = await service.post.mainPost()
        .then(res => res.data)
    return {
        post
    }
}


// export async function getServerSideProps(context) {
//     const post = await axiosClient.get(`/api/post`)
//         .then(res => res.data)
//     return {
//         props: {post}
//     }
// }