import {useCallback, useEffect, useMemo, useState} from 'react'
import {toast} from 'sonner'
import {Pencil, Play, Save} from 'lucide-react'
import AdminPageFrame from '../../components/layout/admin/AdminPageFrame'
import ShadcnDataTable from '../../components/common/ShadcnDataTable'
import {Button} from '../../components/ui/button'
import {Input} from '../../components/ui/input'
import {Label} from '../../components/ui/label'
import {Badge} from '../../components/ui/badge'
import {Switch} from '../../components/ui/switch'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '../../components/ui/dialog'
import service from '../../service'

export default function HotDealSitesPage() {
    const [sites, setSites] = useState([])
    const [loading, setLoading] = useState(true)
    const [scraping, setScraping] = useState(false)

    // 수정 다이얼로그
    const [openDialog, setOpenDialog] = useState(false)
    const [editTarget, setEditTarget] = useState(null)
    const [formData, setFormData] = useState({
        enabled: true,
        minRecommendation: 0,
        minViewCount: 0,
        minCommentCount: 0,
    })

    const loadSites = useCallback(async () => {
        try {
            const data = await service.hotDeal.getAllSites()
            setSites(data ?? [])
        } catch {
            toast.error('사이트 목록을 불러오지 못했습니다.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadSites()
    }, [loadSites])

    const handleEdit = (site) => {
        setEditTarget(site)
        setFormData({
            enabled: site.enabled,
            minRecommendation: site.minRecommendation,
            minViewCount: site.minViewCount,
            minCommentCount: site.minCommentCount,
        })
        setOpenDialog(true)
    }

    const handleSave = async () => {
        try {
            await service.hotDeal.updateSite(editTarget.id, formData)
            toast.success('사이트 설정이 수정되었습니다.')
            setOpenDialog(false)
            await loadSites()
        } catch {
            toast.error('사이트 수정�� 실패했습니다.')
        }
    }

    const handleScrape = async () => {
        setScraping(true)
        try {
            await service.hotDeal.triggerScrape()
            toast.success('스크래핑이 시작되었습니다.')
        } catch {
            toast.error('스크래핑 실행에 실패했습니다.')
        } finally {
            setScraping(false)
        }
    }

    const columns = useMemo(() => [
        {
            accessorKey: 'siteName',
            header: '사이트명',
            grow: true,
            mobilePrimary: true,
            mobileLabel: '사이트',
        },
        {
            accessorKey: 'siteCode',
            header: '코드',
            size: 140,
            mobileHidden: true,
        },
        {
            accessorKey: 'enabled',
            header: '활성',
            size: 140,
            mobileLabel: '상태',
            cell: ({value}) => (
                <Badge variant={value ? 'success' : 'secondary'}>
                    {value ? '활성' : '비활성'}
                </Badge>
            ),
        },
        {
            accessorKey: 'minRecommendation',
            header: '최소 추천',
            size: 100,
            mobileHidden: true,
        },
        {
            accessorKey: 'minViewCount',
            header: '최소 조회',
            size: 100,
            mobileHidden: true,
        },
        {
            accessorKey: 'minCommentCount',
            header: '최소 댓글',
            size: 100,
            mobileHidden: true,
        },
    ], [])

    return (
        <AdminPageFrame>
            {/* 상단 액션 바 */}
            <div className="admin-panel admin-panel-pad mb-2">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 ml-auto">
                        <Button
                            variant="outline"
                            className="cursor-pointer"
                            onClick={handleScrape}
                            disabled={scraping}
                        >
                            <Play className="h-4 w-4 mr-1"/>
                            {scraping ? '스크래핑 중...' : '스크래핑 실행'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 사이트 테이블 */}
            <div className="admin-panel admin-table-shell">
                <ShadcnDataTable
                    columns={columns}
                    paginationMode="client"
                    clientSideData={sites}
                    defaultPageSize={20}
                    density="comfortable"
                    enableRowActions
                    actionsColumnSize={80}
                    positionActionsColumn="last"
                    renderRowActions={({row}) => (
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 cursor-pointer"
                                onClick={() => handleEdit(row.original)}
                                aria-label={`${row.original.siteName} 수정`}
                            >
                                <Pencil className="h-4 w-4"/>
                            </Button>
                        </div>
                    )}
                />
            </div>

            {/* 수정 다이얼로그 */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>사이트 설정 수정</DialogTitle>
                    </DialogHeader>
                    {editTarget && (
                        <div className="space-y-4 pt-2">
                            <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-sm">
                                <span className="text-[color:var(--admin-text-faint)]">사이트: </span>
                                <strong className="text-[color:var(--admin-text)]">{editTarget.siteName}</strong>
                                <span className="text-[color:var(--admin-text-muted)]"> ({editTarget.siteCode})</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <Label>활성 상태</Label>
                                <Switch
                                    checked={formData.enabled}
                                    onCheckedChange={(checked) =>
                                        setFormData(prev => ({...prev, enabled: checked}))
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>최소 추천수</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={formData.minRecommendation}
                                    onChange={(e) =>
                                        setFormData(prev => ({...prev, minRecommendation: parseInt(e.target.value) || 0}))
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>최소 조회수</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={formData.minViewCount}
                                    onChange={(e) =>
                                        setFormData(prev => ({...prev, minViewCount: parseInt(e.target.value) || 0}))
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>최소 댓글수</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={formData.minCommentCount}
                                    onChange={(e) =>
                                        setFormData(prev => ({...prev, minCommentCount: parseInt(e.target.value) || 0}))
                                    }
                                />
                            </div>
                        </div>
                    )}
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
        </AdminPageFrame>
    )
}
