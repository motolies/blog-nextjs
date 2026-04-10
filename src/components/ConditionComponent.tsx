import {Button} from "@/components/ui/button"
import {Trash2} from "lucide-react"

interface ConditionComponentProps {
    id: string | number
    name: string
    onDelete: (id: string | number) => void
}

export const ConditionComponent = ({id, name, onDelete}: ConditionComponentProps) => {

    const deleteCondition = (e: React.MouseEvent) => {
        e.stopPropagation()
        onDelete(id)
    }

    return (
        <div
            className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-sm font-medium text-sky-900 transition hover:border-sky-200 hover:bg-sky-100/80 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300 dark:hover:border-sky-700 dark:hover:bg-sky-900/50"
        >
            {name}
            <Button
                variant="ghost"
                size="icon-xs"
                aria-label="delete"
                className="rounded-full text-sky-700 hover:bg-sky-200/70 hover:text-sky-900 dark:text-sky-400 dark:hover:bg-sky-800/50 dark:hover:text-sky-200"
                onClick={deleteCondition}
            >
                <Trash2 size={14}/>
            </Button>
        </div>
    )
}
