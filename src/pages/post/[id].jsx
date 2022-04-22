import PostComponent from "../../components/PostComponent";
import {useRouter} from "next/router";
import axios from "axios";


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
    const post = await axios.get(`http://localhost:9999/api/post/${context.params.id}`)
        .then(res => res.data)
    return {
        props: {post}
    }
}