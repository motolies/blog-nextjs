import Link from "next/link"
import styles from './Footer.module.css'

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className="public-container mt-10 px-4 pb-8 sm:px-6 lg:px-8">
                <div className="public-label-text px-1 py-2 text-[11px] uppercase tracking-[0.18em]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span>Motolies public workspace</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
