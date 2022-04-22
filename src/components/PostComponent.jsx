import axios from "axios";

export default function PostComponent({children, post}) {

    // TODO: 포스트ID 또는 main 값을 여기로 넘기면 되는 것일까?

    const title = '제목';
    const content = '내용';

    return (
        <>
            <div className="post">
                <div>
                    <h2>{title}</h2>
                    <h2>{post}</h2>
                </div>
                <div>
                    <div className="content" dangerouslySetInnerHTML={{__html: content}}/>
                </div>
            </div>
        </>
    );

}

export async function getServerSideProps(context, isMain, postId) {
    console.log('asdf')
    console.log(context)
    console.log(isMain)
    console.log(postId)
    const post = await axios.get("http://localhost:9999/api/post");
    return {
        props: {post}
    };
};