import styles from './Section.module.css'

export default function Section({children, title, subtitle}) {
    return (
        <>
            <section className={styles.section}>
                {children}
            </section>
            {/*Google Tag Manager (noscript)*/}
            <noscript
                dangerouslySetInnerHTML={{
                    __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TC3HJL9" height="0" width="0" style="display:none;visibility:hidden" />`,
                }}
            />
            {/*End Google Tag Manager (noscript)*/}
        </>
    );
}