import {useDispatch, useSelector} from "react-redux"
import {useEffect, useState} from "react"
import {getCategoryFlatAction} from "../store/actions/categoryActions"
import {Popover, PopoverContent, PopoverTrigger} from "./ui/popover"
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "./ui/command"
import {Button} from "./ui/button"
import {ChevronsUpDown, Check} from "lucide-react"
import {cn} from "../lib/utils"
import {
    COMBOBOX_POPOVER_CONTENT_CLASSNAME,
    isSameEntityId,
    isUnsetComboboxValue,
} from "../lib/combobox"

export default function CategoryAutoComplete({onChangeCategory, setCategoryId, label}) {
    const categoryState = useSelector((state) => state.category.categoryFlat)
    const dispatch = useDispatch()
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (categoryState.length === 0) {
            dispatch(getCategoryFlatAction())
        }
    }, [categoryState.length, dispatch])

    useEffect(() => {
        if (isUnsetComboboxValue(setCategoryId)) {
            setSelectedCategory(null)
            return
        }

        if (categoryState.length === 0) return

        const cat = categoryState.find((category) => isSameEntityId(category.id, setCategoryId))
        setSelectedCategory(cat || null)
    }, [setCategoryId, categoryState])

    const onSelectCategory = (category) => {
        setSelectedCategory(category)
        onChangeCategory?.(category)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedCategory ? (selectedCategory.label || selectedCategory.name) : (label || 'Category')}
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
                            {categoryState.map((category) => (
                                <CommandItem
                                    key={category.id}
                                    value={category.label || category.name}
                                    onSelect={() => onSelectCategory(category)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            isSameEntityId(selectedCategory?.id, category.id) ? "opacity-100" : "opacity-0"
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
    )
}
