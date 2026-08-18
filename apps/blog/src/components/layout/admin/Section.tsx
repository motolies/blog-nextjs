import styles from './Section.module.css'

interface SectionProps {
    children: React.ReactNode
    title?: string
    subtitle?: string
}

export default function Section({children, title, subtitle}: SectionProps) {
    return (
        <section className={styles.section}>
            {(title || subtitle) && (
                <div className={styles.header}>
                    {title && <h2 className={styles.title}>{title}</h2>}
                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>
            )}
            <div className={styles.content}>
                {children}
            </div>
        </section>
    );
}
