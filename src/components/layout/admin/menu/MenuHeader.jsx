import styles from './Menu.module.css'

export default function MenuHeader({title}) {
    return (
        <li className={styles.menuHeader}>
            <span className={styles.menuHeaderText}>{title}</span>
        </li>
    )
}
