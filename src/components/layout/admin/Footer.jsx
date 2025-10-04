import styles from './Footer.module.css'

export default function Footer({children}) {
    return (
        <footer className={`${styles.footer} admin-back-color`}>
            Powered by motolies
        </footer>
    )
}