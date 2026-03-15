import {useCallback, useEffect, useMemo, useState} from 'react'
import {useRouter} from 'next/router'
import {toast} from 'sonner'
import {Merge, Pencil, Plus, Save, Search, Tags, Trash2, X} from 'lucide-react'
import AdminPageFrame from '../../components/layout/admin/AdminPageFrame'
import ShadcnDataTable from '../../components/common/ShadcnDataTable'
import DeleteConfirm from '../../components/confirm/DeleteConfirm'
import {Button} from '../../components/ui/button'
import {Input} from '../../components/ui/input'
import {Label} from '../../components/ui/label'
import {Badge} from '../../components/ui/badge'
import {Switch} from '../../components/ui/switch'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '../../components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select'
import service from '../../service'
import {searchObjectInit} from '../../model/searchObject'
import {base64Encode} from '../../util/base64Util'

export default function TagsPage() {
    const router = useRouter()
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [unusedOnly, setUnusedOnly] = useState(false)

    // 생성/수정 다이얼로그
    const [openDialog, setOpenDialog] = useState(false)
    const [dialogMode, setDialogMode] = useState(null)
    const [editTarget, setEditTarget] = useState(null)
    const [tagName, setTagName] = useState('')

    // 병합 다이얼로그
    const [openMergeDialog, setOpenMergeDialog] = useState(false)
    const [mergeSource, setMergeSource] = useState(null)
    const [mergeTargetId, setMergeTargetId] = useState('')

    // 삭제 확인
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)

    // 미사용 일괄삭제 확인
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

    const loadTags = useCallback(async () => {
        try {
            const res = await service.tag.allTags()
            setTags(res.data ?? [])
        } catch {
            toast.error('태그 목록을 불러오지 못했습니다.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadTags()
    }, [loadTags])

    const filteredTags = useMemo(() => {
        let result = tags

        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(t => t.name.toLowerCase().includes(q))
        }

        if (unusedOnly) {
            result = result.filter(t => t.postCount === 0)
        }

        return result
    }, [tags, searchQuery, unusedOnly])

    const unusedCount = useMemo(() => tags.filter(t => t.postCount === 0).length, [tags])

    const mergeTargetOptions = useMemo(() => {
        if (!mergeSource) return []
        return tags.filter(t => t.id !== mergeSource.id).sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    }, [tags, mergeSource])

    const searchTagPosts = (tag) => {
        const condition = {
            ...searchObjectInit,
            tags: [{id: tag.id, name: tag.name}],
        }
        router.push({pathname: '/search', query: {q: base64Encode(JSON.stringify(condition))}})
    }

    const handleCreate = () => {
        setDialogMode('create')
        setEditTarget(null)
        setTagName('')
        setOpenDialog(true)
    }

    const handleEdit = (tag) => {
        setDialogMode('edit')
        setEditTarget(tag)
        setTagName(tag.name)
        setOpenDialog(true)
    }

    const handleSave = async () => {
        const trimmed = tagName.trim()
        if (!trimmed) {
            toast.error('태그 이름은 필수입니다.')
            return
        }

        try {
            if (dialogMode === 'create') {
                await service.tag.createTag({name: trimmed})
                toast.success('태그가 생성되었습니다.')
            } else {
                await service.tag.updateTag(editTarget.id, {name: trimmed})
                toast.success('태그가 수정되었습니다.')
            }
            setOpenDialog(false)
            await loadTags()
        } catch {
            toast.error(dialogMode === 'create' ? '태그 생성에 실패했습니다.' : '태그 수정에 실패했습니다.')
        }
    }

    const handleDelete = (tag) => {
        setDeleteTarget(tag)
        setShowDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        setShowDeleteConfirm(false)
        try {
            await service.tag.deleteTag(deleteTarget.id)
            toast.success('태그가 삭제되었습니다.')
            await loadTags()
        } catch {
            toast.error('태그 삭제에 실패했습니다.')
        }
        setDeleteTarget(null)
    }

    const handleBulkDelete = () => {
        if (unusedCount === 0) {
            toast.info('미사용 태그가 없습니다.')
            return
        }
        setShowBulkDeleteConfirm(true)
    }

    const confirmBulkDelete = async () => {
        setShowBulkDeleteConfirm(false)
        try {
            await service.tag.deleteUnusedTags()
            toast.success('미사용 태그가 일괄 삭제되었습니다.')
            await loadTags()
        } catch {
            toast.error('미사용 태그 삭제에 실패했습니다.')
        }
    }

    const handleMerge = (tag) => {
        setMergeSource(tag)
        setMergeTargetId('')
        setOpenMergeDialog(true)
    }

    const confirmMerge = async () => {
        if (!mergeTargetId) {
            toast.error('대상 태그를 선택해주세요.')
            return
        }
        try {
            await service.tag.mergeTags({sourceTagId: mergeSource.id, targetTagId: Number(mergeTargetId)})
            toast.success('태그가 병합되었습니다.')
            setOpenMergeDialog(false)
            await loadTags()
        } catch {
            toast.error('태그 병합에 실패했습니다.')
        }
    }

    const columns = useMemo(() => [
        {
            accessorKey: 'name',
            header: '태그 이름',
            grow: true,
            mobilePrimary: true,
            mobileLabel: '태그',
            cell: ({value, row}) => (
                <span className="inline-flex items-center gap-2">
                    {value}
                    {row.postCount === 0 && <Badge variant="secondary">미사용</Badge>}
                </span>
            ),
        },
        {
            accessorKey: 'postCount',
            header: '포스트 수',
            size: 120,
            mobileLabel: '포스트',
            cell: ({value, row}) => value > 0 ? (
                <button
                    className="cursor-pointer text-sky-600 hover:text-sky-800 hover:underline"
                    onClick={(e) => {
                        e.stopPropagation()
                        searchTagPosts(row)
                    }}
                >
                    {value}
                </button>
            ) : (
                <span>0</span>
            ),
        },
    ], [])

    return (
        <AdminPageFrame>
            {/* 상단 액션 바 */}
            <div className="admin-panel admin-panel-pad mb-2">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="태그 이름으로 검색..."
                            className="pl-9 pr-8"
                            aria-label="태그 검색"
                        />
                        {searchQuery && (
                            <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 hover:bg-muted"
                                onClick={() => setSearchQuery('')}
                                aria-label="검색어 지우기"
                            >
                                <X className="h-3.5 w-3.5 text-muted-foreground"/>
                            </button>
                        )}
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-[color:var(--admin-text-muted)]">
                        <Switch
                            checked={unusedOnly}
                            onCheckedChange={setUnusedOnly}
                            aria-label="미사용 태그만 보기"
                        />
                        미사용 태그만
                    </label>

                    <div className="flex items-center gap-2 ml-auto">
                        <Button variant="outline" className="cursor-pointer" onClick={handleBulkDelete} disabled={unusedCount === 0}>
                            <Trash2 className="h-4 w-4 mr-1"/>미사용 일괄삭제{unusedCount > 0 && ` (${unusedCount})`}
                        </Button>
                        <Button className="cursor-pointer" onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-1"/>새 태그
                        </Button>
                    </div>
                </div>
            </div>

            {/* 태그 테이블 */}
            <div className="admin-panel admin-table-shell">
                <ShadcnDataTable
                    columns={columns}
                    paginationMode="client"
                    clientSideData={filteredTags}
                    defaultPageSize={20}
                    density="comfortable"
                    enableRowActions
                    actionsColumnSize={120}
                    positionActionsColumn="last"
                    renderRowActions={({row}) => (
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 cursor-pointer"
                                onClick={() => handleEdit(row.original)}
                                aria-label={`${row.original.name} 수정`}
                            >
                                <Pencil className="h-4 w-4"/>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 cursor-pointer"
                                onClick={() => handleMerge(row.original)}
                                aria-label={`${row.original.name} 병합`}
                            >
                                <Merge className="h-4 w-4"/>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive"
                                onClick={() => handleDelete(row.original)}
                                aria-label={`${row.original.name} 삭제`}
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    )}
                />
            </div>

            {/* 생성/수정 다이얼로그 */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{dialogMode === 'create' ? '태그 추가' : '태그 수정'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <Label>이름 *</Label>
                            <Input
                                value={tagName}
                                onChange={(e) => setTagName(e.target.value)}
                                placeholder="태그 이름"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                            />
                        </div>
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

            {/* 병합 다이얼로그 */}
            <Dialog open={openMergeDialog} onOpenChange={setOpenMergeDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>태그 병합</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-sm">
                            <span className="text-[color:var(--admin-text-faint)]">병합할 태그: </span>
                            <strong className="text-[color:var(--admin-text)]">{mergeSource?.name}</strong>
                            {mergeSource?.postCount > 0 && (
                                <span className="text-[color:var(--admin-text-muted)]"> (포스트 {mergeSource.postCount}개)</span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label>대상 태그 *</Label>
                            <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="대상 태그를 선택하세요"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {mergeTargetOptions.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.name} ({t.postCount}개)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-sm text-[color:var(--admin-text-muted)]">
                            <strong>{mergeSource?.name}</strong>의 포스트가 선택한 대상 태그로 이동되고, <strong>{mergeSource?.name}</strong>은 삭제됩니다.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenMergeDialog(false)}>
                            취소
                        </Button>
                        <Button onClick={confirmMerge} disabled={!mergeTargetId}>
                            <Merge className="h-4 w-4 mr-1"/>병합
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 삭제 확인 */}
            <DeleteConfirm
                open={showDeleteConfirm}
                question={`${deleteTarget?.name} 태그를 삭제하시겠습니까?`}
                onConfirm={confirmDelete}
                onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null) }}
            />

            {/* 미사용 일괄삭제 확인 */}
            <DeleteConfirm
                open={showBulkDeleteConfirm}
                question={`미사용 태그 ${unusedCount}개를 모두 삭제하시겠습니까?`}
                onConfirm={confirmBulkDelete}
                onCancel={() => setShowBulkDeleteConfirm(false)}
            />
        </AdminPageFrame>
    )
}
