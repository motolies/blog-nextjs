import Head from "next/head";

export default function MetaHeader({children, ...props}) {
    const logo = process.env.META_URL + "/images/og-logo.png"
    return (
        <Head>
            <title>Skyscape</title>
            <meta name="description" content="IT blog by motolies"/>
            <meta name="robots" content="index,nofollow"/>
            <meta name="author" content="motolies"/>
            <link rel="icon" href="/favicon.ico"/>
            <meta property="og:image" content={logo} />

            <meta name="naver-site-verification" content="dea29fb1cd45a91583f252df95e93651693297a3" />
        </Head>
    )
}