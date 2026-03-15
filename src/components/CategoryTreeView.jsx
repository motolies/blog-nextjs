import {useDispatch, useSelector} from 'react-redux'
import {useCallback, useEffect, useState} from 'react'
import {getCategoryTreeAction} from '../store/actions/categoryActions'
import {Folder, FolderOpen, FolderTree} from 'lucide-react'
import {Badge} from './ui/badge'
import TreeView, {getExpandedIdsToDepth} from './ui/tree-view'

function CategoryTreeView({onChangeCategory, selectedNodeId, searchQuery, collapsible = true}) {
  const dispatch = useDispatch()
  const [expandedIds, setExpandedIds] = useState([])
  const categoryState = useSelector((state) => state.category.categoryTree)

  useEffect(() => {
    dispatch(getCategoryTreeAction())
  }, [])

  useEffect(() => {
    if (categoryState) {
      setExpandedIds(getExpandedIdsToDepth([categoryState], Infinity))
    }
  }, [categoryState])

  const handleToggle = (id) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const searchFields = useCallback((node) => [node.name], [])

  const renderIcon = useCallback((node, {isExpanded}) => {
    const hasChildren = node.children?.length > 0
    const Icon = hasChildren ? (isExpanded ? FolderOpen : Folder) : FolderTree
    return <Icon className="h-4 w-4 text-primary shrink-0"/>
  }, [])

  const renderLabel = useCallback((node) => (
    <span className="flex-1 truncate text-sm font-medium text-[color:var(--admin-text)]">
      {node.name}
    </span>
  ), [])

  const renderBadge = useCallback((node) => (
    node.postCount > 0
      ? <Badge className="text-xs h-5 px-1.5 shrink-0">{node.postCount}</Badge>
      : null
  ), [])

  if (!categoryState) return null

  return (
    <TreeView
      data={[categoryState]}
      expandedIds={expandedIds}
      onToggle={handleToggle}
      onNodeClick={onChangeCategory}
      selectedNodeId={selectedNodeId}
      searchQuery={searchQuery}
      searchFields={searchQuery ? searchFields : undefined}
      collapsible={collapsible}
      renderIcon={renderIcon}
      renderLabel={renderLabel}
      renderBadge={renderBadge}
    />
  )
}

export default CategoryTreeView
