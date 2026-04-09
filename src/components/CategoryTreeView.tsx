import {useCallback, useEffect, useState} from 'react'
import {useCategoryTree} from '../hooks/useCategories'
import {Folder, FolderOpen, FolderTree} from 'lucide-react'
import {Badge} from './ui/badge'
import TreeView, {getExpandedIdsToDepth} from './ui/tree-view'

interface TreeNode {
  id: string
  name: string
  postCount?: number
  children?: TreeNode[]
  [key: string]: unknown
}

interface CategoryTreeViewProps {
  onChangeCategory: (node: TreeNode) => void
  selectedNodeId?: string | null
  searchQuery?: string
  collapsible?: boolean
}

function CategoryTreeView({onChangeCategory, selectedNodeId, searchQuery, collapsible = true}: CategoryTreeViewProps) {
  const {data: categoryState} = useCategoryTree()
  const [expandedIds, setExpandedIds] = useState<(string | number)[]>([])

  useEffect(() => {
    if (categoryState) {
      setExpandedIds(getExpandedIdsToDepth([categoryState as unknown as TreeNode], Infinity))
    }
  }, [categoryState])

  const handleToggle = (id: string | number) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const searchFields = useCallback((node: TreeNode) => [node.name], [])

  const renderIcon = useCallback((node: TreeNode, {isExpanded}: {isExpanded: boolean}) => {
    const hasChildren = node.children?.length! > 0
    const Icon = hasChildren ? (isExpanded ? FolderOpen : Folder) : FolderTree
    return <Icon className="h-4 w-4 text-primary shrink-0"/>
  }, [])

  const renderLabel = useCallback((node: TreeNode) => (
    <span className="flex-1 truncate text-sm font-medium text-[color:var(--admin-text)]">
      {node.name}
    </span>
  ), [])

  const renderBadge = useCallback((node: TreeNode) => (
    node.postCount! > 0
      ? <Badge className="text-xs h-5 px-1.5 shrink-0">{node.postCount}</Badge>
      : null
  ), [])

  if (!categoryState) return null

  return (
    <TreeView
      data={[categoryState as unknown as TreeNode]}
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
