import React, {useState, useCallback, useMemo} from 'react'
import {format} from 'date-fns'
import ShadcnDataTable from '../../components/common/ShadcnDataTable'
import {Badge} from '../../components/ui/badge'
import DetailDialog from '../../components/common/DetailDialog'
import service from '../../service'
import {formatUtcToLocal} from '../../util/dateTimeUtil'
import AdminPageFrame from '../../components/layout/admin/AdminPageFrame'

const today = format(new Date(), 'yyyy-MM-dd')

export default function ApiLog() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogContent, setDialogContent] = useState('')

  // 메모이제이션: 재검색 방지
  const handleDetailClick = useCallback((title, content) => {
    setDialogTitle(title)
    setDialogContent(content)
    setDialogOpen(true)
  }, [])

  const truncateText = useCallback((text, maxLength = 20) => {
    if (!text) return '-'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }, [])

  // fetchData 메모이제이션: Dialog 상태 변경 시 재검색 방지
  const fetchApiLogs = useCallback((searchRequest) =>
    service.log.searchApiLogs({searchRequest}),
    []
  )

  // 컬럼 정의
  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 130,
      mobileHidden: true,
    },
    {
      accessorKey: 'traceId',
      header: 'Trace ID',
      size: 260,
      mobileHidden: true,
    },
    {
      accessorKey: 'requestUri',
      header: 'Request URI',
      grow: true,
      size: 260,
      mobilePrimary: true,
      mobileLabel: 'Request',
    },
    {
      accessorKey: 'httpMethodType',
      header: 'HTTP Method',
      size: 120,
      mobileLabel: 'HTTP',
      cell: ({value}) => {
        const method = value
        const variant = method === 'GET' ? 'info' :
          method === 'POST' ? 'success' :
          method === 'PUT' ? 'warning' :
          method === 'DELETE' ? 'error' : 'secondary'
        return <Badge variant={variant}>{method}</Badge>
      },
    },
    {
      accessorKey: 'responseStatus',
      header: 'Response Status',
      size: 150,
      mobileLabel: 'Status',
      cell: ({value}) => {
        const statusCode = parseInt(value)
        let variant = 'secondary'
        if (statusCode >= 200 && statusCode < 300) variant = 'success'
        else if (statusCode >= 300 && statusCode < 400) variant = 'info'
        else if (statusCode >= 400 && statusCode < 500) variant = 'warning'
        else if (statusCode >= 500) variant = 'error'
        return <Badge variant={variant}>{value}</Badge>
      },
    },
    {
      accessorKey: 'requestHeader',
      header: 'Request Header',
      size: 200,
      mobileLabel: 'Headers',
      cell: ({value}) => (
          <div
              className="cursor-pointer text-sky-700 hover:text-sky-800"
              onClick={() => handleDetailClick('Request Header', value)}
          >
            {truncateText(value)}
          </div>
      ),
    },
    {
      accessorKey: 'requestParam',
      header: 'Request Param',
      size: 300,
      mobileLabel: 'Params',
      cell: ({value}) => (
          <div
              className="cursor-pointer text-sky-700 hover:text-sky-800"
              onClick={() => handleDetailClick('Request Param', value)}
          >
            {truncateText(value)}
          </div>
      ),
    },
    {
      accessorKey: 'requestBody',
      header: 'Request Body',
      size: 300,
      mobileLabel: 'Body',
      cell: ({value}) => (
          <div
              className="cursor-pointer text-sky-700 hover:text-sky-800"
              onClick={() => handleDetailClick('Request Body', value)}
          >
            {truncateText(value)}
          </div>
      ),
    },
    {
      accessorKey: 'responseBody',
      header: 'Response Body',
      size: 300,
      mobileLabel: 'Response',
      cell: ({value}) => (
          <div
              className="cursor-pointer text-sky-700 hover:text-sky-800"
              onClick={() => handleDetailClick('Response Body', value)}
          >
            {truncateText(value)}
          </div>
      ),
    },
    {
      accessorKey: 'processTime',
      header: 'Process Time (ms)',
      size: 160,
      mobileLabel: 'Time',
      cellAlign: 'right',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 200,
      mobileLabel: 'Created',
      cell: ({value}) => formatUtcToLocal(value),
    },
  ], [handleDetailClick, truncateText])

  // 검색 필드 정의
  const searchFields = [
    {type: 'dateRange', fromName: 'createdAtFrom', toName: 'createdAtTo', fromLabel: '시작일', toLabel: '종료일', pinned: true},
    {name: 'traceId', label: 'Trace ID'},
    {name: 'spanId', label: 'Span ID'},
    {name: 'requestUri', label: 'Request URI'},
    {name: 'httpMethodType', label: 'HTTP Method'},
    {name: 'requestHeader', label: 'Request Header'},
    {name: 'requestParam', label: 'Request Param'},
    {name: 'requestBody', label: 'Request Body'},
    {name: 'responseStatus', label: 'Response Status'},
    {name: 'responseBody', label: 'Response Body'},
  ]

  return (
      <AdminPageFrame>
        <div className="admin-panel admin-table-shell">
          <ShadcnDataTable
              columns={columns}
              fetchData={fetchApiLogs}
              searchFields={searchFields}
              defaultSearchParams={{createdAtFrom: today, createdAtTo: today}}
              defaultPageSize={25}
              enableDynamicSearch={true}
          />
        </div>
        <DetailDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title={dialogTitle}
            content={dialogContent}
        />
      </AdminPageFrame>
  )
}
