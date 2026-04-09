import {ChevronDown, ChevronUp} from 'lucide-react'
import styles from './Menu.module.css'

interface MenuGroupProps {
    title: string
    icon?: React.ReactNode
    isExpanded: boolean
    onToggle: () => void
    children: React.ReactNode
}

export default function MenuGroup({title, icon, isExpanded, onToggle, children}: MenuGroupProps) {
    return (
        <li className={`${styles.menuItem} ${isExpanded ? 'open' : ''}`}>
            <button
                className={`${styles.menuLink} menu-toggle`}
                onClick={onToggle}
            >
                {icon}
                <span className={styles.menuText}>{title}</span>
                {isExpanded ?
                    <ChevronUp className={`${styles.menuArrow} h-4 w-4`}/> :
                    <ChevronDown className={`${styles.menuArrow} h-4 w-4`}/>
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
