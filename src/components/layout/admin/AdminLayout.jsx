import Footer from '../admin/Footer'
import {createTheme, ThemeProvider} from "@mui/material"
import Header from "../admin/Header"
import Section from "../admin/Section"
import {useEffect} from "react"
import {useRouter} from "next/router"
import WriteSection from "./WriteSection"

const theme = createTheme({

    palette: {
        primary: {
            main: '#1565c0'
        },
        secondary: {
            main: '#7b1fa2',
        },
        error: {
            main: '#c62828',
        },
        warning: {
            main: '#e65100',
        },
        info: {
            main: '#01579b',
        },
        success: {
            main: '#1b5e20',
        },
    },
})

export default function AdminLayout({children}) {
    const router = useRouter()

    useEffect(() => {
        document.title = "Admin"
    }, [])

    return (
        <>
            <ThemeProvider theme={theme}>
                <Header/>
                {router.pathname.startsWith('/admin/write') ?
                    <WriteSection>
                        {children}
                    </WriteSection>
                    :
                    <Section>
                        {children}
                    </Section>
                }
                <Footer/>
            </ThemeProvider>
        </>
    )
}