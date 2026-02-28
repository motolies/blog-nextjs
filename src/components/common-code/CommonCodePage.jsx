import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Plus, Home, ChevronRight, Save, RefreshCw, ChevronsUpDown, Check} from 'lucide-react'
import {toast} from 'sonner'
import {Button} from '../ui/button'
import {Skeleton} from '../ui/skeleton'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '../ui/dialog'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from '../ui/breadcrumb'
import {Popover, PopoverContent, PopoverTrigger} from '../ui/popover'
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from '../ui/command'
import {cn} from '../../lib/utils'
import {COMBOBOX_POPOVER_CONTENT_CLASSNAME} from '../../lib/combobox'
import service from '../../service'
import MillerColumns from './MillerColumns'
import NodeDetailPanel from './NodeDetailPanel'
import ClassForm from './ClassForm'
import CodeForm from './CodeForm'
import AdminPageFrame from '../layout/admin/AdminPageFrame'

const INITIAL_FORM_DATA = {
  classCode: '',
  className: '',
  description: '',
  attribute1Name: '',
  attribute2Name: '',
  attribute3Name: '',
  attribute4Name: '',
  attribute5Name: '',
  isActive: true,
  codeClassCode: '',
  code: '',
  codeName: '',
  attribute1Value: '',
  attribute2Value: '',
  attribute3Value: '',
  attribute4Value: '',
  attribute5Value: '',
  childClassCode: '',
  sort: 0,
  parentCodeNode: null
}

export default function CommonCodePage() {
  // 데이터 상태
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(false)

  // 네비게이션 상태: [{ type, code, node }]
  const [navigationPath, setNavigationPath] = useState([])

  // 검색 Combobox 상태
  const [searchOpen, setSearchOpen] = useState(false)

  // 다이얼로그 상태
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [originalCode, setOriginalCode] = useState('')

  // 현재 선택된 노드 (경로의 마지막)
  const selectedNode = navigationPath.length > 0
    ? navigationPath[navigationPath.length - 1].node
    : null

  // 부모 CLASS 노드 (CODE가 선택된 경우 사용)
  const parentClassNode = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'CODE') return null
    // 경로에서 CODE 바로 앞의 CLASS를 찾음
    for (let i = navigationPath.length - 2; i >= 0; i--) {
      const entry = navigationPath[i]
      if (entry.node.type === 'CLASS') return entry.node
      // CODE의 childClass도 CLASS이므로 확인
      if (entry.node.type === 'CODE' && entry.node.childClass) return entry.node.childClass
    }
    return null
  }, [navigationPath, selectedNode])

  // 검색용 전체 노드 목록 (flat)
  const allNodes = useMemo(() => {
    const nodes = []
    const traverse = (items, path) => {
      if (!items) return
      items.forEach(item => {
        nodes.push({...item, _searchPath: path})
        if (item.type === 'CLASS' && item.codes) {
          traverse(item.codes, [...path, item])
        }
        if (item.type === 'CODE' && item.childClass?.codes) {
          traverse(item.childClass.codes, [...path, item])
        }
      })
    }
    traverse(treeData, [])
    return nodes
  }, [treeData])

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const hierarchicalData = await service.commonCode.loadHierarchicalTree()
      setTreeData(hierarchicalData || [])
    } catch (error) {
      toast.error(`데이터 로드 실패: ${error.message}`)
      setTreeData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Miller Columns 네비게이션
  const handleNavigate = useCallback((columnIndex, item) => {
    setNavigationPath(prev => {
      // columnIndex 위치에서 선택 → 이후 경로 잘라내기
      const newPath = prev.slice(0, columnIndex)
      newPath.push({type: item.type, code: item.code, node: item})
      return newPath
    })
  }, [])

  // Breadcrumb 클릭
  const handleBreadcrumbClick = useCallback((index) => {
    if (index < 0) {
      setNavigationPath([])
    } else {
      setNavigationPath(prev => prev.slice(0, index + 1))
    }
  }, [])

  // 검색에서 노드 선택
  const handleSearchSelect = useCallback((node) => {
    if (!node) return
    // _searchPath를 기반으로 navigationPath 재구성
    const path = node._searchPath.map(p => ({type: p.type, code: p.code, node: p}))
    path.push({type: node.type, code: node.code, node})
    setNavigationPath(path)
    setSearchOpen(false)
  }, [])

  // 클래스 추가
  const handleAddClass = useCallback(() => {
    setDialogMode('addClass')
    setFormData({...INITIAL_FORM_DATA})
    setOpenDialog(true)
  }, [])

  // 코드 추가
  const handleAddCode = useCallback((classNode) => {
    setDialogMode('addCode')
    setFormData({...INITIAL_FORM_DATA, codeClassCode: classNode.code})
    setOpenDialog(true)
  }, [])

  // 하위 클래스 추가
  const handleAddChildClass = useCallback((codeNode) => {
    setDialogMode('addChildClass')
    setFormData({...INITIAL_FORM_DATA, parentCodeNode: codeNode})
    setOpenDialog(true)
  }, [])

  // 편집
  const handleEdit = useCallback((node) => {
    const isClass = node.type === 'CLASS'
    setDialogMode(isClass ? 'editClass' : 'editCode')

    if (isClass) {
      setFormData({
        ...INITIAL_FORM_DATA,
        classCode: node.code,
        className: node.name,
        description: node.description || '',
        attribute1Name: node.attribute1Name || '',
        attribute2Name: node.attribute2Name || '',
        attribute3Name: node.attribute3Name || '',
        attribute4Name: node.attribute4Name || '',
        attribute5Name: node.attribute5Name || '',
        isActive: node.isActive
      })
    } else {
      setFormData({
        ...INITIAL_FORM_DATA,
        codeClassCode: node.classCode,
        code: node.code,
        codeName: node.name,
        description: node.description || '',
        attribute1Value: node.attribute1Value || '',
        attribute2Value: node.attribute2Value || '',
        attribute3Value: node.attribute3Value || '',
        attribute4Value: node.attribute4Value || '',
        attribute5Value: node.attribute5Value || '',
        childClassCode: node.childClass?.code || '',
        sort: node.sort || 0,
        isActive: node.isActive
      })
    }
    setOriginalCode(node.code)
    setOpenDialog(true)
  }, [])

  // 삭제
  const handleDelete = useCallback(async (node) => {
    const isClass = node.type === 'CLASS'
    const confirmMessage = isClass
      ? `클래스 "${node.name}"를 삭제하시겠습니까?`
      : `코드 "${node.name}"를 삭제하시겠습니까?`

    if (!confirm(confirmMessage)) return

    try {
      setLoading(true)
      if (isClass) {
        await service.commonCode.deleteClass(node.code)
      } else {
        await service.commonCode.deleteCode(node.classCode, node.code)
      }
      toast.success(`${isClass ? '클래스' : '코드'}가 성공적으로 삭제되었습니다.`)

      // 삭제된 노드가 경로에 있으면 경로 조정
      setNavigationPath(prev => {
        const idx = prev.findIndex(p => p.code === node.code && p.type === node.type)
        return idx >= 0 ? prev.slice(0, idx) : prev
      })
      await loadData()
    } catch (error) {
      toast.error(`삭제 실패: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }, [loadData])

  // 저장
  const handleSave = async () => {
    try {
      setLoading(true)

      if (dialogMode === 'addClass') {
        await service.commonCode.createClass({
          code: formData.classCode,
          name: formData.className,
          description: formData.description,
          attribute1Name: formData.attribute1Name || null,
          attribute2Name: formData.attribute2Name || null,
          attribute3Name: formData.attribute3Name || null,
          attribute4Name: formData.attribute4Name || null,
          attribute5Name: formData.attribute5Name || null,
          isActive: formData.isActive
        })
        toast.success('클래스가 성공적으로 생성되었습니다.')
      } else if (dialogMode === 'addCode') {
        await service.commonCode.createCode({
          classCode: formData.codeClassCode,
          code: formData.code,
          name: formData.codeName,
          description: formData.description,
          attribute1Value: formData.attribute1Value || null,
          attribute2Value: formData.attribute2Value || null,
          attribute3Value: formData.attribute3Value || null,
          attribute4Value: formData.attribute4Value || null,
          attribute5Value: formData.attribute5Value || null,
          childClassCode: formData.childClassCode || null,
          sort: formData.sort,
          isActive: formData.isActive
        })
        toast.success('코드가 성공적으로 생성되었습니다.')
      } else if (dialogMode === 'addChildClass') {
        await service.commonCode.createClass({
          code: formData.classCode,
          name: formData.className,
          description: formData.description,
          attribute1Name: formData.attribute1Name || null,
          attribute2Name: formData.attribute2Name || null,
          attribute3Name: formData.attribute3Name || null,
          attribute4Name: formData.attribute4Name || null,
          attribute5Name: formData.attribute5Name || null,
          isActive: formData.isActive
        })
        await service.commonCode.updateCode(
          formData.parentCodeNode.classCode,
          formData.parentCodeNode.code,
          {
            ...formData.parentCodeNode,
            childClassCode: formData.classCode
          }
        )
        toast.success('하위 클래스가 성공적으로 생성되었습니다.')
      } else if (dialogMode === 'editClass') {
        await service.commonCode.updateClass(originalCode, {
          code: formData.classCode,
          name: formData.className,
          description: formData.description,
          attribute1Name: formData.attribute1Name || null,
          attribute2Name: formData.attribute2Name || null,
          attribute3Name: formData.attribute3Name || null,
          attribute4Name: formData.attribute4Name || null,
          attribute5Name: formData.attribute5Name || null,
          isActive: formData.isActive
        })
        toast.success('클래스가 성공적으로 수정되었습니다.')
      } else if (dialogMode === 'editCode') {
        await service.commonCode.updateCode(formData.codeClassCode, originalCode, {
          code: formData.code,
          name: formData.codeName,
          description: formData.description,
          attribute1Value: formData.attribute1Value || null,
          attribute2Value: formData.attribute2Value || null,
          attribute3Value: formData.attribute3Value || null,
          attribute4Value: formData.attribute4Value || null,
          attribute5Value: formData.attribute5Value || null,
          childClassCode: formData.childClassCode || null,
          sort: formData.sort,
          isActive: formData.isActive
        })
        toast.success('코드가 성공적으로 수정되었습니다.')
      }

      setOpenDialog(false)
      await loadData()
    } catch (error) {
      toast.error(`저장 실패: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 전체 캐시 삭제
  const handleClearAllCache = async () => {
    if (!confirm('전체 캐시를 삭제하시겠습니까?\n\n모든 캐시가 삭제되며 시스템 성능에 일시적인 영향을 줄 수 있습니다.')) {
      return
    }
    try {
      setLoading(true)
      const result = await service.commonCode.evictAllCaches()
      toast.success(`${result.message} (${result.evictedCacheCount}개 캐시 삭제됨)`)
    } catch (error) {
      toast.error(`캐시 삭제 실패: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 다이얼로그 폼 타입
  const isClassForm = dialogMode === 'addClass' || dialogMode === 'addChildClass' || dialogMode === 'editClass'

  const dialogTitle = {
    addClass: '클래스 추가',
    addCode: '코드 추가',
    addChildClass: '하위 클래스 추가',
    editClass: '클래스 편집',
    editCode: '코드 편집'
  }[dialogMode] || ''

  const classNodes = allNodes.filter(n => n.type === 'CLASS')
  const codeNodes = allNodes.filter(n => n.type === 'CODE')

  return (
    <AdminPageFrame>
      {/* 상단 툴바 */}
      <div className="admin-panel admin-panel-pad mb-2 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--admin-text-faint)]">Lookup</p>
          <h2 className="mt-1 text-xl font-semibold text-[color:var(--admin-text)]">코드 탐색 및 관리</h2>
        </div>

        {/* 검색 Combobox */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={searchOpen}
              className="flex-1 min-w-[200px] max-w-xs justify-between font-normal text-[color:var(--admin-text-secondary)]"
            >
              검색...
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className={COMBOBOX_POPOVER_CONTENT_CLASSNAME}>
            <Command filter={(value, search) => {
              if (value.toLowerCase().includes(search.toLowerCase())) return 1
              return 0
            }}>
              <CommandInput placeholder="코드나 이름으로 검색..."/>
              <CommandList>
                <CommandEmpty>결과 없음</CommandEmpty>
                {classNodes.length > 0 && (
                  <CommandGroup heading="클래스">
                    {classNodes.map(node => (
                      <CommandItem
                        key={`CLASS-${node.code}`}
                        value={`${node.code} ${node.name}`}
                        onSelect={() => handleSearchSelect(node)}
                      >
                        {node.code} - {node.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {codeNodes.length > 0 && (
                  <CommandGroup heading="코드">
                    {codeNodes.map(node => (
                      <CommandItem
                        key={`CODE-${node.code}-${node.classCode}`}
                        value={`${node.code} ${node.name}`}
                        onSelect={() => handleSearchSelect(node)}
                      >
                        {node.code} - {node.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button onClick={handleAddClass} disabled={loading}>
          <Plus className="h-4 w-4 mr-1"/>클래스 추가
        </Button>
        <Button
          variant="outline"
          className="border-amber-500/25 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800"
          onClick={handleClearAllCache}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-1"/>전체 캐시 삭제
        </Button>
      </div>

      {/* Breadcrumb */}
      <div className="admin-panel-soft px-3 py-2 mb-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button
                  onClick={() => handleBreadcrumbClick(-1)}
                  className="flex items-center gap-1 text-sm hover:underline"
                >
                  <Home className="h-3.5 w-3.5"/>전체
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {navigationPath.map((entry, idx) => (
              <React.Fragment key={`${entry.type}-${entry.code}`}>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5"/>
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button
                      onClick={() => handleBreadcrumbClick(idx)}
                      className={cn(
                        'text-sm hover:underline',
                        idx === navigationPath.length - 1
                          ? 'font-semibold text-[color:var(--admin-text)]'
                          : 'text-[color:var(--admin-text-muted)]'
                      )}
                    >
                      {entry.code}
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
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
          style={{minHeight: 'calc(100vh - 18rem)'}}
        >
          {/* 왼쪽: Miller Columns */}
          <div className="admin-panel admin-fill min-w-0 overflow-hidden">
            <MillerColumns
              treeData={treeData}
              navigationPath={navigationPath}
              onNavigate={handleNavigate}
              onAddClass={handleAddClass}
              onAddCode={handleAddCode}
            />
          </div>

          {/* 오른쪽: 상세 패널 */}
          <div className="admin-panel admin-fill overflow-hidden">
            <NodeDetailPanel
              selectedNode={selectedNode}
              parentClassNode={parentClassNode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddCode={handleAddCode}
              onAddChildClass={handleAddChildClass}
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
          {isClassForm ? (
            <ClassForm
              formData={formData}
              setFormData={setFormData}
              dialogMode={dialogMode}
              originalCode={originalCode}
            />
          ) : (
            <CodeForm
              formData={formData}
              setFormData={setFormData}
              dialogMode={dialogMode}
              originalCode={originalCode}
              parentClassNode={parentClassNode}
            />
          )}
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
