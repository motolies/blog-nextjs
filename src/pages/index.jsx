import PostComponent from "../components/PostComponent";
import axios from "axios";


export default function Index({post}) {
    return (
        <>
            <PostComponent post={post}/>
        </>
    )
}

export async function getServerSideProps(context) {
    const res = await axios.get(`http://localhost:9999/api/post`)
    const post = res.data
    return {
        props: {post}
    }
}