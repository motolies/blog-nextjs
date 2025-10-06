import React, {useState, useCallback, useMemo} from 'react'
import {Box, Typography, Chip} from '@mui/material'
import DataGridTable from '../../components/common/DataGridTable'
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

  // DataGrid 컬럼 정의 (메모이제이션)
  const columns = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 150,
      type: 'number',
    },
    {
      field: 'traceId',
      headerName: 'Trace ID',
      width: 300,
    },
    // {
    //   field: 'spanId',
    //   headerName: 'Span ID',
    //   width: 150,
    // },
    {
      field: 'requestUri',
      headerName: 'Request URI',
      flex: 1,
    },
    {
      field: 'httpMethodType',
      headerName: 'HTTP Method',
      width: 120,
      renderCell: (params) => (
          <Chip
              label={params.value}
              size="small"
              color={
                params.value === 'GET' ? 'primary' :
                    params.value === 'POST' ? 'success' :
                        params.value === 'PUT' ? 'warning' :
                            params.value === 'DELETE' ? 'error' : 'default'
              }
          />
      ),
    },
    {
      field: 'responseStatus',
      headerName: 'Response Status',
      width: 150,
      renderCell: (params) => {
        const statusCode = parseInt(params.value)
        let color = 'default'
        if (statusCode >= 200 && statusCode < 300) color = 'success'
        else if (statusCode >= 300 && statusCode < 400) color = 'info'
        else if (statusCode >= 400 && statusCode < 500) color = 'warning'
        else if (statusCode >= 500) color = 'error'

        return (
            <Chip
                label={params.value}
                size="small"
                color={color}
            />
        )
      },
    },
    {
      field: 'requestHeader',
      headerName: 'Request Header',
      width: 200,
      renderCell: (params) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Request Header', params.value)}
          >
            {truncateText(params.value)}
          </div>
      ),
    },
    {
      field: 'requestParam',
      headerName: 'Request Param',
      width: 300,
      renderCell: (params) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Request Param', params.value)}
          >
            {truncateText(params.value)}
          </div>
      ),
    },
    {
      field: 'requestBody',
      headerName: 'Request Body',
      width: 300,
      renderCell: (params) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Request Body', params.value)}
          >
            {truncateText(params.value)}
          </div>
      ),
    },
    {
      field: 'responseBody',
      headerName: 'Response Body',
      width: 300,
      renderCell: (params) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Response Body', params.value)}
          >
            {truncateText(params.value)}
          </div>
      ),
    },
    {
      field: 'processTime',
      headerName: 'Process Time (ms)',
      width: 150,
      type: 'number',
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 200,
      valueFormatter: (value) => formatUtcToLocal(value),
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
          <DataGridTable
              columns={columns}
              fetchData={(searchRequest) => logService.searchApiLogs(
                  {searchRequest})}
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
