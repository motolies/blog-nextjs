import PostComponent from "../../components/PostComponent"
import axiosClient from "../../service/axiosClient"
import service from "../../service"

export default function Post({children, post}) {
    return (
        <>
            <PostComponent post={post}/>
        </>
    )
}

export async function getServerSideProps(context) {
    // 서버사이드 렌더링 할 때는 사용자 정보를 다시 넣어주도록 하자.
    try {
        const postId = context.params.id
        const post = await service.post.getPost({postId})
            .then(res => res.data)
        return {
            props: {post}
        }
    } catch (error) {
        console.log(error.response.status)
        console.log(error)
        return {
            props: {id: 0}
        }
    }
}