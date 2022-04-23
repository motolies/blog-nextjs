import MetaHeader from "./common/MetaHeader";
import Header from "./common/Header";
import Footer from './common/Footer'
import Section from "./common/Section";
import {createTheme, ThemeProvider} from "@mui/material";

const theme = createTheme({
    palette: {
        primary: {
            main: '#6c757d'
        },
        secondary: {
            main: '#398AB9',
        },
        error: {
            main: '#E8630A',
        },
        warning: {
            main: '#FCD900',
        },
        info: {
            main: '#90AFC5',
        },
        success: {
            main: '#95CD41',
        },
    },
});

export default function CommonLayout({children}) {
    return (
        <ThemeProvider theme={theme}>
            <MetaHeader/>
            <Header/>
            <Section>
                {children}
            </Section>
            <Footer/>
        </ThemeProvider>
    )
}