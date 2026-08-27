import Script from 'next/script';

/**
 * Google Tag Manager 로더 서버 컴포넌트(옛 MetaHeader(next/head)의 <Script id="gtm-script">).
 * next/script 는 서버 컴포넌트에서 사용 가능하다. 공개 영역((public)/layout·not-found)에만 배치한다.
 * https://morganfeeney.com/how-to/integrate-google-tag-manager-with-next-js
 */
export default function GtmScript() {
  return (
    <Script
      id="gtm-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TC3HJL9');`,
      }}
    />
  );
}
