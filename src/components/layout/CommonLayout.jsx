import MetaHeader from "./common/MetaHeader";
import Header from "./common/Header";
import Footer from './common/Footer'
import Section from "./common/Section";


export default function CommonLayout({children}) {
    return (
        <>
            <MetaHeader/>
            <Header/>
            <Section>
                {children}
            </Section>
            <Footer/>
        </>
    )
}