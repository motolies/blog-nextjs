export default function Header({children}) {
    return (
        <>
            <nav className="top back-color">
                <h1>나는 nav</h1>
            </nav>
            <style jsx>
                {`
                  .top {
                    border-bottom: 1px solid #e5e5e5;
                    position: fixed;
                    top: 0;
                    right: 0;
                    left: 0;
                    z-index: 1024;
                  }
                `}
            </style>
        </>
    );
}