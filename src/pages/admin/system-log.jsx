import React, {useCallback, useMemo, useState} from 'react'
import {format} from 'date-fns'
import ShadcnDataTable from '../../components/common/ShadcnDataTable'
import {Badge} from '../../components/ui/badge'
import DetailDialog from '../../components/common/DetailDialog'
import service from '../../service'
import {formatUtcToLocal} from '../../util/dateTimeUtil'
import AdminPageFrame from '../../components/layout/admin/AdminPageFrame'

const today = format(new Date(), 'yyyy-MM-dd')

export default function SystemLog() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogContent, setDialogContent] = useState('')

  // 메모이제이션: 재검색 방지
  const handleDetailClick = useCallback((title, content) => {
    setDialogTitle(title)
    setDialogContent(content)
    setDialogOpen(true)
  }, [])

  const truncateText = useCallback((text, maxLength = 30) => {
    if (!text) {
      return '-'
    }
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength) + '...'
  }, [])

  // fetchData 메모이제이션: Dialog 상태 변경 시 재검색 방지
  const fetchSystemLogs = useCallback((searchRequest) =>
    service.log.searchSystemLogs({searchRequest}),
    []
  )

  // 테이블 컬럼 정의
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
      size: 300,
      mobilePrimary: true,
      mobileLabel: 'Request',
    },
    {
      accessorKey: 'methodName',
      header: 'Method',
      size: 200,
      mobileLabel: 'Method',
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
      accessorKey: 'status',
      header: 'Status',
      size: 80,
      mobileLabel: 'Status',
      cell: ({value}) => (
        <Badge variant={value === 'SUCC' ? 'success' : 'error'}>
          {value}
        </Badge>
      ),
    },
    {
      accessorKey: 'paramData',
      header: 'Param Data',
      grow: true,
      size: 300,
      mobileLabel: 'Params',
      cell: ({value}) => (
          <div
              className="cursor-pointer text-sky-700 hover:text-sky-800"
              onClick={() => handleDetailClick('Param Data', value)}
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
      accessorKey: 'stackTrace',
      header: 'Stack Trace',
      size: 300,
      mobileLabel: 'Stack',
      cell: ({value}) => (
          <div
              className="cursor-pointer text-sky-700 hover:text-sky-800"
              onClick={() => handleDetailClick('Stack Trace', value)}
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
      accessorKey: 'remoteAddr',
      header: 'Remote IP',
      size: 120,
      mobileLabel: 'IP',
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
    {name: 'controllerName', label: 'Controller'},
    {name: 'methodName', label: 'Method'},
    {name: 'httpMethodType', label: 'HTTP Method'},
    {name: 'paramData', label: 'Param Data'},
    {name: 'responseBody', label: 'Response Body'},
    {name: 'stackTrace', label: 'Stack Trace'},
    {name: 'remoteAddr', label: 'Remote IP'},
  ]

  return (
    <AdminPageFrame>
      <div className="admin-panel admin-table-shell">
        <ShadcnDataTable
          columns={columns}
          fetchData={fetchSystemLogs}
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
