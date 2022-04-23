import PostComponent from "../../components/PostComponent";
import {useRouter} from "next/router";
import axiosClient from "../../lib/axiosClient";


export default function Post({children, post}) {
    const router = useRouter()
    const {id} = router.query
    return (
        <>
            <PostComponent post={post}/>
        </>
    )
}

export async function getServerSideProps(context) {
    const post = await axiosClient.get(`/api/post/${context.params.id}`)
        .then(res => res.data)
    return {
        props: {post}
    }
}