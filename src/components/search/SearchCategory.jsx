import {useDispatch, useSelector} from "react-redux"
import {useEffect, useState} from "react"
import {ConditionComponent} from "../ConditionComponent"
import {toast} from 'sonner'
import {getCategoryFlatAction} from "../../store/actions/categoryActions"
import {Popover, PopoverContent, PopoverTrigger} from "../ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "../ui/command"
import {Button} from "../ui/button"
import {ChevronsUpDown, Check} from "lucide-react"
import {cn} from "../../lib/utils"
import {COMBOBOX_POPOVER_CONTENT_CLASSNAME, isSameEntityId} from "../../lib/combobox"

export default function SearchCategory({onChangeAddCategory, onChangeDeleteCategory, defaultCategory}) {
    const dispatch = useDispatch()
    const categoryState = useSelector((state) => state.category.categoryFlat)

    const [categories, setCategories] = useState([])
    const [selectCategories, setSelectCategories] = useState([])
    const [open, setOpen] = useState(false)

    useEffect(() => {
        dispatch(getCategoryFlatAction())
    }, [dispatch])

    useEffect(() => {
        setCategories(categoryState)
    }, [categoryState])

    useEffect(() => {
        if (defaultCategory !== undefined) {
            setSelectCategories(defaultCategory)
        }
    }, [defaultCategory])

    const onDeleteTag = (deleteCategoryId) => {
        onChangeDeleteCategory(deleteCategoryId)
    }

    const onSelectCategory = (category) => {
        if (selectCategories.some((selectedCategory) => isSameEntityId(selectedCategory.id, category.id))) {
            toast.warning('동일 카테고리는 한 번만 추가할 수 있습니다.')
            setOpen(false)
            return
        }
        onChangeAddCategory(category)
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
                        카테고리(하위포함, OR 조건)
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className={COMBOBOX_POPOVER_CONTENT_CLASSNAME}>
                    <Command filter={(value, search) => {
                        if (value.toLowerCase().includes(search.toLowerCase())) return 1
                        return 0
                    }}>
                        <CommandInput placeholder="카테고리 검색..."/>
                        <CommandList>
                            <CommandEmpty>카테고리를 찾을 수 없습니다.</CommandEmpty>
                            <CommandGroup>
                                {categories.map((category) => (
                                    <CommandItem
                                        key={category.id}
                                        value={category.label || category.name}
                                        onSelect={() => onSelectCategory(category)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectCategories.some((selectedCategory) => isSameEntityId(selectedCategory.id, category.id)) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {category.label || category.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {selectCategories.length > 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 p-3.5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Categories
                    </p>
                    <div className="flex min-h-11 flex-wrap gap-2">
                    {selectCategories.map((t) =>
                        <ConditionComponent key={t.id} id={t.id} name={t.name} onDelete={onDeleteTag}/>
                    )}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
