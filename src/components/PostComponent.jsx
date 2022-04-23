export default function PostComponent({post}) {

    if (post?.id !== 0 && post?.id > 0) {
        return (
            <>
                <div className="post">
                    <div>
                        <h2>{post.subject}</h2>
                        <h2>{post.categoryId}</h2>
                    </div>
                    <div>
                        <div className="content" dangerouslySetInnerHTML={{__html: post.body}}/>
                    </div>
                </div>
            </>
        )
    } else {
        return (
            <>
                <div className="post">
                    <div>
                        <h2>No post found</h2>
                    </div>
                </div>
            </>
        )
    }

}

