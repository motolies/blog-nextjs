export default function PostComponent({children, title, subtitle}) {

    // TODO: 포스트ID 또는 main 값을 여기로 넘기면 되는 것일까?

    return (
        <div className="container">
            <div className="columns">
                <div className="column is-10 is-offset-1">
                    <div className="section-title">
                        <h2>{title}</h2>
                        <h3>{subtitle}</h3>
                    </div>
                    <div>
                        {/*<h1>{data.markdownRemark.frontmatter.title}</h1>*/}
                        {/*<div dangerouslySetInnerHTML={{__html: data.markdownRemark.html}}/>*/}
                        <div>나는 본문이야~</div>
                    </div>
                </div>
            </div>
        </div>
    );

}