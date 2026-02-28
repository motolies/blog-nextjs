import {useEffect, useState} from "react"
import {toast} from 'sonner'
import {ConditionComponent} from "../ConditionComponent"
import {getTsid} from 'tsid-ts'
import SearchCategory from "./SearchCategory"
import SearchTag from "./SearchTag"
import {searchObjectInit} from "../../model/searchObject"
import {base64Encode} from "../../util/base64Util"
import {useRouter} from "next/router"
import {Button} from "../ui/button"
import {Input} from "../ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../ui/select"
import {Search} from "lucide-react"

const searchTypes = [
    {name: "제목", value: "TITLE"},
    {name: "내용", value: "CONTENT"},
    {name: "제목+내용", value: "FULL"},
]
const searchLogic = [
    {name: "AND", value: "AND"},
    {name: "OR", value: "OR"}
]

const controlClassName = "h-11 w-full rounded-[1.15rem] border-slate-200 bg-white/95 px-4 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)]"
const fieldLabelClassName = "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400"
const sectionClassName = "rounded-[1.35rem] border border-slate-200/80 bg-white/72 p-3.5"

export default function SearchFilter({onSearch, defaultLogic, defaultKeyword, defaultSearchType, defaultCategories, defaultTags, pageSize = searchObjectInit.pageSize}) {
    const router = useRouter()

    const [logic, setLogic] = useState('')
    const [keywords, setKeywords] = useState([])
    const [searchType, setSearchType] = useState('')
    const [categories, setCategories] = useState([])
    const [tags, setTags] = useState([])

    useEffect(() => {
        if (defaultLogic !== undefined) setLogic(defaultLogic)
        if (defaultKeyword !== undefined) setKeywords(defaultKeyword)
        if (defaultSearchType !== undefined) setSearchType(defaultSearchType)
        if (defaultCategories !== undefined) setCategories(defaultCategories)
        if (defaultTags !== undefined) setTags(defaultTags)
    }, [defaultLogic, defaultKeyword, defaultSearchType, defaultCategories, defaultTags])

    const [keyword, setKeyword] = useState('')

    const onDeleteKeyword = (deleteKeywordId) => {
        setKeywords(keywords.filter(k => k.id !== deleteKeywordId))
    }
    const addKeyword = () => {
        if (keyword.length < 2) {
            toast.error('검색어는 2글자 이상이어야 합니다.')
            setKeyword('')
            return
        }
        setKeywords([...keywords, {id: getTsid().toString(), name: keyword.trim()}])
        setKeyword('')
    }

    const onChangeAddCategory = (category) => {
        setCategories([...categories, {id: category.id, name: category.name}])
    }
    const onChangeDeleteCategory = (deleteCategoryId) => {
        setCategories(categories.filter(cat => cat.id !== deleteCategoryId))
    }

    const onChangeAddTag = (tag) => {
        setTags([...tags, tag])
    }
    const onChangeDeleteTag = (deleteTagId) => {
        setTags(tags.filter(tag => tag.id !== deleteTagId))
    }

    const onSearching = () => {
        const condition = {
            ...searchObjectInit,
            ...{
                page: 0,
                pageSize,
                searchType: searchType,
                searchCondition: {
                    keywords: [...keywords],
                    logic: logic
                },
                categories: [...categories],
                tags: [...tags],
            }
        }
        router.push({pathname: '/search', query: {q: base64Encode(JSON.stringify(condition))}})
    }

    return (
        <div className="surface-panel-strong rounded-[1.75rem] p-5">
            <div className="mb-5">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Filter Stack
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                <div className={sectionClassName}>
                    <p className={fieldLabelClassName}>Search Scope</p>
                    <div className="mt-2">
                        <Select value={searchType} onValueChange={setSearchType}>
                            <SelectTrigger className={controlClassName}>
                                <SelectValue placeholder="검색 범위"/>
                            </SelectTrigger>
                            <SelectContent>
                                {searchTypes.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className={sectionClassName}>
                    <div className="grid gap-3">
                        <div>
                            <p className={fieldLabelClassName}>Keyword Logic</p>
                            <div className="mt-2">
                                <Select value={logic} onValueChange={setLogic}>
                                    <SelectTrigger className={controlClassName}>
                                        <SelectValue placeholder="AND | OR"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {searchLogic.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <p className={fieldLabelClassName}>Keyword Input</p>
                            <div className="mt-2">
                                <Input
                                    placeholder="검색어를 추가하세요"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    type="search"
                                    className={controlClassName}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') addKeyword()
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {keywords.length > 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 p-3.5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Keywords
                        </p>
                        <div className="flex min-h-11 flex-wrap gap-2">
                        {keywords.map((kw) =>
                            <ConditionComponent key={kw.id} id={kw.id} name={kw.name} onDelete={onDeleteKeyword}/>
                        )}
                        </div>
                    </div>
                ) : null}

                <SearchCategory defaultCategory={categories} onChangeAddCategory={onChangeAddCategory} onChangeDeleteCategory={onChangeDeleteCategory}/>

                <SearchTag defaultTag={tags} onChangeAddTag={onChangeAddTag} onChangeDeleteTag={onChangeDeleteTag}/>

                <Button className="h-11 w-full rounded-[1.15rem] bg-sky-600 text-white shadow-[0_18px_36px_rgba(14,116,228,0.2)] hover:bg-sky-700" onClick={onSearching}>
                    <Search className="h-4 w-4"/>
                    Search
                </Button>
            </div>
        </div>
    )
}
