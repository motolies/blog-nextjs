import styles from './WriteSection.module.css'

export default function WriteSection({children, title, subtitle}) {
    return (
        <section className={styles.section}>
            {children}
        </section>
    );
}