import React, {useCallback} from 'react'
import {FolderTree, Code, Folder, FolderOpen} from 'lucide-react'
import {Badge} from '../ui/badge'
import {cn} from '@/lib/utils'
import TreeView from '../ui/tree-view'

/**
 * 마스터코드 트리 뷰
 *
 * 공통 TreeView 기반의 마스터코드 전용 래퍼.
 *
 * @param {Array} treeData - 트리 데이터 배열 (children 재귀)
 * @param {number|null} selectedNodeId - 선택된 노드 ID
 * @param {Function} onNodeSelect - 노드 선택 콜백 (node) => void
 * @param {Array} expandedIds - 펼쳐진 노드 ID 배열
 * @param {Function} onToggle - 펼침/접힘 토글 (nodeId) => void
 * @param {string} searchQuery - 검색어 (필터링용)
 */
export default function MasterCodeTree({
  treeData,
  selectedNodeId,
  onNodeSelect,
  expandedIds,
  onToggle,
  searchQuery,
}) {
  const searchFields = useCallback((node) => [node.code, node.name], [])

  const renderIcon = useCallback((node, {depth, isExpanded}) => {
    const isRoot = depth === 0
    const hasChildren = node.children?.length > 0
    const Icon = isRoot
      ? (isExpanded ? FolderOpen : Folder)
      : (hasChildren ? FolderTree : Code)
    return <Icon className={cn('h-4 w-4 shrink-0', isRoot ? 'text-sky-600' : 'text-fuchsia-600')}/>
  }, [])

  const renderLabel = useCallback((node, {isSelected}) => (
    <span className="flex-1 truncate text-sm">
      <span className={cn('font-medium', isSelected ? 'text-sky-700' : 'text-[color:var(--admin-text)]')}>
        {node.code}
      </span>
      <span className="ml-1.5 text-[color:var(--admin-text-faint)]">
        ({node.name})
      </span>
    </span>
  ), [])

  const renderBadge = useCallback((node) => (
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
