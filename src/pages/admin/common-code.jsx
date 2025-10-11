import React, {useState, useEffect, useCallback} from 'react'
import {
  Box,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Paper,
  Toolbar,
  Stack,
  CircularProgress
} from '@mui/material'
import {
  GridActionsCellItem
} from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  AccountTree as TreeIcon,
  Class as ClassIcon,
  Code as CodeIcon
} from '@mui/icons-material'
import HierarchicalTreeView from '../../components/common/HierarchicalTreeView'
import DataGridTable from '../../components/common/DataGridTable'
import commonCodeService from '../../service/commonCodeService'

export default function CommonCode() {
  // 상태 선언
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [gridRows, setGridRows] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState(null) // 'addClass', 'addCode', 'addChildClass', 'editClass', 'editCode'
  const [snackbar, setSnackbar] = useState(
      {open: false, message: '', severity: 'info'})
  const [searchQuery, setSearchQuery] = useState('')

  // 다이얼로그 폼 상태
  const [formData, setFormData] = useState({
    // 클래스 필드
    name: '',
    displayName: '',
    description: '',
    attribute1Name: '',
    attribute2Name: '',
    attribute3Name: '',
    attribute4Name: '',
    attribute5Name: '',
    isActive: true,
    // 코드 필드
    className: '',
    code: '',
    attribute1Value: '',
    attribute2Value: '',
    attribute3Value: '',
    attribute4Value: '',
    attribute5Value: '',
    childClassName: '',
    sort: 0,
    // 하위 클래스 추가용
    parentCodeNode: null
  })

  // 데이터 로드 함수
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const hierarchicalData = await commonCodeService.loadHierarchicalTree()
      setTreeData(hierarchicalData || [])

      // 첫 번째 클래스 자동 선택
      if (hierarchicalData && hierarchicalData.length > 0) {
        const firstClass = hierarchicalData[0]
        setSelectedNode(firstClass)
        setSelectedNodeId(firstClass.id)
        handleNodeSelectLogic(firstClass, 'class')
      }
    } catch (error) {
      console.error('공통코드 데이터 로드 실패:', error)
      setSnackbar({
        open: true,
        message: `데이터 로드 실패: ${error.message}`,
        severity: 'error'
      })
      setTreeData([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    loadData()
  }, [loadData])

  // 노드 선택 핸들러 로직
  const handleNodeSelectLogic = (node, type) => {
    const rows = []

    if (type === 'class') {
      // 클래스를 선택하면: 클래스 + 해당 코드들 표시
      rows.push({...node, id: node.id, type: 'class'})
      if (node.codes && Array.isArray(node.codes)) {
        node.codes.forEach(code => {
          rows.push({...code, id: code.id, type: 'code'})
        })
      }
    } else if (type === 'code') {
      // 코드를 선택하면: 코드 + 하위 클래스(있으면) 표시
      rows.push({...node, id: node.id, type: 'code'})
      if (node.childClass) {
        rows.push({...node.childClass, id: node.childClass.id, type: 'class'})
      }
    }

    setGridRows(rows)
  }

  // 노드 선택 핸들러
  const handleNodeSelect = useCallback((node, type) => {
    setSelectedNode(node)
    setSelectedNodeId(node.id)
    handleNodeSelectLogic(node, type)
  }, [])

  // 검색 필터링된 그리드 행
  const filteredGridRows = React.useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return gridRows
    }

    const query = searchQuery.toLowerCase()
    return gridRows.filter(row => {
      if (row.type === 'class') {
        return (
            row.name?.toLowerCase().includes(query) ||
            row.displayName?.toLowerCase().includes(query) ||
            row.description?.toLowerCase().includes(query)
        )
      } else {
        return (
            row.code?.toLowerCase().includes(query) ||
            row.name?.toLowerCase().includes(query) ||
            row.description?.toLowerCase().includes(query) ||
            row.className?.toLowerCase().includes(query)
        )
      }
    })
  }, [gridRows, searchQuery])

  // 클래스 추가
  const handleAddClassClick = () => {
    setDialogMode('addClass')
    setFormData({
      name: '',
      displayName: '',
      description: '',
      attribute1Name: '',
      attribute2Name: '',
      attribute3Name: '',
      attribute4Name: '',
      attribute5Name: '',
      isActive: true,
      className: '',
      code: '',
      attribute1Value: '',
      attribute2Value: '',
      attribute3Value: '',
      attribute4Value: '',
      attribute5Value: '',
      childClassName: '',
      sort: 0,
      parentCodeNode: null
    })
    setOpenDialog(true)
  }

  // 코드 추가 (클래스 선택 시)
  const handleAddCodeClick = (row) => () => {
    if (row.type !== 'class') {
      setSnackbar({
        open: true,
        message: '클래스를 선택한 후 코드를 추가할 수 있습니다.',
        severity: 'warning'
      })
      return
    }

    setDialogMode('addCode')
    setFormData({
      name: '',
      displayName: '',
      description: '',
      attribute1Name: '',
      attribute2Name: '',
      attribute3Name: '',
      attribute4Name: '',
      attribute5Name: '',
      isActive: true,
      className: row.name,
      code: '',
      attribute1Value: '',
      attribute2Value: '',
      attribute3Value: '',
      attribute4Value: '',
      attribute5Value: '',
      childClassName: '',
      sort: 0,
      parentCodeNode: null
    })
    setOpenDialog(true)
  }

  // 하위 클래스 추가 (코드 선택 시)
  const handleAddChildClassClick = (row) => () => {
    if (row.type !== 'code') {
      setSnackbar({
        open: true,
        message: '코드를 선택한 후 하위 클래스를 추가할 수 있습니다.',
        severity: 'warning'
      })
      return
    }

    setDialogMode('addChildClass')
    setFormData({
      name: '',
      displayName: '',
      description: '',
      attribute1Name: '',
      attribute2Name: '',
      attribute3Name: '',
      attribute4Name: '',
      attribute5Name: '',
      isActive: true,
      className: '',
      code: '',
      attribute1Value: '',
      attribute2Value: '',
      attribute3Value: '',
      attribute4Value: '',
      attribute5Value: '',
      childClassName: '',
      sort: 0,
      parentCodeNode: row
    })
    setOpenDialog(true)
  }

  // 편집
  const handleEditClick = (row) => () => {
    setDialogMode(row.type === 'class' ? 'editClass' : 'editCode')

    if (row.type === 'class') {
      setFormData({
        name: row.name,
        displayName: row.displayName,
        description: row.description,
        attribute1Name: row.attribute1Name || '',
        attribute2Name: row.attribute2Name || '',
        attribute3Name: row.attribute3Name || '',
        attribute4Name: row.attribute4Name || '',
        attribute5Name: row.attribute5Name || '',
        isActive: row.isActive,
        className: '',
        code: '',
        attribute1Value: '',
        attribute2Value: '',
        attribute3Value: '',
        attribute4Value: '',
        attribute5Value: '',
        childClassName: '',
        sort: 0,
        parentCodeNode: null
      })
    } else {
      setFormData({
        name: row.name,
        displayName: '',
        description: row.description,
        attribute1Name: '',
        attribute2Name: '',
        attribute3Name: '',
        attribute4Name: '',
        attribute5Name: '',
        isActive: row.isActive,
        className: row.className,
        code: row.code,
        attribute1Value: row.attribute1Value || '',
        attribute2Value: row.attribute2Value || '',
        attribute3Value: row.attribute3Value || '',
        attribute4Value: row.attribute4Value || '',
        attribute5Value: row.attribute5Value || '',
        childClassName: row.childClassName || '',
        sort: row.sort || 0,
        parentCodeNode: null
      })
    }
    setOpenDialog(true)
  }

  // 삭제
  const handleDeleteClick = (row) => () => {
    const confirmMessage = row.type === 'class'
        ? `클래스 "${row.name}"를 삭제하시겠습니까?`
        : `코드 "${row.name}"를 삭제하시겠습니까?`

    if (confirm(confirmMessage)) {
      handleDelete(row)
    }
  }

  const handleDelete = async (row) => {
    try {
      setLoading(true)

      if (row.type === 'class') {
        await commonCodeService.deleteClass(row.name)
      } else {
        await commonCodeService.deleteCode(row.className, row.code)
      }

      setSnackbar({
        open: true,
        message: `${row.type === 'class' ? '클래스' : '코드'}가 성공적으로 삭제되었습니다.`,
        severity: 'success'
      })
      await loadData()
    } catch (error) {
      setSnackbar({
        open: true,
        message: `삭제 실패: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 저장
  const handleSave = async () => {
    try {
      setLoading(true)

      if (dialogMode === 'addClass') {
        await commonCodeService.createClass({
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          attribute1Name: formData.attribute1Name || null,
          attribute2Name: formData.attribute2Name || null,
          attribute3Name: formData.attribute3Name || null,
          attribute4Name: formData.attribute4Name || null,
          attribute5Name: formData.attribute5Name || null,
          isActive: formData.isActive
        })
        setSnackbar({
          open: true,
          message: '클래스가 성공적으로 생성되었습니다.',
          severity: 'success'
        })
      } else if (dialogMode === 'addCode') {
        await commonCodeService.createCode({
          className: formData.className,
          code: formData.code,
          name: formData.name,
          description: formData.description,
          attribute1Value: formData.attribute1Value || null,
          attribute2Value: formData.attribute2Value || null,
          attribute3Value: formData.attribute3Value || null,
          attribute4Value: formData.attribute4Value || null,
          attribute5Value: formData.attribute5Value || null,
          childClassName: formData.childClassName || null,
          sort: formData.sort,
          isActive: formData.isActive
        })
        setSnackbar({
          open: true,
          message: '코드가 성공적으로 생성되었습니다.',
          severity: 'success'
        })
      } else if (dialogMode === 'addChildClass') {
        // 1단계: 하위 클래스 생성
        await commonCodeService.createClass({
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          attribute1Name: formData.attribute1Name || null,
          attribute2Name: formData.attribute2Name || null,
          attribute3Name: formData.attribute3Name || null,
          attribute4Name: formData.attribute4Name || null,
          attribute5Name: formData.attribute5Name || null,
          isActive: formData.isActive
        })

        // 2단계: 부모 코드의 childClassName 업데이트
        await commonCodeService.updateCode(
            formData.parentCodeNode.className,
            formData.parentCodeNode.code,
            {
              ...formData.parentCodeNode,
              childClassName: formData.name
            }
        )

        setSnackbar({
          open: true,
          message: '하위 클래스가 성공적으로 생성되었습니다.',
          severity: 'success'
        })
      } else if (dialogMode === 'editClass') {
        await commonCodeService.updateClass(formData.name, {
          displayName: formData.displayName,
          description: formData.description,
          attribute1Name: formData.attribute1Name || null,
          attribute2Name: formData.attribute2Name || null,
          attribute3Name: formData.attribute3Name || null,
          attribute4Name: formData.attribute4Name || null,
          attribute5Name: formData.attribute5Name || null,
          isActive: formData.isActive
        })
        setSnackbar({
          open: true,
          message: '클래스가 성공적으로 수정되었습니다.',
          severity: 'success'
        })
      } else if (dialogMode === 'editCode') {
        await commonCodeService.updateCode(formData.className, formData.code, {
          name: formData.name,
          description: formData.description,
          attribute1Value: formData.attribute1Value || null,
          attribute2Value: formData.attribute2Value || null,
          attribute3Value: formData.attribute3Value || null,
          attribute4Value: formData.attribute4Value || null,
          attribute5Value: formData.attribute5Value || null,
          childClassName: formData.childClassName || null,
          sort: formData.sort,
          isActive: formData.isActive
        })
        setSnackbar({
          open: true,
          message: '코드가 성공적으로 수정되었습니다.',
          severity: 'success'
        })
      }

      setOpenDialog(false)
      await loadData()
    } catch (error) {
      setSnackbar({
        open: true,
        message: `저장 실패: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // DataGrid 컬럼 정의
  const columns = [
    {
      field: 'type',
      headerName: '타입',
      width: 100,
      renderCell: (params) => {
        return params.value === 'class' ? (
            <Chip icon={<ClassIcon/>} label="클래스" size="small" color="primary"/>
        ) : (
            <Chip icon={<CodeIcon/>} label="코드" size="small" color="secondary"/>
        )
      }
    },
    {
      field: 'identifier',
      headerName: '식별자',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const {row} = params
        return row.type === 'class' ? row.name : `${row.className}.${row.code}`
      }
    },
    {
      field: 'displayName',
      headerName: '표시명/코드명',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const {row} = params
        return row.type === 'class' ? row.displayName : row.name
      }
    },
    {
      field: 'description',
      headerName: '설명',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'isActive',
      headerName: '활성',
      width: 80,
      type: 'boolean',
      renderCell: (params) => (
          <Chip
              label={params.value ? '활성' : '비활성'}
              size="small"
              color={params.value ? 'success' : 'default'}
          />
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '액션',
      width: 120,
      getActions: ({row}) => {
        const actions = [
          <GridActionsCellItem
              icon={<EditIcon/>}
              label="편집"
              onClick={handleEditClick(row)}
              color="inherit"
          />,
          <GridActionsCellItem
              icon={<DeleteIcon/>}
              label="삭제"
              onClick={handleDeleteClick(row)}
              color="inherit"
          />
        ]

        if (row.type === 'class') {
          actions.unshift(
              <GridActionsCellItem
                  icon={<AddIcon/>}
                  label="코드 추가"
                  onClick={handleAddCodeClick(row)}
                  color="inherit"
              />
          )
        } else if (row.type === 'code') {
          actions.unshift(
              <GridActionsCellItem
                  icon={<TreeIcon/>}
                  label="하위 클래스 추가"
                  onClick={handleAddChildClassClick(row)}
                  color="inherit"
              />
          )
        }

        return actions
      },
    },
  ]

  // 다이얼로그 폼 렌더링
  const renderDialogContent = () => {
    const isClass = dialogMode === 'addClass' || dialogMode === 'addChildClass'
        || dialogMode === 'editClass'

    return (
        <Stack spacing={3}>
          {dialogMode === 'addChildClass' && (
              <Alert severity="info">
                부모
                코드: <strong>{formData.parentCodeNode?.className} - {formData.parentCodeNode?.code} ({formData.parentCodeNode?.name})</strong>
                <br/>
                이 코드의 하위 클래스로 새로운 클래스가 생성됩니다.
              </Alert>
          )}

          {isClass ? (
              // 클래스 폼
              <>
                <TextField
                    label="클래스명"
                    value={formData.name}
                    onChange={(e) => setFormData(
                        prev => ({...prev, name: e.target.value}))}
                    required
                    disabled={dialogMode === 'editClass'}
                    fullWidth
                    helperText="영문 대문자와 밑줄(_)만 사용"
                />
                <TextField
                    label="표시명"
                    value={formData.displayName}
                    onChange={(e) => setFormData(
                        prev => ({...prev, displayName: e.target.value}))}
                    required
                    fullWidth
                />
                <TextField
                    label="설명"
                    value={formData.description}
                    onChange={(e) => setFormData(
                        prev => ({...prev, description: e.target.value}))}
                    multiline
                    rows={3}
                    fullWidth
                />

                <Typography variant="h6">속성 정의</Typography>
                {[1, 2, 3, 4, 5].map(num => (
                    <TextField
                        key={num}
                        label={`속성${num} 이름`}
                        value={formData[`attribute${num}Name`]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          [`attribute${num}Name`]: e.target.value
                        }))}
                        fullWidth
                    />
                ))}

                <FormControlLabel
                    control={
                      <Switch
                          checked={formData.isActive}
                          onChange={(e) => setFormData(
                              prev => ({...prev, isActive: e.target.checked}))}
                      />
                    }
                    label="활성화"
                />
              </>
          ) : (
              // 코드 폼
              <>
                <TextField
                    label="클래스명"
                    value={formData.className}
                    disabled
                    fullWidth
                />
                <TextField
                    label="코드값"
                    value={formData.code}
                    onChange={(e) => setFormData(
                        prev => ({...prev, code: e.target.value}))}
                    required
                    disabled={dialogMode === 'editCode'}
                    fullWidth
                    helperText="영문 대문자와 밑줄(_)만 사용"
                />
                <TextField
                    label="코드명"
                    value={formData.name}
                    onChange={(e) => setFormData(
                        prev => ({...prev, name: e.target.value}))}
                    required
                    fullWidth
                />
                <TextField
                    label="설명"
                    value={formData.description}
                    onChange={(e) => setFormData(
                        prev => ({...prev, description: e.target.value}))}
                    multiline
                    rows={3}
                    fullWidth
                />

                <Typography variant="h6">속성 값</Typography>
                {[1, 2, 3, 4, 5].map(num => (
                    <TextField
                        key={num}
                        label={`속성${num} 값`}
                        value={formData[`attribute${num}Value`]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          [`attribute${num}Value`]: e.target.value
                        }))}
                        fullWidth
                    />
                ))}

                <TextField
                    label="하위 클래스명"
                    value={formData.childClassName}
                    onChange={(e) => setFormData(
                        prev => ({...prev, childClassName: e.target.value}))}
                    placeholder="재귀 구조용 (선택사항)"
                    fullWidth
                />

                <TextField
                    label="정렬순서"
                    type="number"
                    value={formData.sort}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sort: parseInt(e.target.value) || 0
                    }))}
                    fullWidth
                />

                <FormControlLabel
                    control={
                      <Switch
                          checked={formData.isActive}
                          onChange={(e) => setFormData(
                              prev => ({...prev, isActive: e.target.checked}))}
                      />
                    }
                    label="활성화"
                />
              </>
          )}
        </Stack>
    )
  }

  return (
      <Box sx={{m: 2}}>
        {/* 상단 툴바 */}
        <Paper sx={{p: 2, mb: 2}}>
          <Toolbar sx={{pl: 0, pr: 0, gap: 2}}>
            <Typography variant="h4" component="h1" sx={{flex: 1}}>
              공통코드 관리
            </Typography>
            <TextField
                size="small"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{minWidth: 200}}
            />
            <Button
                variant="contained"
                startIcon={<AddIcon/>}
                onClick={handleAddClassClick}
                disabled={loading}
            >
              클래스 추가
            </Button>
          </Toolbar>
        </Paper>

        {/* 메인 콘텐츠 - 반응형 그리드 */}
        <Grid container spacing={2}
              sx={{height: {xs: '60vh', sm: '60vh', md: 'calc(85vh - 100px)'}}}>
          {/* 왼쪽: TreeView */}
          <Grid item xs={12} sm={12} md={5}>
            <Paper sx={{
              height: {xs: '60vh', sm: '60vh', md: '100%'},
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{p: 2, borderBottom: 1, borderColor: 'divider'}}>
                <Typography variant="h6"
                            sx={{display: 'flex', alignItems: 'center'}}>
                  <TreeIcon sx={{mr: 1}}/>
                  계층 구조
                </Typography>
              </Box>
              <HierarchicalTreeView
                  data={treeData}
                  onSelect={handleNodeSelect}
                  selectedId={selectedNodeId}
                  loading={loading}
                  autoExpandAll={false}
              />
            </Paper>
          </Grid>

          {/* 오른쪽: DataGrid */}
          <Grid item xs={12} sm={12} md={7}
                sx={{
                  position: {xs: 'static', sm: 'static', md: 'sticky'},
                  top: {xs: 0, sm: 0, md: '4rem'},
                  height: {xs: 'auto', sm: 'auto', md: '100%'}
                }}>
            <Paper sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: {xs: '400px', sm: '400px', md: 0}
            }}>
              <Box sx={{p: 2, borderBottom: 1, borderColor: 'divider'}}>
                <Typography variant="h6">
                  상세 정보
                </Typography>
                {selectedNode && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedNode.type === 'class'
                          ? `클래스: ${selectedNode.displayName
                          || selectedNode.name}` : `코드: ${selectedNode.name}`}
                    </Typography>
                )}
              </Box>
              <Box sx={{flex: 1, minHeight: 0}}>
                <DataGridTable
                    columns={columns}
                    paginationMode="client"
                    clientSideData={filteredGridRows}
                    defaultPageSize={25}
                    hidePagination={false}
                    dataGridSx={{
                      border: 'none',
                      '& .MuiDataGrid-cell': {
                        borderRight: 1,
                        borderColor: 'divider',
                      },
                    }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* 추가/편집 다이얼로그 */}
        <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            maxWidth="md"
            fullWidth
        >
          <DialogTitle>
            {dialogMode === 'addClass' && '클래스 추가'}
            {dialogMode === 'addCode' && '코드 추가'}
            {dialogMode === 'addChildClass' && '하위 클래스 추가'}
            {dialogMode === 'editClass' && '클래스 편집'}
            {dialogMode === 'editCode' && '코드 편집'}
          </DialogTitle>
          <DialogContent>
            {renderDialogContent()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} disabled={loading}>
              취소
            </Button>
            <Button
                onClick={handleSave}
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16}/> :
                    <SaveIcon/>}
            >
              {loading ? '저장 중...' : '저장'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 스낵바 */}
        <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar(prev => ({...prev, open: false}))}
        >
          <Alert
              onClose={() => setSnackbar(prev => ({...prev, open: false}))}
              severity={snackbar.severity}
              sx={{width: '100%'}}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
  )
}
