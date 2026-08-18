import {useCallback, useEffect, useMemo, useState} from 'react'
import {toast} from 'sonner'
import {Pencil, Plus, Save, Search, Trash2, X} from 'lucide-react'
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame'
import ShadcnDataTable, {type DataTableColumn} from '@/components/common/ShadcnDataTable'
import DeleteConfirm from '@/components/confirm/DeleteConfirm'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Badge} from '@/components/ui/badge'
import {Switch} from '@/components/ui/switch'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import service from '@/service'
import type {HotDealKeyword} from '@/types/hotDeal'

// 백엔드 HotDealKeyword.normalize()와 동일한 규칙. 미리보기와 선제 중복 검사에 사용한다.
const normalizeKeyword = (raw: string) =>
    raw.replace(/[\s 　]+/g, '').toLowerCase()

const MIN_KEYWORD_LENGTH = 2

// axiosClient 응답 인터셉터는 성공 경로만 언래핑하므로 실패 응답은 ApiResponse 원본이 온다.
const extractErrorMessage = (err: unknown, fallback: string) => {
    const message = (err as any)?.response?.data?.message
    return typeof message === 'string' && message.trim() ? message : fallback
}

export default function HotDealKeywordsPage() {
    const [keywords, setKeywords] = useState<HotDealKeyword[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [enabledOnly, setEnabledOnly] = useState(false)

    // 생성/수정 다이얼로그
    const [openDialog, setOpenDialog] = useState(false)
    const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
    const [editTarget, setEditTarget] = useState<HotDealKeyword | null>(null)
    const [keywordText, setKeywordText] = useState('')
    const [keywordEnabled, setKeywordEnabled] = useState(true)
    const [saving, setSaving] = useState(false)

    // 삭제 확인
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<HotDealKeyword | null>(null)

    const loadKeywords = useCallback(async () => {
        try {
            const data = await service.hotDeal.getKeywords()
            setKeywords(data ?? [])
        } catch {
            toast.error('키워드 목록을 불러오지 못했습니다.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadKeywords()
    }, [loadKeywords])

    const filteredKeywords = useMemo(() => {
        const query = normalizeKeyword(searchQuery)
        return keywords.filter((item) => {
            if (enabledOnly && !item.enabled) {
                return false
            }
            if (!query) {
                return true
            }
            return normalizeKeyword(item.keyword).includes(query)
        })
    }, [keywords, searchQuery, enabledOnly])

    const normalizedPreview = useMemo(() => normalizeKeyword(keywordText), [keywordText])

    const handleCreate = () => {
        setDialogMode('create')
        setEditTarget(null)
        setKeywordText('')
        setKeywordEnabled(true)
        setOpenDialog(true)
    }

    const handleEdit = (keyword: HotDealKeyword) => {
        setDialogMode('edit')
        setEditTarget(keyword)
        setKeywordText(keyword.keyword)
        setKeywordEnabled(keyword.enabled)
        setOpenDialog(true)
    }

    /**
     * 저장 전 클라이언트에서 형식과 중복을 먼저 검사한다.
     * 백엔드 검증도 그대로 살아있지만, 400 응답이 슬랙 에러 채널로도 전송되므로
     * 흔한 입력 실수는 API 호출 전에 걸러낸다.
     */
    const handleSave = async () => {
        const trimmed = keywordText.trim()
        const normalized = normalizeKeyword(trimmed)

        if (!normalized) {
            toast.error('키워드는 공백만으로 구성될 수 없습니다.')
            return
        }
        if (normalized.length < MIN_KEYWORD_LENGTH) {
            toast.error('키워드는 공백 제거 기준 2자 이상이어야 합니다.')
            return
        }
        const duplicated = keywords.some((item) =>
            item.id !== editTarget?.id && normalizeKeyword(item.keyword) === normalized)
        if (duplicated) {
            toast.error('이미 등록된 키워드입니다.')
            return
        }

        setSaving(true)
        try {
            const payload = {keyword: trimmed, enabled: keywordEnabled}
            if (dialogMode === 'create') {
                await service.hotDeal.createKeyword(payload)
                toast.success('키워드가 등록되었습니다.')
            } else {
                await service.hotDeal.updateKeyword(editTarget!.id, payload)
                toast.success('키워드가 수정되었습니다.')
            }
            setOpenDialog(false)
            await loadKeywords()
        } catch (err) {
            toast.error(extractErrorMessage(err, '키워드 저장에 실패했습니다.'))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (keyword: HotDealKeyword) => {
        setDeleteTarget(keyword)
        setShowDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        setShowDeleteConfirm(false)
        try {
            await service.hotDeal.deleteKeyword(deleteTarget!.id)
            toast.success('키워드가 삭제되었습니다.')
            await loadKeywords()
        } catch (err) {
            toast.error(extractErrorMessage(err, '키워드 삭제에 실패했습니다.'))
        } finally {
            setDeleteTarget(null)
        }
    }

    // 목록에서 바로 활성 상태를 토글한다 (다이얼로그를 열지 않아도 알림을 즉시 끌 수 있게)
    const handleToggleEnabled = async (keyword: HotDealKeyword) => {
        try {
            await service.hotDeal.updateKeyword(keyword.id, {
                keyword: keyword.keyword,
                enabled: !keyword.enabled,
            })
            toast.success(keyword.enabled ? '키워드를 비활성화했습니다.' : '키워드를 활성화했습니다.')
            await loadKeywords()
        } catch (err) {
            toast.error(extractErrorMessage(err, '상태 변경에 실패했습니다.'))
        }
    }

    const enabledCount = useMemo(() => keywords.filter((k) => k.enabled).length, [keywords])

    const columns = useMemo<DataTableColumn[]>(() => [
        {
            accessorKey: 'keyword',
            header: '키워드',
            grow: true,
            mobilePrimary: true,
            mobileLabel: '키워드',
        },
        {
            accessorKey: 'normalizedKeyword',
            header: '매칭 문자열',
            size: 200,
            mobileHidden: true,
            cell: ({value}: {value: string}) => (
                <span className="font-mono text-xs text-[color:var(--admin-text-muted)]">{value}</span>
            ),
        },
        {
            accessorKey: 'enabled',
            header: '활성',
            size: 100,
            mobileLabel: '상태',
            cell: ({value, row}: {value: boolean; row: any}) => (
                <button
                    className="cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleToggleEnabled(row)
                    }}
                    aria-label={`${row.keyword} ${value ? '비활성화' : '활성화'}`}
                >
                    <Badge variant={value ? 'success' : 'secondary'}>
                        {value ? '활성' : '비활성'}
                    </Badge>
                </button>
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
                            placeholder="키워드로 검색..."
                            className="pl-9 pr-8"
                            aria-label="키워드 검색"
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
                            checked={enabledOnly}
                            onCheckedChange={setEnabledOnly}
                            aria-label="활성 키워드만 보기"
                        />
                        활성만 ({enabledCount})
                    </label>

                    <div className="flex items-center gap-2 ml-auto">
                        <Button className="cursor-pointer" onClick={handleCreate}>
                            <Plus className="h-4 w-4 mr-1"/>새 키워드
                        </Button>
                    </div>
                </div>
            </div>

            {/* 안내 */}
            <div className="admin-panel admin-panel-pad mb-2">
                <p className="text-sm text-[color:var(--admin-text-muted)]">
                    등록한 키워드가 핫딜 제목에 포함되면 <strong>추천·조회·댓글 임계값을 무시</strong>하고
                    Slack에 <strong>@channel 멘션</strong>으로 알림이 전송됩니다.
                    대소문자와 공백은 무시하고 부분일치로 판단합니다.
                </p>
            </div>

            {/* 키워드 테이블 */}
            <div className="admin-panel admin-table-shell">
                <ShadcnDataTable
                    columns={columns}
                    paginationMode="client"
                    clientSideData={filteredKeywords}
                    defaultPageSize={20}
                    density="comfortable"
                    enableRowActions
                    actionsColumnSize={100}
                    positionActionsColumn="last"
                    renderRowActions={({row}: {row: any}) => (
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 cursor-pointer"
                                onClick={() => handleEdit(row.original)}
                                aria-label={`${row.original.keyword} 수정`}
                            >
                                <Pencil className="h-4 w-4"/>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive"
                                onClick={() => handleDelete(row.original)}
                                aria-label={`${row.original.keyword} 삭제`}
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
                        <DialogTitle>{dialogMode === 'create' ? '키워드 추가' : '키워드 수정'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
                            이 키워드에 매칭되면 <strong>임계값을 무시</strong>하고 <strong>@channel 멘션</strong>으로
                            알림이 갑니다. 짧거나 흔한 단어는 알림이 과도하게 발생할 수 있습니다.
                        </div>
                        <div className="space-y-1">
                            <Label>키워드 *</Label>
                            <Input
                                value={keywordText}
                                onChange={(e) => setKeywordText(e.target.value)}
                                placeholder="예: 닌텐도"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                            />
                            {normalizedPreview && (
                                <p className="text-xs text-[color:var(--admin-text-muted)]">
                                    매칭 문자열: <code className="font-mono">{normalizedPreview}</code>
                                    {normalizedPreview.length < MIN_KEYWORD_LENGTH && (
                                        <span className="text-destructive"> (2자 이상 필요)</span>
                                    )}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>활성 상태</Label>
                            <Switch
                                checked={keywordEnabled}
                                onCheckedChange={setKeywordEnabled}
                                aria-label="키워드 활성 상태"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDialog(false)}>
                            취소
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="h-4 w-4 mr-1"/>{saving ? '저장 중...' : '저장'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 삭제 확인 */}
            <DeleteConfirm
                open={showDeleteConfirm}
                question={`${deleteTarget?.keyword} 키워드를 삭제하시겠습니까?`}
                onConfirm={confirmDelete}
                onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null) }}
            />
        </AdminPageFrame>
    )
}
