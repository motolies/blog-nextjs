export default function Section({children, title, subtitle}) {
    return (
        <>
            <section className="section">
                {children}
            </section>
            <style jsx>
                {`
                  .section {
                    padding-top: 4rem;
                  }
                `}
            </style>
        </>

    );
}