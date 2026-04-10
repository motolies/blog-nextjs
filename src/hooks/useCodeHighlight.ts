import {useEffect} from 'react'

/**
 * 포스트 본문 내 코드 블록에 Prism.js 신택스 하이라이팅과 복사 버튼을 적용하는 훅.
 *
 * - CKEditor가 생성하는 <pre><code class="language-{lang}"> 구조를 Prism.js가 바로 인식
 * - 각 <pre> 블록 우상단에 복사 버튼을 동적 삽입
 * - 줄번호는 CSS counter 방식으로 처리
 */
export function useCodeHighlight(postBody: string) {
    useEffect(() => {
        if (!postBody) return

        const container = document.getElementById('post-content')
        if (!container) return

        let isCancelled = false

        const init = async () => {
            const Prism = (await import('prismjs')).default

            // 언어 컴포넌트 로드 (markup, clike는 다른 언어의 의존성이므로 먼저)
            await import('prismjs/components/prism-markup')
            await import('prismjs/components/prism-css')
            await import('prismjs/components/prism-clike')
            await import('prismjs/components/prism-javascript')
            await import('prismjs/components/prism-typescript')
            await import('prismjs/components/prism-python')
            await import('prismjs/components/prism-java')
            await import('prismjs/components/prism-sql')
            await import('prismjs/components/prism-bash')
            await import('prismjs/components/prism-json')
            await import('prismjs/components/prism-yaml')

            if (isCancelled) return

            // language-xml -> language-markup으로 매핑 (Prism은 XML을 markup으로 처리)
            container.querySelectorAll('code.language-xml').forEach(el => {
                el.classList.remove('language-xml')
                el.classList.add('language-markup')
            })

            // language-html -> language-markup
            container.querySelectorAll('code.language-html').forEach(el => {
                el.classList.remove('language-html')
                el.classList.add('language-markup')
            })

            // language-shell -> language-bash
            container.querySelectorAll('code.language-shell').forEach(el => {
                el.classList.remove('language-shell')
                el.classList.add('language-bash')
            })

            // language-plaintext는 하이라이팅 없이 표시
            // language 클래스가 없는 code 블록에도 기본 스타일 적용
            container.querySelectorAll('pre > code:not([class*="language-"])').forEach(el => {
                el.classList.add('language-plaintext')
            })

            Prism.highlightAllUnder(container)

            // 줄번호 삽입
            attachLineNumbers(container)

            // 복사 버튼 삽입
            attachCopyButtons(container)
        }

        init()

        return () => {
            isCancelled = true
            // 기존 동적 삽입 요소 정리
            container.querySelectorAll('.code-copy-btn').forEach(btn => btn.remove())
            container.querySelectorAll('.code-line-numbers').forEach(el => el.remove())
        }
    }, [postBody])
}

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`

const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`

function attachLineNumbers(container: HTMLElement) {
    container.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.code-line-numbers')) return

        const code = pre.querySelector('code')
        if (!code) return

        const text = code.textContent ?? ''
        const lineCount = text.split('\n').length
        // 마지막 줄이 빈 줄이면 줄번호에서 제외
        const adjustedCount = text.endsWith('\n') ? lineCount - 1 : lineCount

        if (adjustedCount <= 0) return

        const lineNumbersEl = document.createElement('span')
        lineNumbersEl.className = 'code-line-numbers'
        lineNumbersEl.setAttribute('aria-hidden', 'true')

        const numbers = Array.from({length: adjustedCount}, (_, i) => i + 1).join('\n')
        lineNumbersEl.textContent = numbers

        pre.classList.add('has-line-numbers')
        pre.insertBefore(lineNumbersEl, pre.firstChild)
    })
}

function attachCopyButtons(container: HTMLElement) {
    container.querySelectorAll('pre').forEach(pre => {
        // 이미 복사 버튼이 있으면 스킵
        if (pre.querySelector('.code-copy-btn')) return

        // pre를 relative 컨테이너로 설정
        pre.style.position = 'relative'

        const btn = document.createElement('button')
        btn.className = 'code-copy-btn'
        btn.type = 'button'
        btn.setAttribute('aria-label', '코드 복사')
        btn.innerHTML = COPY_ICON

        btn.addEventListener('click', async () => {
            const code = pre.querySelector('code')
            const text = code?.textContent ?? ''

            try {
                await navigator.clipboard.writeText(text)
                btn.innerHTML = CHECK_ICON
                btn.classList.add('copied')
                setTimeout(() => {
                    btn.innerHTML = COPY_ICON
                    btn.classList.remove('copied')
                }, 2000)
            } catch {
                // clipboard API 실패 시 fallback
                const textarea = document.createElement('textarea')
                textarea.value = text
                textarea.style.position = 'fixed'
                textarea.style.opacity = '0'
                document.body.appendChild(textarea)
                textarea.select()
                document.execCommand('copy')
                document.body.removeChild(textarea)
                btn.innerHTML = CHECK_ICON
                btn.classList.add('copied')
                setTimeout(() => {
                    btn.innerHTML = COPY_ICON
                    btn.classList.remove('copied')
                }, 2000)
            }
        })

        pre.appendChild(btn)
    })
}
