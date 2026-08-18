import styles from './Menu.module.css'

interface MenuHeaderProps {
    title: string
}

export default function MenuHeader({title}: MenuHeaderProps) {
    return (
        <li className={styles.menuHeader}>
            <span className={styles.menuHeaderText}>{title}</span>
        </li>
    )
}
