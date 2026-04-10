import {useEffect, useState, useCallback} from 'react'
import {List, ChevronDown} from 'lucide-react'
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '../ui/collapsible'

interface TocItem {
    id: string
    text: string
    level: number
}

interface TableOfContentsProps {
    postBody: string
}

const INDENT_MAP: Record<number, string> = {
    1: 'pl-0',
    2: 'pl-0',
    3: 'pl-4',
    4: 'pl-8',
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[\s]+/g, '-')
        .replace(/[^\p{L}\p{N}\-_]/gu, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

export default function TableOfContents({postBody}: TableOfContentsProps) {
    const [items, setItems] = useState<TocItem[]>([])
    const [activeId, setActiveId] = useState<string>('')

    // 본문 렌더 후 heading 수집 및 id 부여
    useEffect(() => {
        if (!postBody) {
            setItems([])
            return
        }

        // DOM 렌더링 후 실행을 보장하기 위한 requestAnimationFrame
        const frameId = requestAnimationFrame(() => {
            const container = document.getElementById('post-content')
            if (!container) return

            const headings = container.querySelectorAll('h1, h2, h3, h4')
            if (headings.length === 0) {
                setItems([])
                return
            }

            const slugCount = new Map<string, number>()
            const tocItems: TocItem[] = []

            headings.forEach(heading => {
                const text = heading.textContent?.trim() ?? ''
                if (!text) return

                let slug = slugify(text)
                if (!slug) slug = 'heading'

                // 중복 slug 처리
                const count = slugCount.get(slug) ?? 0
                slugCount.set(slug, count + 1)
                const uniqueSlug = count > 0 ? `${slug}-${count}` : slug

                heading.id = uniqueSlug

                const level = parseInt(heading.tagName.charAt(1), 10)
                tocItems.push({id: uniqueSlug, text, level})
            })

            setItems(tocItems)
        })

        return () => cancelAnimationFrame(frameId)
    }, [postBody])

    // IntersectionObserver로 현재 가시 heading 추적
    useEffect(() => {
        if (items.length === 0) return

        const headingElements = items
            .map(item => document.getElementById(item.id))
            .filter((el): el is HTMLElement => el !== null)

        if (headingElements.length === 0) return

        // 가장 상단에 보이는 heading을 active로 설정
        const observer = new IntersectionObserver(
            (entries) => {
                // 화면에 진입하는 heading 중 가장 위에 있는 것
                const visibleEntries = entries.filter(e => e.isIntersecting)
                if (visibleEntries.length > 0) {
                    // boundingClientRect.top이 가장 작은 (가장 위) 항목
                    const topEntry = visibleEntries.reduce((prev, curr) =>
                        prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
                    )
                    setActiveId(topEntry.target.id)
                }
            },
            {
                rootMargin: '-80px 0px -70% 0px',
                threshold: 0,
            }
        )

        headingElements.forEach(el => observer.observe(el))

        return () => observer.disconnect()
    }, [items])

    const handleClick = useCallback((id: string) => {
        const el = document.getElementById(id)
        if (el) {
            el.scrollIntoView({behavior: 'smooth'})
        }
    }, [])

    if (items.length === 0) return null

    const tocList = (
        <nav aria-label="목차">
            <ul className="mt-3 space-y-1">
                {items.map(item => (
                    <li key={item.id} className={INDENT_MAP[item.level] ?? 'pl-8'}>
                        <button
                            type="button"
                            onClick={() => handleClick(item.id)}
                            className={`w-full text-left text-sm leading-relaxed transition-colors duration-150 hover:text-sky-600 ${
                                activeId === item.id
                                    ? 'font-semibold text-sky-500'
                                    : 'public-muted-text'
                            }`}
                        >
                            {item.text}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    )

    return (
        <>
            {/* 데스크톱(xl 이상): 항상 표시 */}
            <div className="hidden xl:block">
                {tocList}
            </div>

            {/* 모바일(xl 미만): Collapsible로 접기/펼치기 */}
            <div className="xl:hidden">
                <Collapsible>
                    <CollapsibleTrigger className="public-muted-text mt-3 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition hover:bg-[color:var(--public-chip-bg)] hover:text-foreground">
                        <span className="flex items-center gap-2">
                            <List className="h-4 w-4"/>
                            목차 보기
                        </span>
                        <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180"/>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        {tocList}
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </>
    )
}
