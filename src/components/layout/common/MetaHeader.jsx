import Head from "next/head";

export default function MetaHeader({children, ...props}) {
    return (
        <Head>
            <title>Skyscape</title>
            <meta name="description" content="IT blog by motolies"/>
            <meta name="robots" content="nofollow"/>
            <meta name="author" content="motolies"/>
            <link rel="icon" href="/favicon.ico"/>
        </Head>
    )
}