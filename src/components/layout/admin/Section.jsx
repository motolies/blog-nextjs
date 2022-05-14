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
                    padding: 4rem 1.5rem 4rem 1rem;
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
        </>

    );
}