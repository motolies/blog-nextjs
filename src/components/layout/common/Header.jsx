import Link from "next/link";

export default function Header({children}) {
    return (
        <>
            <nav className="top back-color">
                <div className="back">
                    <Link href={`/`}>
                        <a className="main-link">motolies</a>
                    </Link>
                </div>
            </nav>
            <style jsx>
                {`
                  .top {
                    height: 3rem;
                    position: fixed;
                    top: 0;
                    right: 0;
                    left: 0;
                    z-index: 1024;
                  }

                  .back {
                    display: inline-block;
                    position: relative;
                    width: 100%;
                    height: 100%;
                    line-height: 3rem;
                  }

                  .main-link {
                    margin-left: 1rem;
                    font-size: 1.25rem;
                    color: #fff;
                    text-decoration: none;
                  }

                  @media ( min-width: 576px) {
                    .top {
                      height: 3.5rem;
                      position: fixed;
                      top: 0;
                      right: 0;
                      left: 0;
                      z-index: 1024;
                    }

                    .back {
                      line-height: 3.5rem;
                    }
                  }
                `}
            </style>
        </>
    );
}