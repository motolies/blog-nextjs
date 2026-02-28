import {useDispatch, useSelector} from "react-redux"
import {useEffect, useState} from "react"
import {getAllTags} from "../../store/actions/tagActions"
import {ConditionComponent} from "../ConditionComponent"
import {toast} from 'sonner'
import {Popover, PopoverContent, PopoverTrigger} from "../ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "../ui/command"
import {Button} from "../ui/button"
import {ChevronsUpDown, Check} from "lucide-react"
import {cn} from "../../lib/utils"
import {COMBOBOX_POPOVER_CONTENT_CLASSNAME, isSameEntityId} from "../../lib/combobox"

export default function SearchTag({onChangeAddTag, onChangeDeleteTag, defaultTag}) {
    const dispatch = useDispatch()
    const tagState = useSelector(state => state.tag.tags)

    const [tags, setTags] = useState([])
    const [selectTags, setSelectTags] = useState([])
    const [open, setOpen] = useState(false)

    useEffect(() => {
        dispatch(getAllTags())
    }, [dispatch])

    useEffect(() => {
        setTags(tagState)
    }, [tagState])

    useEffect(() => {
        if (defaultTag !== undefined) {
            setSelectTags(defaultTag)
        }
    }, [defaultTag])

    const onDeleteTag = (deleteTagId) => {
        onChangeDeleteTag(deleteTagId)
    }

    const onSelectTag = (tag) => {
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
                        className="h-11 w-full justify-between rounded-[1.15rem] border-slate-200 bg-white/95 px-4 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)] hover:bg-slate-50"
                    >
                        태그 선택(태그끼리 AND 조건)
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className={COMBOBOX_POPOVER_CONTENT_CLASSNAME}>
                    <Command filter={(value, search) => {
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
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 p-3.5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
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
