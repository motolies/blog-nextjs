import Head from "next/head";

export default function MetaHeader({children, ...props}) {
    const logo = process.env.META_URL + "/images/og-logo.png"
    return (
        <Head>
            <title>Skyscape</title>
            <meta name="description" content="IT blog by motolies"/>
            <meta name="robots" content="ALL"/>
            <meta name="robots" content="index,follow"/>
            <meta name="author" content="motolies"/>
            <link rel="icon" href="/favicon.ico"/>
            <meta property="og:image" content={logo}/>

            <meta name="naver-site-verification" content="dea29fb1cd45a91583f252df95e93651693297a3"/>

            {/*Google Tag Manager */}
            {/*https://morganfeeney.com/how-to/integrate-google-tag-manager-with-next-js*/}
            <script
                dangerouslySetInnerHTML={{
                    __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TC3HJL9');`,
                }}
            />

            {/*End Google Tag Manager*/}
        </Head>
    )
}