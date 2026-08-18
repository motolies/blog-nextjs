import styles from './Footer.module.css'

interface FooterProps {
    children?: React.ReactNode
}

export default function Footer({children}: FooterProps) {
    return (
        <footer className={`${styles.footer} admin-back-color`}>
            Powered by motolies
        </footer>
    )
}
