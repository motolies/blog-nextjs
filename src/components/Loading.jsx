import React from 'react'
import Image from 'next/image'
import styles from './Loading.module.css'

export default function Loading() {
    return (
        <div className={styles.loading}>
            <Image src="/images/loading.gif" alt="loading" width={128} height={128} unoptimized/>
        </div>
    )
}

