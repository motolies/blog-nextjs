import Link from "next/link"
import {useRouter} from "next/router"
import {useAuthStore} from '../../../store/useAuthStore'
import {useShallow} from 'zustand/react/shallow'
import {Shield, LogIn, FilePlus, Search, Sparkles, Sun, Moon} from 'lucide-react'
import {useEffect, useState} from "react"
import {useTheme} from 'next-themes'
import MemoDialog from "../../memo/MemoDialog"
import {base64Encode} from "../../../util/base64Util"
import {getTsid} from 'tsid-ts'
import {searchObjectInit} from "../../../model/searchObject"
import styles from './Header.module.css'
import {Button} from '../../ui/button'
export default function Header() {
    const router = useRouter()
    const userState = useAuthStore(useShallow(s => ({isAuthenticated: s.isAuthenticated, user: s.user})))
    const [searchText, setSearchText] = useState<string>('')
    const [memoDialogOpen, setMemoDialogOpen] = useState<boolean>(false)
    const {resolvedTheme, setTheme} = useTheme()
    const [mounted, setMounted] = useState<boolean>(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!router.pathname.startsWith('/search')) {
            setSearchText('')
        }
    }, [router.pathname])

    const onSearchTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const keywords = searchText.trim()
                ? [{id: getTsid().toString(), name: searchText}]
                : []
            const condition = {
                ...searchObjectInit,
                ...{
                    searchCondition: {
                        keywords,
                        logic: 'AND'
                    }
                }
            }
            router.push({pathname: '/search', query: {q: base64Encode(JSON.stringify(condition))}})
        }
    }
    const onChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value)
    }


    return (
        <header className={styles.top}>
            <nav aria-label="주요 탐색" className={styles.back}>
                <div className="public-container flex h-[4.5rem] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 shrink-0 items-center gap-4">
                        <Link href="/" className="group inline-flex min-w-0 items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0d7ff2,#7dd3fc)] text-white shadow-[0_12px_30px_rgba(13,127,242,0.28)]">
                                <Sparkles className="h-5 w-5"/>
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-lg font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-50">
                                    motolies
                                </span>
                            </span>
                        </Link>

                    </div>

                    <div className="flex flex-1 items-center justify-end gap-2">
                        <div className="relative w-full max-w-lg">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 public-label-text sm:left-3"/>
                            <input
                                type="search"
                                placeholder="Search posts"
                                value={searchText}
                                onChange={onChangeText}
                                onKeyDown={onSearchTextKeyDown}
                                className="public-control-surface h-10 w-full rounded-full border pl-7 pr-3 text-sm placeholder:text-[color:var(--public-text-subtle)] backdrop-blur transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100/80 dark:focus:border-sky-400 dark:focus:ring-sky-900/50 sm:h-11 sm:pl-9 sm:pr-4 sm:text-sm"
                            />
                        </div>

                        {mounted && (
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={resolvedTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
                                className="public-control-surface rounded-full border text-[color:var(--public-text-muted)] hover:text-sky-700 dark:hover:text-sky-300"
                                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                            >
                                {resolvedTheme === 'dark' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
                            </Button>
                        )}

                        {!userState.user.username ? null : (
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="메모 작성"
                                className="public-control-surface rounded-full border text-[color:var(--public-text-muted)] hover:text-sky-700 dark:hover:text-sky-300"
                                onClick={() => setMemoDialogOpen(true)}
                            >
                                <FilePlus className="h-4 w-4"/>
                            </Button>
                        )}

                        {router.pathname === '/login' || userState.user.username ? null : (
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="로그인"
                                className="public-control-surface rounded-full border text-[color:var(--public-text-muted)] hover:text-sky-700 dark:hover:text-sky-300"
                                asChild
                            >
                                <Link href="/login"><LogIn className="h-4 w-4"/></Link>
                            </Button>
                        )}

                        {!userState.user.username ? null : (
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="관리자 페이지"
                                className="public-control-surface rounded-full border text-[color:var(--public-text-muted)] hover:text-sky-700 dark:hover:text-sky-300"
                                asChild
                            >
                                <Link href="/admin"><Shield className="h-4 w-4"/></Link>
                            </Button>
                        )}

                        <MemoDialog open={memoDialogOpen} onClose={() => setMemoDialogOpen(false)}/>
                    </div>
                </div>
            </nav>
        </header>
    )
}
