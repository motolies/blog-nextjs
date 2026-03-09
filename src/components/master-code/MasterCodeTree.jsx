import React, {useCallback, useMemo} from 'react'
import {ChevronDown, ChevronRight, FolderTree, Code, Folder, FolderOpen} from 'lucide-react'
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '../ui/collapsible'
import {Badge} from '../ui/badge'
import {cn} from '../../lib/utils'

/**
 * 마스터코드 트리 뷰
 *
 * shadcn/ui Collapsible 기반의 재귀 트리 컴포넌트.
 * CategoryTreeView.jsx 패턴을 따르되, 마스터코드의 단일 노드 구조에 맞게 단순화.
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
  // 검색어가 있을 때 매칭되는 노드 ID 집합 계산
  const matchedNodeIds = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return null

    const query = searchQuery.toLowerCase().trim()
    const matched = new Set()

    const collectMatches = (nodes) => {
      if (!nodes) return
      nodes.forEach(node => {
        const codeMatch = node.code?.toLowerCase().includes(query)
        const nameMatch = node.name?.toLowerCase().includes(query)
        if (codeMatch || nameMatch) {
          matched.add(node.id)
        }
        if (node.children) {
          collectMatches(node.children)
        }
      })
    }
    collectMatches(treeData)
    return matched
  }, [treeData, searchQuery])

  // 검색 시 매칭 노드의 조상도 보여야 하므로, 매칭 노드를 포함하는 서브트리만 필터링
  const shouldShowNode = useCallback((node) => {
    if (!matchedNodeIds) return true // 검색어 없으면 모두 표시

    // 자신이 매칭되면 표시
    if (matchedNodeIds.has(node.id)) return true

    // 하위에 매칭 노드가 있으면 표시
    const hasMatchInChildren = (children) => {
      if (!children) return false
      return children.some(child =>
        matchedNodeIds.has(child.id) || hasMatchInChildren(child.children)
      )
    }
    return hasMatchInChildren(node.children)
  }, [matchedNodeIds])

  if (!treeData || treeData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-[color:var(--admin-text-faint)]">데이터가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-2">
      {treeData.filter(shouldShowNode).map(node => (
        <TreeNode
          key={node.id}
          node={node}
          selectedNodeId={selectedNodeId}
          onNodeSelect={onNodeSelect}
          expandedIds={expandedIds}
          onToggle={onToggle}
          shouldShowNode={shouldShowNode}
          matchedNodeIds={matchedNodeIds}
          depth={0}
        />
      ))}
    </div>
  )
}

function TreeNode({
  node,
  selectedNodeId,
  onNodeSelect,
  expandedIds,
  onToggle,
  shouldShowNode,
  matchedNodeIds,
  depth,
}) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0
  const isExpanded = expandedIds.includes(node.id)
  const isSelected = selectedNodeId === node.id
  const isRoot = depth === 0
  const isMatched = matchedNodeIds?.has(node.id)

  const Icon = isRoot
    ? (isExpanded ? FolderOpen : Folder)
    : (hasChildren ? FolderTree : Code)

  const visibleChildren = hasChildren
    ? node.children.filter(shouldShowNode)
    : []

  return (
    <Collapsible open={isExpanded} onOpenChange={() => hasChildren && onToggle(node.id)}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all hover:translate-x-0.5 hover:bg-sky-600/8',
            isSelected && 'bg-sky-600/12 ring-1 ring-sky-500/30',
            isMatched && 'bg-yellow-500/8',
          )}
          onClick={(e) => {
            e.stopPropagation()
            onNodeSelect(node)
          }}
        >
          {/* 펼침/접힘 화살표 */}
          {hasChildren ? (
            <span
              className="shrink-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onToggle(node.id)
              }}
            >
              {isExpanded
                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground"/>
                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground"/>
              }
            </span>
          ) : (
            <span className="w-3.5 shrink-0"/>
          )}

          {/* 아이콘 */}
          <Icon className={cn(
            'h-4 w-4 shrink-0',
            isRoot ? 'text-sky-600' : 'text-fuchsia-600'
          )}/>

          {/* 코드 + 이름 */}
          <span className="flex-1 truncate text-sm">
            <span className={cn('font-medium', isSelected ? 'text-sky-700' : 'text-[color:var(--admin-text)]')}>
              {node.code}
            </span>
            <span className="ml-1.5 text-[color:var(--admin-text-faint)]">
              ({node.name})
            </span>
          </span>

          {/* 활성/비활성 뱃지 */}
          {!node.isActive && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
              비활성
            </Badge>
          )}

          {/* 자식 수 표시 (루트 노드) */}
          {isRoot && hasChildren && (
            <Badge className="text-xs h-5 px-1.5 shrink-0">{node.children.length}</Badge>
          )}
        </button>
      </CollapsibleTrigger>

      {hasChildren && visibleChildren.length > 0 && (
        <CollapsibleContent>
          <div className="ml-5 border-l-2 border-border/80 pl-3">
            {visibleChildren.map(child => (
              <TreeNode
                key={child.id}
                node={child}
                selectedNodeId={selectedNodeId}
                onNodeSelect={onNodeSelect}
                expandedIds={expandedIds}
                onToggle={onToggle}
                shouldShowNode={shouldShowNode}
                matchedNodeIds={matchedNodeIds}
                depth={depth + 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
