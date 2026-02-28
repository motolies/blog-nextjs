import {useEffect, useState} from "react"
import {useDispatch, useSelector} from "react-redux"
import {Tag} from "./TagComponent"
import {getAllTags} from "../../store/actions/tagActions"
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


export default function TagGroupComponent({postId, tagList, clickable, listHeight, writePage = false}) {
    const dispatch = useDispatch()

    const userState = useSelector((state) => state.user)
    const tagState = useSelector(state => state.tag.tags)
    const [reduxTags, setReduxTags] = useState([])
    const [postTags, setPostTags] = useState(Array.isArray(tagList) ? tagList : [])
    const [newTag, setNewTag] = useState('')
    const [isAddTag, setIsAddTag] = useState(true)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        dispatch(getAllTags())
    }, [dispatch])

    useEffect(() => {
        if (tagList === undefined) return

        const nextPostTags = Array.isArray(tagList) ? tagList : []
        setPostTags(nextPostTags)
        const filteredArray = tagState.filter((tag) =>
            !nextPostTags.some((postTag) => isSameEntityId(postTag.id, tag.id))
        )
        setReduxTags(filteredArray)
    }, [tagList, tagState])

    const onSelectTag = (tag) => {
        const currentPostTags = postTags ?? []

        if (currentPostTags.some((postTag) => isSameEntityId(postTag.id, tag.id))) {
            toast.warning('동일 태그는 한 번만 추가할 수 있습니다.')
            setOpen(false)
            return
        }
        addTagOnPost(tag.name)
        setOpen(false)
    }

    const addTagOnPost = (tagName) => {
        if (!isAddTag) return
        setIsAddTag(false)
        service.post.addTag({postId: postId, tagName: tagName})
            .then(res => {
                if (res.status >= 200 && res.status < 300) {
                    const createdTag = res.data
                    const currentPostTags = postTags ?? []
                    const nextPostTags = currentPostTags.some((tag) => isSameEntityId(tag.id, createdTag.id))
                        ? currentPostTags
                        : [...currentPostTags, createdTag]
                    const nextReduxTags = reduxTags.filter((tag) => !isSameEntityId(tag.id, createdTag.id))

                    setPostTags(nextPostTags)
                    setReduxTags(nextReduxTags)
                    toast.success(`태그가 추가되었습니다.`)
                }
            })
            .finally(() => {
                setIsAddTag(true)
            })
    }

    const handleAddNewTag = (inputValue) => {
        if (inputValue.trim().length > 1) {
            addTagOnPost(inputValue.trim())
            setOpen(false)
        } else {
            toast.error(`태그는 두 글자 이상이어야 합니다.`)
        }
    }

    const deletePostTag = ({tagId}) => {
        const currentPostTags = postTags ?? []
        const oldTags = currentPostTags.filter((tag) => isSameEntityId(tag.id, tagId))
        service.post.deleteTag({postId: postId, tagId: tagId})
            .then(res => {
                if (res.status >= 200 && res.status < 300) {
                    const nextPostTags = currentPostTags.filter((tag) => !isSameEntityId(tag.id, tagId))
                    const nextReduxTags = [...reduxTags]

                    oldTags.forEach((oldTag) => {
                        if (!nextReduxTags.some((reduxTag) => isSameEntityId(reduxTag.id, oldTag.id))) {
                            nextReduxTags.push(oldTag)
                        }
                    })

                    setPostTags(nextPostTags)
                    toast.success("태그 삭제에 성공하였습니다.")
                    setReduxTags(nextReduxTags)
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
                    onOpenChange={(isOpen) => {
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
                                ? 'h-11 w-full justify-between rounded-full border-slate-300/80 bg-white/90 text-[color:var(--admin-text)] hover:bg-sky-600/8'
                                : 'h-11 w-full justify-between rounded-full border-slate-200 bg-white/90'}
                        >
                            Add Tags
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className={COMBOBOX_POPOVER_CONTENT_CLASSNAME}>
                        <Command filter={(value, search) => {
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
                                    {reduxTags.map((tag) => (
                                        <CommandItem
                                            key={tag.id}
                                            value={tag.name}
                                            onSelect={() => onSelectTag(tag)}
                                        >
                                            {tag.name}
                                        </CommandItem>
                                    ))}
                                    {newTag.trim().length > 1 && !reduxTags.some(t =>
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
