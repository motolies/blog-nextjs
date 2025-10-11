import styles from './Section.module.css'

export default function Section({children, title, subtitle}) {
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