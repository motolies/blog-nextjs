import {useCallback, useEffect, useMemo, useState} from 'react'
import {format} from 'date-fns'
import AdminPageFrame from '../../components/layout/admin/AdminPageFrame'
import ShadcnDataTable from '../../components/common/ShadcnDataTable'
import {Badge} from '../../components/ui/badge'
import service from '../../service'
import {formatUtcToLocal} from '../../util/dateTimeUtil'

const today = format(new Date(), 'yyyy-MM-dd')

export default function HotDealItemsPage() {
    const [siteOptions, setSiteOptions] = useState([])

    useEffect(() => {
        service.hotDeal.getAllSites().then(sites => {
            setSiteOptions((sites ?? []).map(s => ({value: String(s.id), label: s.siteName})))
        }).catch(() => {})
    }, [])

    const fetchItems = useCallback((searchRequest) =>
        service.hotDeal.searchItems({searchRequest}), [])

    const columns = useMemo(() => [
        {
            accessorKey: 'siteName',
            header: '사이트',
            size: 140,
            mobileLabel: '사이트',
        },
        {
            accessorKey: 'title',
            header: '제목',
            grow: true,
            mobilePrimary: true,
            mobileLabel: '��목',
            cell: ({value, row}) => (
                <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 hover:text-sky-800 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {value}
                </a>
            ),
        },
        {
            accessorKey: 'price',
            header: '가격',
            size: 200,
            mobileLabel: '가격',
        },
        {
            accessorKey: 'recommendationCount',
            header: '추천',
            size: 80,
            mobileHidden: true,
            cellAlign: 'right',
        },
        {
            accessorKey: 'unrecommendationCount',
            header: '비추천',
            size: 80,
            mobileHidden: true,
            cellAlign: 'right',
        },
        {
            accessorKey: 'viewCount',
            header: '조회',
            size: 80,
            mobileHidden: true,
            cellAlign: 'right',
        },
        {
            accessorKey: 'commentCount',
            header: '댓글',
            size: 80,
            mobileHidden: true,
            cellAlign: 'right',
        },
        {
            accessorKey: 'notified',
            header: '알림',
            size: 80,
            mobileLabel: '알림',
            cell: ({value}) => (
                <Badge variant={value ? 'success' : 'secondary'}>
                    {value ? '발송' : '미발송'}
                </Badge>
            ),
        },
        {
            accessorKey: 'scrapedAt',
            header: '스크래핑일시',
            size: 200,
            mobileHidden: true,
            cell: ({value}) => formatUtcToLocal(value, 'yyyy-MM-dd HH:mm:ss'),
        },
    ], [])

    const searchFields = useMemo(() => [
        {
            type: 'dateRange',
            fromName: 'scrapedAtFrom',
            toName: 'scrapedAtTo',
            fromLabel: '시작일',
            toLabel: '종료일',
            pinned: true,
        },
        {
            name: 'siteId',
            label: '사이트',
            type: 'select',
            pinned: true,
            options: siteOptions,
        },
        {name: 'title', label: '제목'},
        {
            name: 'notified',
            label: '알림 상태',
            type: 'select',
            options: [
                {value: 'true', label: '발송'},
                {value: 'false', label: '미발송'},
            ],
        },
        {name: 'dealCategory', label: '딜 카테고리'},
    ], [siteOptions])

    return (
        <AdminPageFrame>
            <div className="admin-panel admin-table-shell">
                <ShadcnDataTable
                    columns={columns}
                    fetchData={fetchItems}
                    searchFields={searchFields}
                    defaultSearchParams={{scrapedAtFrom: today, scrapedAtTo: today}}
                    defaultPageSize={25}
                    enableDynamicSearch={true}
                />
            </div>
        </AdminPageFrame>
    )
}
