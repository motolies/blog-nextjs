import {useEffect, useRef, useState} from 'react'
import {getTsid} from 'tsid-ts'
import {Popover, PopoverContent, PopoverTrigger} from '../ui/popover'
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from '../ui/command'
import {Button} from '../ui/button'
import {ChevronsUpDown, Loader2, Plus, Search} from 'lucide-react'
import {COMBOBOX_POPOVER_CONTENT_CLASSNAME} from '../../lib/combobox'
import service from '../../service'

interface PostSearchResult {
  id: number
  subject: string
}

interface PostSearchComboboxProps {
  excludePostIds: number[]
  onSelect: (post: {postId: number; subject: string}) => void
}

export default function PostSearchCombobox({excludePostIds, onSelect}: PostSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<PostSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!searchQuery.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await service.post.search({
          searchAllParam: {
            searchType: 'TITLE',
            searchCondition: {
              keywords: [{id: getTsid().toString(), name: searchQuery.trim()}],
              logic: 'AND',
            },
            categories: [],
            tags: [],
            page: 0,
            pageSize: 20,
          },
        })
        const posts: PostSearchResult[] = (res.data?.list ?? []).map((p: any) => ({
          id: Number(p.id),
          subject: p.subject,
        }))
        setResults(posts.filter(p => !excludePostIds.includes(p.id)))
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [searchQuery, excludePostIds])

  const handleSelect = (post: PostSearchResult) => {
    onSelect({postId: post.id, subject: post.subject})
    setSearchQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-[color:var(--admin-text-muted)]"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4"/>
            포스트 검색하여 추가...
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={COMBOBOX_POPOVER_CONTENT_CLASSNAME}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="포스트 제목으로 검색..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-[color:var(--admin-text-faint)]"/>
              </div>
            )}
            {!loading && searchQuery.trim() && results.length === 0 && (
              <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            )}
            {!loading && results.length > 0 && (
              <CommandGroup>
                {results.map(post => (
                  <CommandItem
                    key={post.id}
                    value={String(post.id)}
                    onSelect={() => handleSelect(post)}
                  >
                    <Plus className="mr-2 h-4 w-4 text-[color:var(--admin-text-faint)]"/>
                    <span className="truncate">{post.subject}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
