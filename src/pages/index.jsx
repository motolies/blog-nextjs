import PostComponent from "../components/PostComponent";
import axiosClient from "../lib/axiosClient";

export default function Index({post}) {
    return (
        <>
            <PostComponent post={post}/>
        </>
    )
}

export async function getServerSideProps(context) {
    const post = await axiosClient.get(`/api/post`)
        .then(res => res.data)
    return {
        props: {post}
    }
}