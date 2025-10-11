import Link from 'next/link'
import MenuIcon from '@mui/icons-material/Menu'
import styles from './Header.module.css'

export default function Header({toggleMenu}) {
    return (
        <nav className={styles.layoutNavbar}>
            <div className={styles.navbarContent}>
                <button className={styles.menuToggleBtn} onClick={toggleMenu}>
                    <MenuIcon/>
                </button>
                <Link href="/" className={styles.brandLink}>
                    Admin
                </Link>
            </div>
        </nav>
    )
}
