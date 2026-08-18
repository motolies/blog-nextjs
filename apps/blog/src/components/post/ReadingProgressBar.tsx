import {useEffect, useState, useCallback, useRef} from 'react'

/**
 * 포스트 본문(post-content) 기준 읽기 진행률 바.
 * 페이지 최상단에 고정된 얇은 바로 현재 읽기 진행 정도를 시각적으로 표시.
 */
export default function ReadingProgressBar() {
    const [progress, setProgress] = useState(0)
    const rafRef = useRef<number>(0)

    const updateProgress = useCallback(() => {
        const content = document.getElementById('post-content')
        if (!content) return

        const rect = content.getBoundingClientRect()
        const contentTop = rect.top + window.scrollY
        const contentHeight = rect.height
        const scrollY = window.scrollY
        const windowHeight = window.innerHeight

        // 본문 시작 전이면 0%, 본문 끝을 지나면 100%
        const start = contentTop
        const end = contentTop + contentHeight - windowHeight

        if (end <= start) {
            // 본문이 뷰포트보다 짧은 경우
            setProgress(scrollY >= start ? 100 : 0)
            return
        }

        const pct = ((scrollY - start) / (end - start)) * 100
        setProgress(Math.min(100, Math.max(0, pct)))
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(updateProgress)
        }

        // 초기 계산
        updateProgress()

        window.addEventListener('scroll', handleScroll, {passive: true})
        window.addEventListener('resize', handleScroll, {passive: true})

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', handleScroll)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [updateProgress])

    if (progress <= 0) return null

    return (
        <div
            className="fixed left-0 top-0 z-50 h-[3px] bg-sky-500 transition-[width] duration-100 ease-out"
            style={{width: `${progress}%`}}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="읽기 진행률"
        />
    )
}
