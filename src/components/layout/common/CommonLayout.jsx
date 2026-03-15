import MetaHeader from "./MetaHeader";
import Header from "./Header";
import Footer from './Footer'
import Section from "./Section";
import skipStyles from './SkipNavigation.module.css'

export default function CommonLayout({children}) {
    return (
        <>
            <a href="#main-content" className={skipStyles.skipLink}>본문으로 건너뛰기</a>
            <MetaHeader/>
            <div className="public-page isolate min-h-screen">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,251,253,0.52),rgba(234,240,244,0.18))] dark:bg-[linear-gradient(180deg,rgba(12,20,29,0.28),rgba(18,29,39,0.12))]"/>
                    <div className="absolute left-1/2 top-0 h-[42rem] w-[72rem] -translate-x-1/2 bg-[radial-gradient(circle,rgba(59,130,246,0.18),transparent_72%)]"/>
                    <div className="absolute -left-28 top-[16rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.16),transparent_70%)]"/>
                    <div className="absolute bottom-[6rem] right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.14),transparent_70%)]"/>
                </div>
                <div className="relative z-10 flex min-h-screen flex-col">
                    <Header/>
                    <Section>
                        {children}
                    </Section>
                    <Footer/>
                </div>
            </div>
        </>
    )
}
