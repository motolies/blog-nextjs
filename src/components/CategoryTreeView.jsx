import {useDispatch, useSelector} from 'react-redux'
import {useEffect, useState} from 'react'
import {getCategoryTreeAction} from '../store/actions/categoryActions'
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from './ui/collapsible'
import {Badge} from './ui/badge'
import {Folder, FolderOpen, FolderTree, ChevronRight, ChevronDown} from 'lucide-react'
import {cn} from '../lib/utils'

function CategoryTreeItem({node, onChangeCategory, expandedIds, onToggle}) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0
  const isExpanded = expandedIds.includes(node.id)

  const Icon = hasChildren
    ? (isExpanded ? FolderOpen : Folder)
    : FolderTree

  return (
    <Collapsible open={isExpanded} onOpenChange={() => hasChildren && onToggle(node.id)}>
      <CollapsibleTrigger asChild>
        <button
          className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all hover:translate-x-1 hover:bg-sky-600/8"
          onClick={() => onChangeCategory(node)}
        >
          {hasChildren
            ? (isExpanded
                ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground"/>
                : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground"/>
              )
            : <span className="w-3.5 shrink-0"/>
          }
          <Icon className="h-4 w-4 text-primary shrink-0"/>
          <span className="flex-1 truncate text-sm font-medium text-[color:var(--admin-text)]">{node.name}</span>
          {node.postCount > 0 && (
            <Badge className="text-xs h-5 px-1.5 shrink-0">{node.postCount}</Badge>
          )}
        </button>
      </CollapsibleTrigger>
      {hasChildren && (
        <CollapsibleContent>
          <div className="ml-5 border-l-2 border-border/80 pl-3">
            {node.children.map(child => (
              <CategoryTreeItem
                key={child.id}
                node={child}
                onChangeCategory={onChangeCategory}
                expandedIds={expandedIds}
                onToggle={onToggle}
              />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

export default function CategoryTreeView({onChangeCategory}) {
  const dispatch = useDispatch()
  const [expandedIds, setExpandedIds] = useState([])
  const categoryState = useSelector((state) => state.category.categoryTree)

  useEffect(() => {
    dispatch(getCategoryTreeAction())
  }, [])

  useEffect(() => {
    if (categoryState) {
      setExpandedIds(allCategoryIds(categoryState))
    }
  }, [categoryState])

  const allCategoryIds = (rootObject) => {
    let ids = []
    ids.push(rootObject.id)
    if (rootObject.children) {
      rootObject.children.forEach(child => {
        ids = ids.concat(allCategoryIds(child))
      })
    }
    return ids
  }

  const handleToggle = (id) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  if (!categoryState) return null

  return (
    <div className="h-full min-h-[24rem] overflow-y-auto rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)] p-4">
      <CategoryTreeItem
        node={categoryState}
        onChangeCategory={onChangeCategory}
        expandedIds={expandedIds}
        onToggle={handleToggle}
      />
    </div>
  )
}
