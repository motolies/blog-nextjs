import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Plus, RefreshCw, Save, Search, X} from 'lucide-react'
import {toast} from 'sonner'
import {Button} from '../ui/button'
import {Input} from '../ui/input'
import {Skeleton} from '../ui/skeleton'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '../ui/dialog'
import AdminPageFrame from '../layout/admin/AdminPageFrame'
import service from '../../service'
import MasterCodeTree from './MasterCodeTree'
import NodeDetailPanel from './NodeDetailPanel'
import NodeForm from './NodeForm'

const INITIAL_FORM_DATA = {
  code: '',
  name: '',
  description: '',
  sort: 0,
  isActive: true,
  isRoot: false,
  parentId: null,
  attributeSchema: [],
  attributes: {},
}

export default function MasterCodePage() {
  // 데이터 상태
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(false)

  // 선택/탐색 상태
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [expandedIds, setExpandedIds] = useState([])

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('')

  // 다이얼로그 상태
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState(null) // 'addRoot' | 'addChild' | 'edit'
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [originalCode, setOriginalCode] = useState('')
  const [dialogParentNode, setDialogParentNode] = useState(null)

  // 선택된 노드 객체 찾기 (트리에서 재귀 탐색)
  const selectedNode = useMemo(() => {
    if (selectedNodeId == null) return null
    return findNodeById(treeData, selectedNodeId)
  }, [treeData, selectedNodeId])

  // 선택된 노드의 루트 조상의 attributeSchema (자식 노드 편집 시 필요)
  const rootAttributeSchema = useMemo(() => {
    if (!selectedNode) return []
    const root = findRootAncestor(treeData, selectedNodeId)
    return root?.attributeSchema || []
  }, [treeData, selectedNode, selectedNodeId])

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await service.masterCode.getTree()
      setTreeData(data || [])
      // 초기 로드 시 루트 노드 모두 펼침
      if (expandedIds.length === 0 && data?.length > 0) {
        setExpandedIds(data.map(n => n.id))
      }
    } catch (error) {
      toast.error(`데이터 로드 실패: ${error.response?.data?.message || error.message}`)
      setTreeData([])
    } finally {
      setLoading(false)
    }
  }, []) // expandedIds 의존성 제거: 초기 로드에서만 자동 펼침

  useEffect(() => {
    loadData()
  }, [loadData])

  // 트리 노드 펼침/접힘 토글
  const handleToggle = useCallback((nodeId) => {
    setExpandedIds(prev =>
      prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]
    )
  }, [])

  // 노드 선택
  const handleNodeSelect = useCallback((node) => {
    setSelectedNodeId(node.id)
  }, [])

  // 루트 노드 추가
  const handleAddRoot = useCallback(() => {
    setDialogMode('addRoot')
    setDialogParentNode(null)
    setFormData({...INITIAL_FORM_DATA, isRoot: true, attributeSchema: []})
    setOriginalCode('')
    setOpenDialog(true)
  }, [])

  // 하위 노드 추가
  const handleAddChild = useCallback((parentNode) => {
    const rootAncestor = findRootAncestor(treeData, parentNode.id)
    setDialogMode('addChild')
    setDialogParentNode(parentNode)
    setFormData({
      ...INITIAL_FORM_DATA,
      parentId: parentNode.id,
      attributes: {},
    })
    setOriginalCode('')
    setOpenDialog(true)
  }, [treeData])

  // 편집
  const handleEdit = useCallback((node) => {
    const isRoot = node.depth === 0 || node.parentId == null
    setDialogMode('edit')
    setDialogParentNode(null)
    setFormData({
      code: node.code,
      name: node.name,
      description: node.description || '',
      sort: node.sort ?? 0,
      isActive: node.isActive,
      isRoot,
      parentId: node.parentId,
      attributeSchema: isRoot ? (node.attributeSchema || []) : [],
      attributes: !isRoot ? (node.attributes || {}) : {},
    })
    setOriginalCode(node.code)
    setOpenDialog(true)
  }, [])

  // 삭제
  const handleDelete = useCallback(async (node) => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0
    if (hasChildren) {
      toast.error('하위 노드가 존재하여 삭제할 수 없습니다. 하위 노드를 먼저 삭제해주세요.')
      return
    }
    if (!confirm(`"${node.name}" (${node.code})을(를) 삭제하시겠습니까?`)) return

    try {
      setLoading(true)
      await service.masterCode.deleteNode(node.id)
      toast.success('노드가 성공적으로 삭제되었습니다.')
      if (selectedNodeId === node.id) {
        setSelectedNodeId(null)
      }
      await loadData()
    } catch (error) {
      toast.error(`삭제 실패: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }, [loadData, selectedNodeId])

  // 저장
  const handleSave = async () => {
    if (!formData.code?.trim()) {
      toast.error('코드는 필수 입력입니다.')
      return
    }
    if (!formData.name?.trim()) {
      toast.error('이름은 필수 입력입니다.')
      return
    }

    try {
      setLoading(true)

      if (dialogMode === 'addRoot') {
        const payload = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          sort: formData.sort,
          isActive: formData.isActive,
          parentId: null,
          attributeSchema: formData.attributeSchema,
        }
        await service.masterCode.createNode(payload)
        toast.success('루트 노드가 성공적으로 생성되었습니다.')
      } else if (dialogMode === 'addChild') {
        const payload = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          sort: formData.sort,
          isActive: formData.isActive,
          parentId: formData.parentId,
          attributes: formData.attributes,
        }
        await service.masterCode.createNode(payload)
        toast.success('하위 노드가 성공적으로 생성되었습니다.')
        // 부모 노드 펼침
        if (formData.parentId && !expandedIds.includes(formData.parentId)) {
          setExpandedIds(prev => [...prev, formData.parentId])
        }
      } else if (dialogMode === 'edit') {
        const isRoot = formData.isRoot
        const payload = {
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          sort: formData.sort,
          isActive: formData.isActive,
          ...(isRoot
            ? {attributeSchema: formData.attributeSchema}
            : {attributes: formData.attributes}
          ),
        }
        await service.masterCode.updateNode(selectedNode.id, payload)
        toast.success('노드가 성공적으로 수정되었습니다.')
      }

      setOpenDialog(false)
      await loadData()
    } catch (error) {
      toast.error(`저장 실패: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 캐시 삭제
  const handleClearAllCache = async () => {
    if (!confirm('전체 캐시를 삭제하시겠습니까?\n\n모든 캐시가 삭제되며 시스템 성능에 일시적인 영향을 줄 수 있습니다.')) {
      return
    }
    try {
      setLoading(true)
      const result = await service.masterCode.evictAllCaches()
      toast.success(`${result.message} (${result.evictedCacheCount}개 캐시 삭제됨)`)
    } catch (error) {
      toast.error(`캐시 삭제 실패: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 편집 다이얼로그에서 자식 노드의 루트 schema 결정
  const formRootAttributeSchema = useMemo(() => {
    if (dialogMode === 'addChild' && dialogParentNode) {
      const root = findRootAncestor(treeData, dialogParentNode.id)
      return root?.attributeSchema || []
    }
    if (dialogMode === 'edit' && selectedNode && !formData.isRoot) {
      const root = findRootAncestor(treeData, selectedNode.id)
      return root?.attributeSchema || []
    }
    return []
  }, [dialogMode, dialogParentNode, selectedNode, treeData, formData.isRoot])

  const dialogTitle = {
    addRoot: '루트 노드 추가',
    addChild: '하위 노드 추가',
    edit: '노드 편집',
  }[dialogMode] || ''

  return (
    <AdminPageFrame
      className="admin-page-frame--fixed"
      actions={
        <>
          <Button onClick={handleAddRoot} disabled={loading}>
            <Plus className="h-4 w-4 mr-1"/>루트 추가
          </Button>
          <Button
            variant="outline"
            className="border-amber-500/25 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800"
            onClick={handleClearAllCache}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1"/>캐시 삭제
          </Button>
        </>
      }
    >
      {/* 검색 바 */}
      <div className="admin-panel admin-panel-pad mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="코드 또는 이름으로 검색..."
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-muted"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground"/>
            </button>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      {loading && treeData.length === 0 ? (
        <div className="flex flex-col gap-2 py-4">
          <Skeleton className="h-8 w-full"/>
          <Skeleton className="h-8 w-full"/>
          <Skeleton className="h-8 w-3/4"/>
        </div>
      ) : (
        <div
          className="admin-split-layout admin-fill"
          data-size="wide"
        >
          {/* 좌측: 트리 뷰 */}
          <div className="admin-panel admin-fill min-w-0 overflow-hidden">
            <MasterCodeTree
              treeData={treeData}
              selectedNodeId={selectedNodeId}
              onNodeSelect={handleNodeSelect}
              expandedIds={expandedIds}
              onToggle={handleToggle}
              searchQuery={searchQuery}
            />
          </div>

          {/* 우측: 상세 패널 */}
          <div className="admin-panel admin-fill overflow-hidden">
            <NodeDetailPanel
              selectedNode={selectedNode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
            />
          </div>
        </div>
      )}

      {/* 추가/편집 다이얼로그 */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <NodeForm
            formData={formData}
            setFormData={setFormData}
            dialogMode={dialogMode}
            originalCode={originalCode}
            parentNode={dialogParentNode}
            rootAttributeSchema={formRootAttributeSchema}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={loading}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading
                ? <RefreshCw className="h-4 w-4 mr-1 animate-spin"/>
                : <Save className="h-4 w-4 mr-1"/>
              }
              {loading ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageFrame>
  )
}

// --- 유틸리티 함수 ---

/**
 * 트리에서 ID로 노드 찾기 (재귀)
 */
function findNodeById(nodes, id) {
  if (!nodes) return null
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * 노드의 루트 조상(depth=0) 찾기
 * 트리를 순회하며 해당 노드를 포함하는 루트 노드를 반환
 */
function findRootAncestor(treeData, targetId) {
  if (!treeData) return null
  for (const root of treeData) {
    if (containsNode(root, targetId)) return root
  }
  return null
}

/**
 * 노드 서브트리에 대상 ID가 포함되어 있는지 확인
 */
function containsNode(node, targetId) {
  if (node.id === targetId) return true
  if (node.children) {
    return node.children.some(child => containsNode(child, targetId))
  }
  return false
}
