import React, {useCallback, useMemo} from 'react'
import {ChevronDown, ChevronRight, Minus} from 'lucide-react'
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from './collapsible'
import {Checkbox} from './checkbox'
import {cn} from '@/lib/utils'

/**
 * 트리 데이터에서 지정 depth까지의 노드 ID 목록을 반환하는 헬퍼.
 * 사용처에서 expandedIds 초기값 세팅 시 활용.
 *
 * @param {Array} data - 트리 데이터 배열
 * @param {number} depth - 펼칠 최대 depth (0부터 시작, 해당 depth 포함)
 * @param {Function} [getNodeId] - (node) => id
 * @param {Function} [getNodeChildren] - (node) => children
 * @returns {Array} 펼쳐야 할 노드 ID 배열
 */
export function getExpandedIdsToDepth(data, depth, getNodeId, getNodeChildren) {
  const getId = getNodeId || (node => node.id)
  const getChildren = getNodeChildren || (node => node.children)
  const ids = []

  const traverse = (nodes, currentDepth) => {
    if (!nodes || currentDepth > depth) return
    nodes.forEach(node => {
      const children = getChildren(node)
      if (children && children.length > 0) {
        ids.push(getId(node))
        traverse(children, currentDepth + 1)
      }
    })
  }
  traverse(data, 0)
  return ids
}

// 하위 모든 노드 ID 수집
function getAllDescendantIds(node, getId, getChildren) {
  const ids = []
  const traverse = (n) => {
    ids.push(getId(n))
    const children = getChildren(n)
    if (children) children.forEach(traverse)
  }
  traverse(node)
  return ids
}

// 체크 상태 계산 (checked / unchecked / indeterminate)
function computeCheckState(node, checkedSet, getId, getChildren) {
  const children = getChildren(node)
  if (!children || children.length === 0) {
    return checkedSet.has(getId(node)) ? 'checked' : 'unchecked'
  }
  const states = children.map(c => computeCheckState(c, checkedSet, getId, getChildren))
  if (states.every(s => s === 'checked')) return 'checked'
  if (states.some(s => s === 'checked' || s === 'indeterminate')) return 'indeterminate'
  return 'unchecked'
}

// 전체 트리의 체크 상태를 Map으로 미리 계산
function buildCheckStateMap(data, checkedSet, getId, getChildren) {
  const map = new Map()
  const traverse = (nodes) => {
    if (!nodes) return
    nodes.forEach(node => {
      traverse(getChildren(node))
      map.set(getId(node), computeCheckState(node, checkedSet, getId, getChildren))
    })
  }
  traverse(data)
  return map
}

/**
 * 공통 TreeView 컴포넌트
 *
 * @param {Object} props
 * @param {Array} props.data - 트리 데이터 배열 [{id, children?, ...}]
 * @param {Function} props.renderLabel - (node, ctx) => ReactNode (필수)
 * @param {Array} [props.expandedIds] - 펼쳐진 노드 ID 배열
 * @param {Function} [props.onToggle] - (nodeId) => void
 * @param {Function} [props.renderIcon] - (node, ctx) => ReactNode
 * @param {Function} [props.renderBadge] - (node, ctx) => ReactNode
 * @param {Function} [props.nodeClassName] - (node, ctx) => string
 * @param {*} [props.selectedNodeId] - 선택된 노드 ID
 * @param {Function} [props.onNodeClick] - (node) => void
 * @param {string} [props.searchQuery] - 검색어
 * @param {Function} [props.searchFields] - (node) => string[], 검색 대상 필드
 * @param {boolean} [props.collapsible=true] - false면 항상 펼침 (접기 불가)
 * @param {boolean} [props.checkable=false] - 체크박스 표시 여부
 * @param {Array} [props.checkedIds] - 체크된 노드 ID 배열
 * @param {Function} [props.onCheckedChange] - (ids) => void
 * @param {string} [props.className] - 루트 컨테이너 className
 * @param {string} [props.emptyMessage] - 빈 데이터 메시지
 * @param {Function} [props.getNodeId] - (node) => id (기본: node.id)
 * @param {Function} [props.getNodeChildren] - (node) => children (기본: node.children)
 */
export default function TreeView({
  data,
  renderLabel,
  expandedIds = [],
  onToggle,
  renderIcon,
  renderBadge,
  nodeClassName,
  selectedNodeId,
  onNodeClick,
  searchQuery,
  searchFields,
  collapsible = true,
  checkable = false,
  checkedIds = [],
  onCheckedChange,
  className,
  emptyMessage,
  getNodeId: getNodeIdProp,
  getNodeChildren: getNodeChildrenProp,
}) {
  const getId = getNodeIdProp || (node => node.id)
  const getChildren = getNodeChildrenProp || (node => node.children)

  // 검색 매칭 노드 계산
  const matchedNodeIds = useMemo(() => {
    if (!searchQuery || !searchQuery.trim() || !searchFields) return null

    const query = searchQuery.toLowerCase().trim()
    const matched = new Set()

    const collectMatches = (nodes) => {
      if (!nodes) return
      nodes.forEach(node => {
        const fields = searchFields(node) || []
        const isMatch = fields.some(f => f?.toLowerCase().includes(query))
        if (isMatch) matched.add(getId(node))
        collectMatches(getChildren(node))
      })
    }
    collectMatches(data)
    return matched
  }, [data, searchQuery, searchFields, getId, getChildren])

  // 검색 시 노드 표시 여부
  const shouldShowNode = useCallback((node) => {
    if (!matchedNodeIds) return true
    if (matchedNodeIds.has(getId(node))) return true

    const hasMatchInChildren = (children) => {
      if (!children) return false
      return children.some(child =>
        matchedNodeIds.has(getId(child)) || hasMatchInChildren(getChildren(child))
      )
    }
    return hasMatchInChildren(getChildren(node))
  }, [matchedNodeIds, getId, getChildren])

  // 체크 상태 맵
  const checkStateMap = useMemo(() => {
    if (!checkable) return null
    const checkedSet = new Set(checkedIds)
    return buildCheckStateMap(data, checkedSet, getId, getChildren)
  }, [checkable, checkedIds, data, getId, getChildren])

  // 체크박스 토글 핸들러
  const handleCheckToggle = useCallback((node) => {
    if (!onCheckedChange) return
    const allIds = getAllDescendantIds(node, getId, getChildren)
    const currentState = checkStateMap?.get(getId(node))
    const checkedSet = new Set(checkedIds)

    if (currentState === 'checked') {
      allIds.forEach(id => checkedSet.delete(id))
    } else {
      allIds.forEach(id => checkedSet.add(id))
    }
    onCheckedChange([...checkedSet])
  }, [onCheckedChange, checkedIds, checkStateMap, getId, getChildren])

  if (!data || data.length === 0) {
    if (emptyMessage) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-sm text-[color:var(--admin-text-faint)]">{emptyMessage}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn('h-full overflow-y-auto p-2', className)}>
      {data.filter(shouldShowNode).map(node => (
        <TreeNode
          key={getId(node)}
          node={node}
          depth={0}
          getId={getId}
          getChildren={getChildren}
          renderLabel={renderLabel}
          renderIcon={renderIcon}
          renderBadge={renderBadge}
          nodeClassName={nodeClassName}
          selectedNodeId={selectedNodeId}
          onNodeClick={onNodeClick}
          expandedIds={expandedIds}
          onToggle={onToggle}
          collapsible={collapsible}
          checkable={checkable}
          checkStateMap={checkStateMap}
          onCheckToggle={handleCheckToggle}
          shouldShowNode={shouldShowNode}
          matchedNodeIds={matchedNodeIds}
        />
      ))}
    </div>
  )
}

function TreeNode({
  node,
  depth,
  getId,
  getChildren,
  renderLabel,
  renderIcon,
  renderBadge,
  nodeClassName,
  selectedNodeId,
  onNodeClick,
  expandedIds,
  onToggle,
  collapsible,
  checkable,
  checkStateMap,
  onCheckToggle,
  shouldShowNode,
  matchedNodeIds,
}) {
  const nodeId = getId(node)
  const children = getChildren(node)
  const hasChildren = Array.isArray(children) && children.length > 0
  const isExpanded = collapsible ? expandedIds.includes(nodeId) : true
  const isSelected = selectedNodeId != null && selectedNodeId === nodeId
  const isMatched = matchedNodeIds?.has(nodeId) ?? false

  const checkState = checkable ? checkStateMap?.get(nodeId) : null
  const isChecked = checkState === 'checked'
  const isIndeterminate = checkState === 'indeterminate'

  const ctx = {depth, isExpanded, isSelected, hasChildren, isChecked, isIndeterminate, isMatched}

  const visibleChildren = hasChildren
    ? children.filter(shouldShowNode)
    : []

  const extraClassName = nodeClassName?.(node, ctx)

  const nodeButton = (
    <button
      className={cn(
        'flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all hover:translate-x-0.5 hover:bg-sky-600/8',
        isSelected && 'bg-sky-600/12 ring-1 ring-sky-500/30',
        isMatched && !isSelected && 'bg-yellow-500/8',
        extraClassName,
      )}
      onClick={(e) => {
        e.stopPropagation()
        onNodeClick?.(node)
      }}
    >
      {/* 펼침/접힘 화살표 */}
      {collapsible && (
        hasChildren ? (
          <span
            className="shrink-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onToggle?.(nodeId)
            }}
          >
            {isExpanded
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground"/>
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground"/>
            }
          </span>
        ) : (
          <span className="w-3.5 shrink-0"/>
        )
      )}

      {/* 체크박스 */}
      {checkable && (
        <span
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onCheckToggle(node)
          }}
        >
          <Checkbox
            checked={isIndeterminate ? 'indeterminate' : isChecked}
            tabIndex={-1}
            className="pointer-events-none"
          />
        </span>
      )}

      {/* 아이콘 */}
      {renderIcon && renderIcon(node, ctx)}

      {/* 라벨 */}
      {renderLabel(node, ctx)}

      {/* 뱃지 */}
      {renderBadge && renderBadge(node, ctx)}
    </button>
  )

  const childrenContent = hasChildren && visibleChildren.length > 0 && (
    <div className="ml-5 border-l-2 border-border/80 pl-3">
      {visibleChildren.map(child => (
        <TreeNode
          key={getId(child)}
          node={child}
          depth={depth + 1}
          getId={getId}
          getChildren={getChildren}
          renderLabel={renderLabel}
          renderIcon={renderIcon}
          renderBadge={renderBadge}
          nodeClassName={nodeClassName}
          selectedNodeId={selectedNodeId}
          onNodeClick={onNodeClick}
          expandedIds={expandedIds}
          onToggle={onToggle}
          collapsible={collapsible}
          checkable={checkable}
          checkStateMap={checkStateMap}
          onCheckToggle={onCheckToggle}
          shouldShowNode={shouldShowNode}
          matchedNodeIds={matchedNodeIds}
        />
      ))}
    </div>
  )

  if (!collapsible) {
    return (
      <>
        {nodeButton}
        {childrenContent}
      </>
    )
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={() => hasChildren && onToggle?.(nodeId)}>
      <CollapsibleTrigger asChild>
        {nodeButton}
      </CollapsibleTrigger>
      {hasChildren && visibleChildren.length > 0 && (
        <CollapsibleContent>
          {childrenContent}
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
