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
                    <div className="absolute inset-0 dark:bg-[linear-gradient(180deg,rgba(12,20,29,0.28),rgba(18,29,39,0.12))]"/>
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
