export default function Section({children, title, subtitle}) {
    return (
        <>

            <section className="section">
                {children}
            </section>
            <style jsx>
                {`
                  .section {
                    margin: 0 auto;
                    width: 90%;
                    padding: 4rem 1.5rem 4rem 1.5rem;
                  }

                  .section:after {
                    content: " ";
                    display: block;
                    clear: both;
                  }

                  .content {
                    scroll: auto;
                  }

                  @media ( min-width: 992px) {
                    .section {
                      width: 70%;
                      padding: 4rem 1.5rem 4rem 1rem;
                    }
                  }
                `}
            </style>
            {/*Google Tag Manager (noscript)*/}
            <noscript
                dangerouslySetInnerHTML={{
                    __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TC3HJL9" height="0" width="0" style="display:none;visibility:hidden" />`,
                }}
            />
            {/*End Google Tag Manager (noscript)*/}
        </>

    );
}