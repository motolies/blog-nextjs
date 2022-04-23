import Link from "next/link";
import {Grid} from "@mui/material";

export default function Header({children}) {
    return (
        <>
            <nav className="top back-color">
                <div className="back">
                    <Grid
                        container
                        spacing={2}
                    >
                        <Grid item xs={7}>
                            <Link href={`/`}>
                                <a className="main-link">motolies</a>
                            </Link>
                        </Grid>
                        <Grid item xs={5}>
                            {/*여기가 검색과 로그인 버튼 자리*/}
                        </Grid>


                    </Grid>

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