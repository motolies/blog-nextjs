import {useEffect, useState} from "react"
import {useTags} from "../../hooks/useTags"
import {ConditionComponent} from "../ConditionComponent"
import {toast} from 'sonner'
import {Popover, PopoverContent, PopoverTrigger} from "../ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "../ui/command"
import {Button} from "../ui/button"
import {ChevronsUpDown, Check} from "lucide-react"
import {cn} from "../../lib/utils"
import {COMBOBOX_POPOVER_CONTENT_CLASSNAME, isSameEntityId} from "../../lib/combobox"
import type {Tag} from '@/types/tag'

interface SearchTagProps {
    onChangeAddTag: (tag: Tag) => void
    onChangeDeleteTag: (deleteTagId: string) => void
    defaultTag?: Tag[]
}

export default function SearchTag({onChangeAddTag, onChangeDeleteTag, defaultTag}: SearchTagProps) {
    const {data: tagData} = useTags()
    const tags = tagData ?? []

    const [selectTags, setSelectTags] = useState<Tag[]>([])
    const [open, setOpen] = useState<boolean>(false)

    useEffect(() => {
        if (defaultTag !== undefined) {
            setSelectTags(defaultTag)
        }
    }, [defaultTag])

    const onDeleteTag = (deleteTagId: string) => {
        onChangeDeleteTag(deleteTagId)
    }

    const onSelectTag = (tag: Tag) => {
        if (selectTags.some((selectedTag) => isSameEntityId(selectedTag.id, tag.id))) {
            toast.warning('동일 태그는 한 번만 추가할 수 있습니다.')
            setOpen(false)
            return
        }
        onChangeAddTag(tag)
        setOpen(false)
    }

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="public-control-surface public-muted-text h-11 w-full justify-between rounded-[1.15rem] border px-4"
                    >
                        태그 선택(태그끼리 AND 조건)
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className={COMBOBOX_POPOVER_CONTENT_CLASSNAME}>
                    <Command filter={(value: string, search: string) => {
                        if (value.toLowerCase().includes(search.toLowerCase())) return 1
                        return 0
                    }}>
                        <CommandInput placeholder="태그 검색..."/>
                        <CommandList>
                            <CommandEmpty>태그를 찾을 수 없습니다.</CommandEmpty>
                            <CommandGroup>
                                {tags.map((tag) => (
                                    <CommandItem
                                        key={tag.id}
                                        value={tag.name}
                                        onSelect={() => onSelectTag(tag)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectTags.some((selectedTag) => isSameEntityId(selectedTag.id, tag.id)) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {tag.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {selectTags.length > 0 ? (
                <div className="public-muted-panel rounded-[1.5rem] border border-dashed p-3.5">
                    <p className="public-label-text mb-2 text-xs font-semibold uppercase tracking-[0.18em]">
                        Tags
                    </p>
                    <div className="flex min-h-11 flex-wrap gap-2">
                    {selectTags.map((t) =>
                        <ConditionComponent key={t.id} id={t.id} name={t.name} onDelete={onDeleteTag}/>
                    )}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
