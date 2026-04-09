import React, {useCallback} from 'react'
import {FolderTree, Code, Folder, FolderOpen} from 'lucide-react'
import {Badge} from '../ui/badge'
import {cn} from '@/lib/utils'
import TreeView from '../ui/tree-view'

interface MasterCodeTreeNode {
  id: number
  code: string
  name: string
  isActive: boolean
  children?: MasterCodeTreeNode[]
  [key: string]: unknown
}

interface RenderContext {
  depth: number
  isExpanded: boolean
  isSelected: boolean
}

interface MasterCodeTreeProps {
  treeData: MasterCodeTreeNode[]
  selectedNodeId: number | null
  onNodeSelect: (node: MasterCodeTreeNode) => void
  expandedIds: (string | number)[]
  onToggle: (nodeId: string | number) => void
  searchQuery: string
}

export default function MasterCodeTree({
  treeData,
  selectedNodeId,
  onNodeSelect,
  expandedIds,
  onToggle,
  searchQuery,
}: MasterCodeTreeProps) {
  const searchFields = useCallback((node: MasterCodeTreeNode) => [node.code, node.name], [])

  const renderIcon = useCallback((node: MasterCodeTreeNode, {depth, isExpanded}: RenderContext) => {
    const isRoot = depth === 0
    const hasChildren = node.children?.length! > 0
    const Icon = isRoot
      ? (isExpanded ? FolderOpen : Folder)
      : (hasChildren ? FolderTree : Code)
    return <Icon className={cn('h-4 w-4 shrink-0', isRoot ? 'text-sky-600' : 'text-fuchsia-600')}/>
  }, [])

  const renderLabel = useCallback((node: MasterCodeTreeNode, {isSelected}: RenderContext) => (
    <span className="flex-1 truncate text-sm">
      <span className={cn('font-medium', isSelected ? 'text-sky-700' : 'text-[color:var(--admin-text)]')}>
        {node.code}
      </span>
      <span className="ml-1.5 text-[color:var(--admin-text-faint)]">
        ({node.name})
      </span>
    </span>
  ), [])

  const renderBadge = useCallback((node: MasterCodeTreeNode) => (
    !node.isActive
      ? <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">비활성</Badge>
      : null
  ), [])

  return (
    <TreeView
      data={treeData}
      expandedIds={expandedIds}
      onToggle={onToggle}
      selectedNodeId={selectedNodeId}
      onNodeClick={onNodeSelect}
      searchQuery={searchQuery}
      searchFields={searchFields}
      collapsible={false}
      emptyMessage="데이터가 없습니다."
      renderIcon={renderIcon}
      renderLabel={renderLabel}
      renderBadge={renderBadge}
    />
  )
}
