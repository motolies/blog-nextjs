export default function Footer({children}) {
    return (
        <>
            <footer className="footer admin-back-color">
                Powered by motolies
            </footer>
            <style jsx>
                {`
                  .footer {
                    display: none;
                  }

                  @media (min-width: 900px) {
                    .footer {
                      display: block;
                      position: fixed;
                      padding: 0.5rem;
                      left: 0;
                      bottom: 0;
                      width: 100%;
                      text-align: center;
                    }
                  }
                `}
            </style>
        </>)
}