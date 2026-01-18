import React, {useState, useCallback, useMemo} from 'react'
import {Box, Typography, Chip} from '@mui/material'
import MRTTable from '../../components/common/MRTTable'
import DetailDialog from '../../components/common/DetailDialog'
import logService from '../../service/logService'
import {formatUtcToLocal} from '../../util/dateTimeUtil'

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

  const truncateText = useCallback((text, maxLength = 50) => {
    if (!text) return '-'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }, [])

  // fetchData 메모이제이션: Dialog 상태 변경 시 재검색 방지
  const fetchApiLogs = useCallback((searchRequest) =>
    logService.searchApiLogs({searchRequest}),
    []
  )

  // MRT 컬럼 정의 (메모이제이션)
  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 150,
      muiTableBodyCellProps: {align: 'right'},
    },
    {
      accessorKey: 'traceId',
      header: 'Trace ID',
      size: 300,
    },
    {
      accessorKey: 'requestUri',
      header: 'Request URI',
      grow: true,
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
      accessorKey: 'responseStatus',
      header: 'Response Status',
      size: 150,
      Cell: ({cell}) => {
        const statusCode = parseInt(cell.getValue())
        let color = 'default'
        if (statusCode >= 200 && statusCode < 300) color = 'success'
        else if (statusCode >= 300 && statusCode < 400) color = 'info'
        else if (statusCode >= 400 && statusCode < 500) color = 'warning'
        else if (statusCode >= 500) color = 'error'

        return (
            <Chip
                label={cell.getValue()}
                size="small"
                color={color}
            />
        )
      },
    },
    {
      accessorKey: 'requestHeader',
      header: 'Request Header',
      size: 200,
      Cell: ({cell}) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Request Header', cell.getValue())}
          >
            {truncateText(cell.getValue())}
          </div>
      ),
    },
    {
      accessorKey: 'requestParam',
      header: 'Request Param',
      size: 300,
      Cell: ({cell}) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Request Param', cell.getValue())}
          >
            {truncateText(cell.getValue())}
          </div>
      ),
    },
    {
      accessorKey: 'requestBody',
      header: 'Request Body',
      size: 300,
      Cell: ({cell}) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Request Body', cell.getValue())}
          >
            {truncateText(cell.getValue())}
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
      accessorKey: 'processTime',
      header: 'Process Time (ms)',
      size: 150,
      muiTableBodyCellProps: {align: 'right'},
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
      <Box sx={{p: 3}}>
        <Typography variant="h4" sx={{mb: 3}}>
          API 로그
        </Typography>
        <Box sx={{width: '85vw', mx: 'auto'}}>
          <MRTTable
              columns={columns}
              fetchData={fetchApiLogs}
              searchFields={searchFields}
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
