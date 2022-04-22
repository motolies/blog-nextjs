export default function PostComponent({children, title, subtitle, content}) {

    // TODO: 포스트ID 또는 main 값을 여기로 넘기면 되는 것일까?

    return (
        <>
            <div className="post">
                <div>
                    <h2>{title}</h2>
                </div>
                <div>
                    <div className="content" dangerouslySetInnerHTML={{__html: content}}/>
                </div>
            </div>
        </>


    );

}