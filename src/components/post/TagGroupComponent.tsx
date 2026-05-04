import {useEffect, useMemo, useState} from "react"
import {useAuthStore} from "../../store/useAuthStore"
import {useShallow} from 'zustand/react/shallow'
import {Tag} from "./TagComponent"
import {useTags} from "../../hooks/useTags"
import {toast} from 'sonner'
import service from "../../service"
import {Popover, PopoverContent, PopoverTrigger} from "../ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "../ui/command"
import {Button} from "../ui/button"
import {ChevronsUpDown} from "lucide-react"
import {
    COMBOBOX_POPOVER_CONTENT_CLASSNAME,
    isSameEntityId,
} from "../../lib/combobox"
import type {Tag as TagType} from "@/types/tag"
import type React from "react"

interface TagGroupComponentProps {
    postId: string | null
    tagList: TagType[]
    clickable?: boolean
    listHeight?: React.CSSProperties
    writePage?: boolean
}

export default function TagGroupComponent({postId, tagList, clickable, listHeight, writePage = false}: TagGroupComponentProps) {
    const userState = useAuthStore(useShallow(s => ({isAuthenticated: s.isAuthenticated, user: s.user})))
    const {data: allTags} = useTags()
    const [postTags, setPostTags] = useState<TagType[]>(Array.isArray(tagList) ? tagList : [])
    const [newTag, setNewTag] = useState<string>('')
    const [isAddTag, setIsAddTag] = useState<boolean>(true)
    const [open, setOpen] = useState<boolean>(false)

    useEffect(() => {
        if (tagList === undefined) return
        setPostTags(Array.isArray(tagList) ? tagList : [])
    }, [tagList])

    const availableTags = useMemo(() => {
        const postTagIds = new Set(postTags.map(t => t.id))
        return (allTags ?? []).filter(tag => !postTagIds.has(tag.id))
    }, [allTags, postTags])

    const onSelectTag = (tag: TagType) => {
        const currentPostTags = postTags ?? []

        if (currentPostTags.some((postTag) => isSameEntityId(postTag.id, tag.id))) {
            toast.warning('동일 태그는 한 번만 추가할 수 있습니다.')
            setOpen(false)
            return
        }
        addTagOnPost(tag.name)
        setOpen(false)
    }

    const addTagOnPost = (tagName: string) => {
        if (!isAddTag) return
        setIsAddTag(false)
        service.post.addTag({postId: postId, tagName: tagName})
            .then((res: { status: number; data: TagType }) => {
                if (res.status >= 200 && res.status < 300) {
                    const createdTag = res.data
                    setPostTags(prev => prev.some(t => isSameEntityId(t.id, createdTag.id)) ? prev : [...prev, createdTag])
                    toast.success(`태그가 추가되었습니다.`)
                }
            })
            .finally(() => {
                setIsAddTag(true)
            })
    }

    const handleAddNewTag = (inputValue: string) => {
        if (inputValue.trim().length > 1) {
            addTagOnPost(inputValue.trim())
            setOpen(false)
        } else {
            toast.error(`태그는 두 글자 이상이어야 합니다.`)
        }
    }

    const deletePostTag = ({tagId}: {tagId: string}) => {
        service.post.deleteTag({postId: postId, tagId: tagId})
            .then((res: { status: number }) => {
                if (res.status >= 200 && res.status < 300) {
                    setPostTags(prev => prev.filter(tag => !isSameEntityId(tag.id, tagId)))
                    toast.success("태그 삭제에 성공하였습니다.")
                }
            }).catch(() => {
            toast.error("태그 삭제에 실패하였습니다.")
        })
    }

    return (
        <div className="space-y-2">
            {!(userState.isAuthenticated && userState.user.username) ? null :
                <Popover
                    open={open}
                    onOpenChange={(isOpen: boolean) => {
                        setOpen(isOpen)
                        if (!isOpen) {
                            setNewTag('')
                        }
                    }}
                >
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={writePage
                                ? 'h-11 w-full justify-between rounded-full border-slate-300/80 bg-white/90 text-[color:var(--admin-text)] hover:bg-sky-600/8 dark:border-[color:var(--admin-border-strong)] dark:bg-[color:var(--admin-panel)] dark:hover:bg-sky-500/15'
                                : 'public-control-surface public-muted-text h-11 w-full justify-between rounded-full border'}
                        >
                            Add Tags
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className={COMBOBOX_POPOVER_CONTENT_CLASSNAME}>
                        <Command filter={(value: string, search: string) => {
                            if (value.startsWith('__create__')) return 1
                            if (value.toLowerCase().includes(search.toLowerCase())) return 1
                            return 0
                        }}>
                            <CommandInput
                                placeholder="태그 검색 또는 새 태그 입력..."
                                onValueChange={setNewTag}
                            />
                            <CommandList>
                                <CommandEmpty>일치하는 태그가 없습니다.</CommandEmpty>
                                <CommandGroup>
                                    {availableTags.map((tag) => (
                                        <CommandItem
                                            key={tag.id}
                                            value={tag.name}
                                            onSelect={() => onSelectTag(tag)}
                                        >
                                            {tag.name}
                                        </CommandItem>
                                    ))}
                                    {newTag.trim().length > 1 && !availableTags.some(t =>
                                        t.name.toLowerCase() === newTag.trim().toLowerCase()
                                    ) && (
                                        <CommandItem
                                            value={`__create__${newTag}`}
                                            onSelect={() => handleAddNewTag(newTag)}
                                        >
                                            + &quot;{newTag.trim()}&quot; 새 태그 추가
                                        </CommandItem>
                                    )}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            }

            <div className="flex flex-wrap gap-2" style={listHeight}>
                {postTags ? postTags.map((tag) =>
                    <Tag key={tag.id} id={tag.id} name={tag.name} deletePostTag={deletePostTag} clickable={clickable} variant={writePage ? 'admin' : 'default'}/>
                ) : null}
            </div>
        </div>
    )
}
