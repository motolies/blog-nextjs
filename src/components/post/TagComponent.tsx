import {useState} from "react"
import {useAuthStore} from "../../store/useAuthStore"
import {useShallow} from 'zustand/react/shallow'
import {Trash2} from "lucide-react"
import {Button} from "../ui/button"
import DeleteConfirm from "../confirm/DeleteConfirm"
import {searchObjectInit} from "../../model/searchObject"
import {base64Encode} from "../../util/base64Util"
import {useRouter} from "next/router"

interface TagProps {
    id: string
    name: string
    deletePostTag: (params: {tagId: string}) => void
    clickable?: boolean
    variant?: 'admin' | 'default'
}

export const Tag = (props: TagProps) => {
    const router = useRouter()
    const userState = useAuthStore(useShallow(s => ({isAuthenticated: s.isAuthenticated, user: s.user})))
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
    const [question, setQuestion] = useState<string>('')
    const isAdminVariant = props.variant === 'admin'

    const showDeleteConfirmDialog = (e: React.MouseEvent) => {
        e.stopPropagation()
        setQuestion(`이 포스트에서 ${props.name} 태그를 삭제하시겠습니까?`)
        setShowDeleteConfirm(true)
    }

    const deleteTag = async () => {
        await props.deletePostTag({tagId: props.id})
        setShowDeleteConfirm(false)
    }
    const deleteTagCancel = () => {
        setShowDeleteConfirm(false)
    }

    const searchTagName = (e: React.MouseEvent | React.KeyboardEvent) => {
        if (e.currentTarget === e.target) {
            const condition = {
                ...searchObjectInit,
                ...{
                    tags: [{id: props.id, name: props.name}],
                }
            }
            router.push({pathname: '/search', query: {q: base64Encode(JSON.stringify(condition))}})
        }
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (props.clickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            searchTagName(e)
        }
    }

    return (
        <div
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isAdminVariant
                    ? 'border border-slate-300/80 bg-white/92 text-[color:var(--admin-text)] hover:border-sky-600/18 hover:bg-sky-600/8 hover:text-sky-700'
                    : 'public-chip-surface public-muted-text border hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/40 dark:hover:text-blue-300'
            }${props.clickable ? ' cursor-pointer' : ''}`}
            onClick={props.clickable ? searchTagName : undefined}
            {...(props.clickable ? {role: 'button', tabIndex: 0, onKeyDown} : {})}
        >
            {props.name}
            {!(userState.isAuthenticated && userState.user.username) ? null :
                <Button
                    variant="ghost"
                    size="icon"
                    className={`ml-1 h-6 w-6 rounded-full ${
                        isAdminVariant
                            ? 'text-[color:var(--admin-text-faint)] hover:bg-sky-600/8 hover:text-sky-700'
                            : 'public-label-text hover:bg-[color:var(--public-chip-bg)] hover:text-foreground'
                    }`}
                    aria-label="delete"
                    onClick={showDeleteConfirmDialog}
                >
                    <Trash2 className="h-3 w-3"/>
                </Button>
            }
            <DeleteConfirm open={showDeleteConfirm} question={question} onConfirm={deleteTag} onCancel={deleteTagCancel}/>
        </div>
    )

}
