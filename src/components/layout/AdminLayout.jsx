import Footer from './common/Footer'

export default function AdminLayout({children}) {
    return (
        <>
            <main>{children}</main>
            <Footer/>
        </>
    )
}