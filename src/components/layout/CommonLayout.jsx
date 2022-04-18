import Header from "./common/Header";
import Nav from "./common/Nav";
import Footer from './common/Footer'
import Section from "./common/Section";


export default function CommonLayout({children}) {
    return (
        <>
            <Header/>
            <Nav/>
            <Section>
                {children}
            </Section>
            <Footer/>
        </>
    )
}