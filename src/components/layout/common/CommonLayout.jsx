import MetaHeader from "./MetaHeader";
import Header from "./Header";
import Footer from './Footer'
import Section from "./Section";
import {createTheme, ThemeProvider} from "@mui/material";

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