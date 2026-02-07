import React, {useCallback, useMemo, useState} from 'react'
import moment from 'moment'
import {Box, Chip, Typography} from '@mui/material'
import MRTTable from '../../components/common/MRTTable'
import DetailDialog from '../../components/common/DetailDialog'
import logService from '../../service/logService'
import {formatUtcToLocal} from '../../util/dateTimeUtil'

const today = moment().format('YYYY-MM-DD')

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

  const truncateText = useCallback((text, maxLength = 50) => {
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
    logService.searchSystemLogs({searchRequest}),
    []
  )

  // MRT 컬럼 정의 (메모이제이션)
  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 150,
    },
    {
      accessorKey: 'traceId',
      header: 'Trace ID',
      size: 300,
    },
    {
      accessorKey: 'requestUri',
      header: 'Request URI',
      size: 400,
    },
    {
      accessorKey: 'methodName',
      header: 'Method',
      size: 300,
    },
    {
      accessorKey: 'httpMethodType',
      header: 'HTTP Method',
      size: 120,
      Cell: ({cell}) => (
          <Chip
              label={cell.getValue()}
              size="small"
              color={
                cell.getValue() === 'GET' ? 'primary' :
                    cell.getValue() === 'POST' ? 'success' :
                        cell.getValue() === 'PUT' ? 'warning' :
                            cell.getValue() === 'DELETE' ? 'error' : 'default'
              }
          />
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      Cell: ({cell}) => (
          <Chip
              label={cell.getValue()}
              size="small"
              color={cell.getValue() === 'SUCC' ? 'success' : 'error'}
          />
      ),
    },
    {
      accessorKey: 'paramData',
      header: 'Param Data',
      grow: true,
      Cell: ({cell}) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Param Data', cell.getValue())}
          >
            {truncateText(cell.getValue(), 150)}
          </div>
      ),
    },
    {
      accessorKey: 'responseBody',
      header: 'Response Body',
      size: 300,
      Cell: ({cell}) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Response Body', cell.getValue())}
          >
            {truncateText(cell.getValue())}
          </div>
      ),
    },
    {
      accessorKey: 'stackTrace',
      header: 'Stack Trace',
      size: 300,
      Cell: ({cell}) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Stack Trace', cell.getValue())}
          >
            {truncateText(cell.getValue())}
          </div>
      ),
    },
    {
      accessorKey: 'processTime',
      header: 'Process Time (ms)',
      size: 150,
      muiTableBodyCellProps: {align: 'right'},
    },
    {
      accessorKey: 'remoteAddr',
      header: 'Remote IP',
      size: 150,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 200,
      Cell: ({cell}) => formatUtcToLocal(cell.getValue()),
    },
  ], [handleDetailClick, truncateText])

  // 검색 필드 정의
  const searchFields = [
    {type: 'dateRange', fromName: 'createdAtFrom', toName: 'createdAtTo', fromLabel: '시작일', toLabel: '종료일'},
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
      <Box sx={{p: 3}}>
        <Typography variant="h4" sx={{mb: 3}}>
          시스템 로그
        </Typography>
        <Box sx={{width: '85vw', mx: 'auto'}}>
          <MRTTable
              columns={columns}
              fetchData={fetchSystemLogs}
              searchFields={searchFields}
              defaultSearchParams={{createdAtFrom: today, createdAtTo: today}}
              defaultPageSize={25}
          />
        </Box>
        <DetailDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title={dialogTitle}
            content={dialogContent}
        />
      </Box>
  )
}
