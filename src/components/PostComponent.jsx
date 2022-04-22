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
            <style jsx>
                {`
                  .post {
                    margin: 0 auto;
                    width: 80%;
                    padding: 4rem;
                    //border: 1px solid #ccc;
                    //border-radius: 5px;
                    //box-shadow: 0 0 5px #ccc;
                  }

                  .post:after {
                    content: " ";
                    display: block;
                    clear: both;
                  }

                  .content {
                    scroll: auto;
                  }
                `}
            </style>
        </>


    );

}