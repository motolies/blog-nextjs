import CategoryTreeView from "../../components/CategoryTreeView"
import CategoryDetailPanel from "../../components/category/CategoryDetailPanel"
import CategoryAutoComplete from "../../components/CategoryAutoComplete"
import DeleteConfirm from "../../components/confirm/DeleteConfirm"
import {Plus, Save, Search, X} from 'lucide-react'
import {useMemo, useState} from "react"
import {toast} from 'sonner'
import service from "../../service"
import {useDispatch, useSelector} from "react-redux"
import {getCategoryFlatAction, getCategoryTreeAction} from "../../store/actions/categoryActions"
import {Button} from "../../components/ui/button"
import {Input} from "../../components/ui/input"
import {Label} from "../../components/ui/label"
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "../../components/ui/dialog"
import AdminPageFrame from "../../components/layout/admin/AdminPageFrame"
import {isSameEntityId} from "../../lib/combobox"

export default function CategoriesPage() {
    const dispatch = useDispatch()
    const categoryTree = useSelector((state) => state.category.categoryTree)

    const [selectedNode, setSelectedNode] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    // 삭제 확인
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)

    // 다이얼로그
    const [openDialog, setOpenDialog] = useState(false)
    const [dialogMode, setDialogMode] = useState(null) // 'add' | 'addChild' | 'edit'
    const [formData, setFormData] = useState({name: '', parentId: 'ROOT'})
    const [dialogParentNode, setDialogParentNode] = useState(null)

    // 선택된 노드의 부모 이름 조회
    const parentName = useMemo(() => {
        if (!selectedNode?.parentId || !categoryTree) return null
        const parent = findNodeById(categoryTree, selectedNode.parentId)
        return parent?.name || null
    }, [selectedNode, categoryTree])

    const refresh = () => {
        dispatch(getCategoryFlatAction())
        dispatch(getCategoryTreeAction())
    }

    // 노드 선택
    const handleNodeSelect = (node) => {
        setSelectedNode(node)
    }

    // 최상위 카테고리 추가
    const handleAddRoot = () => {
        setDialogMode('add')
        setDialogParentNode(null)
        setFormData({name: '', parentId: 'ROOT'})
        setOpenDialog(true)
    }

    // 하위 카테고리 추가
    const handleAddChild = (node) => {
        setDialogMode('addChild')
        setDialogParentNode(node)
        setFormData({name: '', parentId: node.id})
        setOpenDialog(true)
    }

    // 편집
    const handleEdit = (node) => {
        setDialogMode('edit')
        setDialogParentNode(null)
        setFormData({name: node.name, parentId: node.parentId})
        setOpenDialog(true)
    }

    // 삭제
    const handleDelete = (node) => {
        setDeleteTarget(node)
        setShowDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        setShowDeleteConfirm(false)
        try {
            await service.category.delete({id: deleteTarget.id})
            toast.success("카테고리가 삭제되었습니다.")
            if (selectedNode?.id === deleteTarget.id) {
                setSelectedNode(null)
            }
            refresh()
        } catch {
            toast.error("카테고리 삭제에 실패하였습니다.")
        }
        setDeleteTarget(null)
    }

    // 부모 카테고리 변경 (편집 모드)
    const onChangeParentCategory = (parentCategory) => {
        if (isSameEntityId(parentCategory?.id, selectedNode?.id)) {
            toast.error("동일 카테고리는 부모 카테고리에 설정할 수 없습니다.")
            return
        }
        if (parentCategory !== null) {
            setFormData(prev => ({...prev, parentId: parentCategory.id}))
        }
    }

    // 저장
    const handleSave = async () => {
        if (!formData.name?.trim()) {
            toast.error("카테고리 이름은 필수입니다.")
            return
        }

        try {
            if (dialogMode === 'add' || dialogMode === 'addChild') {
                const category = {
                    id: 'NEW',
                    name: formData.name.trim(),
                    parentId: formData.parentId,
                }
                await service.category.save({category})
                toast.success("카테고리가 저장되었습니다.")
            } else if (dialogMode === 'edit') {
                const category = {
                    ...selectedNode,
                    name: formData.name.trim(),
                    parentId: formData.parentId,
                }
                await service.category.update({category})
                toast.success("카테고리가 수정되었습니다.")
            }
            setOpenDialog(false)
            refresh()
        } catch {
            toast.error(dialogMode === 'edit'
                ? "카테고리 수정에 실패하였습니다."
                : "카테고리 저장에 실패하였습니다."
            )
        }
    }

    const dialogTitle = {
        add: '카테고리 추가',
        addChild: '하위 카테고리 추가',
        edit: '카테고리 편집',
    }[dialogMode] || ''

    return (
        <AdminPageFrame
            className="admin-page-frame--fixed"
            actions={
                <Button onClick={handleAddRoot}>
                    <Plus className="h-4 w-4 mr-1"/>카테고리 추가
                </Button>
            }
        >
            {/* 검색 바 */}
            <div className="admin-panel admin-panel-pad mb-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="카테고리 이름으로 검색..."
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
            <div className="admin-split-layout admin-fill" data-size="wide">
                {/* 좌측: 트리 뷰 */}
                <div className="admin-panel admin-fill min-w-0 overflow-hidden">
                    <CategoryTreeView
                        onChangeCategory={handleNodeSelect}
                        selectedNodeId={selectedNode?.id}
                        searchQuery={searchQuery}
                        collapsible={false}
                    />
                </div>

                {/* 우측: 상세 패널 */}
                <div className="admin-panel admin-fill overflow-hidden">
                    <CategoryDetailPanel
                        selectedNode={selectedNode}
                        parentName={parentName}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAddChild={handleAddChild}
                    />
                </div>
            </div>

            {/* 추가/편집 다이얼로그 */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        {dialogMode === 'addChild' && dialogParentNode && (
                            <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-sm">
                                <span className="text-[color:var(--admin-text-faint)]">부모 카테고리: </span>
                                <strong className="text-[color:var(--admin-text)]">{dialogParentNode.name}</strong>
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label>이름 *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                                placeholder="카테고리 이름"
                                autoFocus
                            />
                        </div>
                        {dialogMode === 'edit' && (
                            <div className="space-y-1">
                                <Label>부모 카테고리</Label>
                                <CategoryAutoComplete
                                    onChangeCategory={onChangeParentCategory}
                                    setCategoryId={formData.parentId}
                                    label="부모 카테고리"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDialog(false)}>
                            취소
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="h-4 w-4 mr-1"/>저장
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteConfirm
                open={showDeleteConfirm}
                question={`${deleteTarget?.name} 카테고리를 삭제하시겠습니까?`}
                onConfirm={confirmDelete}
                onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null) }}
            />
        </AdminPageFrame>
    )
}

function findNodeById(node, id) {
    if (!node) return null
    if (node.id === id) return node
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeById(child, id)
            if (found) return found
        }
    }
    return null
}
