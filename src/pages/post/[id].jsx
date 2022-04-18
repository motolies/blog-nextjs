import PostComponent from "../../components/PostComponent";
import {useRouter} from "next/router";

export default function Post({children, data}) {
    const router = useRouter()
    const {id} = router.query

    return (
        <PostComponent title={'데이터ㅓㅓㅓㅁㄴㅇㄹㅓㅓ'} subtitle={id}/>
    )
}