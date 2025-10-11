import Link from 'next/link'
import styles from './Menu.module.css'

export default function MenuItem({href, icon, label, isActive = false, isSubItem = false}) {
    return (
        <li className={`${styles.menuItem} ${isActive ? styles.active : ''} ${isSubItem ? styles.subItem : ''}`}>
            <Link href={href} className={styles.menuLink}>
                {icon && <span className={styles.menuIcon}>{icon}</span>}
                <span className={styles.menuText}>{label}</span>
            </Link>
        </li>
    )
}
