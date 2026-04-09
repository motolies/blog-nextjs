import Link from 'next/link'
import styles from './Menu.module.css'

interface MenuItemProps {
    href: string
    icon?: React.ReactNode
    label: string
    isActive?: boolean
    isSubItem?: boolean
}

export default function MenuItem({href, icon, label, isActive = false, isSubItem = false}: MenuItemProps) {
    return (
        <li className={`${styles.menuItem} ${isActive ? styles.active : ''} ${isSubItem ? styles.subItem : ''}`}>
            <Link href={href} className={styles.menuLink}>
                {icon && <span className={styles.menuIcon}>{icon}</span>}
                <span className={styles.menuText}>{label}</span>
            </Link>
        </li>
    )
}
