export default function Footer({children}) {
    return (
        <>
            <footer className="footer back-color">
                Powered by motolies
            </footer>
            <style jsx>
                {`
                  .footer {
                    position: fixed;
                    padding: 0.5rem;
                    left: 0;
                    bottom: 0;
                    width: 100%;
                    text-align: center;
                  }
                `}
            </style>
        </>)
}