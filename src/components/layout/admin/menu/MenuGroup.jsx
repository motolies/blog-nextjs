import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import styles from './Menu.module.css'

export default function MenuGroup({title, icon, isExpanded, onToggle, children}) {
    return (
        <li className={`${styles.menuItem} ${isExpanded ? 'open' : ''}`}>
            <button
                className={`${styles.menuLink} menu-toggle`}
                onClick={onToggle}
            >
                {icon}
                <span className={styles.menuText}>{title}</span>
                {isExpanded ?
                    <ExpandLessIcon className={styles.menuArrow}/> :
                    <ExpandMoreIcon className={styles.menuArrow}/>
                }
            </button>
            {isExpanded && (
                <ul className={styles.menuSub}>
                    {children}
                </ul>
            )}
        </li>
    )
}
