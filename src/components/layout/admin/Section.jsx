import styles from './Section.module.css'

export default function Section({children, title, subtitle}) {
    return (
        <section className={styles.section}>
            {children}
        </section>
    );
}