import React, {useCallback, useState} from 'react'
import {Box, Chip, Typography} from '@mui/material'
import DataGridTable from '../../components/common/DataGridTable'
import DetailDialog from '../../components/common/DetailDialog'
import logService from '../../service/logService'
import {formatUtcToLocal} from '../../util/dateTimeUtil'

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

  // DataGrid 컬럼 정의 (메모이제이션)
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 150,
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
      width: 400,

    },
    // {
    //   field: 'controllerName',
    //   headerName: 'Controller',
    //   width: 200,
    // },
    {
      field: 'methodName',
      headerName: 'Method',
      width: 300,
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
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
          <Chip
              label={params.value}
              size="small"
              color={params.value === 'SUCC' ? 'success' : 'error'}
          />
      ),
    },

    {
      field: 'paramData',
      headerName: 'Param Data',
      flex: 1,
      renderCell: (params) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Param Data', params.value)}
          >
            {truncateText(params.value, 150)}
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
      field: 'stackTrace',
      headerName: 'Stack Trace',
      width: 300,
      renderCell: (params) => (
          <div
              style={{cursor: 'pointer', color: '#1976d2'}}
              onClick={() => handleDetailClick('Stack Trace', params.value)}
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
      field: 'remoteAddr',
      headerName: 'Remote IP',
      width: 150,
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 200,
      valueFormatter: (value) => formatUtcToLocal(value),
    },
  ]

  // 검색 필드 정의
  const searchFields = [
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
        <DataGridTable
            columns={columns}
            fetchData={(searchRequest) => logService.searchSystemLogs(
                {searchRequest})}
            searchFields={searchFields}
            defaultPageSize={25}
        />
        <DetailDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title={dialogTitle}
            content={dialogContent}
        />
      </Box>
  )
}
