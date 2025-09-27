import React, {useState, useEffect, useCallback, useMemo} from 'react'
import {
  Box,
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
  Tooltip,
  CircularProgress
} from '@mui/material'
import {
  DataGrid,
  GridActionsCellItem,
  GridRowModes,
  GridRowModesModel,
  GridRowEditStopReasons,
  useGridApiRef,
} from '@mui/x-data-grid'
import {
  TreeView,
  TreeItem,
} from '@mui/x-tree-view'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountTree as TreeIcon,
  Code as CodeIcon,
  Class as ClassIcon
} from '@mui/icons-material'
import commonCodeService from '../../service/commonCodeService'

export default function CommonCode() {
  // === 모든 상태 선언 ===
  const apiRef = useGridApiRef()
  const [rows, setRows] = useState([])
  const [rowModesModel, setRowModesModel] = useState({})
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogType, setDialogType] = useState('') // 'class', 'code', 'edit'
  const [selectedRow, setSelectedRow] = useState(null)
  const [snackbar, setSnackbar] = useState({open: false, message: '', severity: 'info'})
  const [searchQuery, setSearchQuery] = useState('')
  const [apiError, setApiError] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [expandedNodes, setExpandedNodes] = useState([])
  const [treeData, setTreeData] = useState([])
  const [filteredRows, setFilteredRows] = useState([])

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
    sort: 0
  })

  // === 모든 헬퍼 함수들 (상태 사용 전에 정의) ===

  // 트리에서 노드 찾기 헬퍼 함수
  const findNodeById = useCallback((nodes, id) => {
    if (!nodes || !Array.isArray(nodes)) return null
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findNodeById(node.children, id)
        if (found) return found
      }
    }
    return null
  }, [])

  // 검색 기능을 위한 필터링 로직
  const applySearchFilter = useCallback((data, query) => {
    if (!data || !Array.isArray(data)) return []
    if (!query || !query.trim()) return data

    const searchQuery = query.toLowerCase()
    return data.filter(row => {
      if (!row) return false
      if (row.type === 'class') {
        return (
            row.name?.toLowerCase().includes(searchQuery) ||
            row.displayName?.toLowerCase().includes(searchQuery) ||
            row.description?.toLowerCase().includes(searchQuery)
        )
      } else {
        return (
            row.code?.toLowerCase().includes(searchQuery) ||
            row.name?.toLowerCase().includes(searchQuery) ||
            row.description?.toLowerCase().includes(searchQuery) ||
            row.className?.toLowerCase().includes(searchQuery)
        )
      }
    })
  }, [])

  // 트리 데이터 구성 함수
  const buildTreeData = useCallback((data) => {
    if (!data || !Array.isArray(data)) return []

    const tree = []
    const classItems = data.filter(item => item?.type === 'class')
    const codeItems = data.filter(item => item?.type === 'code')

    classItems.forEach(classItem => {
      if (!classItem) return
      const childCodes = codeItems.filter(code =>
        code && (code.parentId === classItem.id || code.classId === classItem.id)
      )

      tree.push({
        id: `class-${classItem.id}`,
        label: classItem.name || classItem.displayName,
        type: 'class',
        data: classItem,
        children: childCodes.map(code => ({
          id: `code-${code.id}`,
          label: code.name || code.displayName,
          type: 'code',
          data: code
        }))
      })
    })

    // 부모가 없는 코드들을 루트 레벨에 추가
    const rootCodes = codeItems.filter(code => code && !code.parentId && !code.classId)
    rootCodes.forEach(code => {
      if (!code) return
      tree.push({
        id: `code-${code.id}`,
        label: code.name || code.displayName,
        type: 'code',
        data: code
      })
    })

    return tree
  }, [])

  // 데이터 로드 함수
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const treeData = await commonCodeService.loadAllTreeData()
      setRows(treeData || [])
    } catch (error) {
      console.error('공통코드 데이터 로드 실패:', error)
      let errorMessage = '알 수 없는 오류가 발생했습니다.'

      if (error.response?.status === 401) {
        errorMessage = '인증이 필요합니다. 로그인 후 다시 시도해주세요.'
      } else if (error.response?.status === 403) {
        errorMessage = '접근 권한이 없습니다. 관리자 권한이 필요합니다.'
      } else if (error.response?.status === 405) {
        errorMessage = 'API가 구현되지 않았습니다. 백엔드 개발이 필요합니다.'
      } else if (error.response?.status >= 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      setSnackbar({
        open: true,
        message: `데이터 로드 실패: ${errorMessage}`,
        severity: 'error'
      })
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 트리 노드 선택 핸들러
  const handleNodeSelect = useCallback((event, nodeId) => {
    if (!nodeId) return
    setSelectedNodeId(nodeId)

    const selectedNode = findNodeById(treeData, nodeId)
    if (selectedNode) {
      let baseData = []

      if (selectedNode.type === 'class') {
        const classData = selectedNode.data
        const childCodes = rows.filter(row =>
          row && row.type === 'code' && (row.parentId === classData.id || row.classId === classData.id)
        )
        baseData = [classData, ...childCodes]
      } else if (selectedNode.type === 'code') {
        baseData = [selectedNode.data]
      }

      const finalData = applySearchFilter(baseData, searchQuery)
      setFilteredRows(finalData)
    }
  }, [treeData, rows, searchQuery, applySearchFilter, findNodeById])

  // === 이펙트들 ===

  // 초기 데이터 로드
  useEffect(() => {
    loadData()
  }, [loadData])

  // rows 데이터가 변경될 때 트리 데이터 구성
  useEffect(() => {
    if (rows && rows.length > 0) {
      const tree = buildTreeData(rows)
      setTreeData(tree)
      setFilteredRows(rows)

      // 첫 번째 클래스를 기본 확장
      if (tree.length > 0 && tree[0].type === 'class') {
        setExpandedNodes([tree[0].id])
      }
    } else {
      setTreeData([])
      setFilteredRows([])
    }
  }, [rows, buildTreeData])

  // 검색어 변경시 필터링 재적용
  useEffect(() => {
    if (!rows || rows.length === 0) {
      setFilteredRows([])
      return
    }

    if (selectedNodeId && treeData.length > 0) {
      const selectedNode = findNodeById(treeData, selectedNodeId)
      if (selectedNode) {
        let baseData = []

        if (selectedNode.type === 'class' && selectedNode.data) {
          const classData = selectedNode.data
          const childCodes = rows.filter(row =>
            row && row.type === 'code' && (row.parentId === classData.id || row.classId === classData.id)
          )
          baseData = [classData, ...childCodes]
        } else if (selectedNode.type === 'code' && selectedNode.data) {
          baseData = [selectedNode.data]
        }

        const finalData = applySearchFilter(baseData, searchQuery)
        setFilteredRows(finalData)
      } else {
        setFilteredRows([])
      }
    } else {
      const finalData = applySearchFilter(rows, searchQuery)
      setFilteredRows(finalData)
    }
  }, [searchQuery, selectedNodeId, treeData, rows, applySearchFilter, findNodeById])

  // 트리 노드 확장/축소 핸들러
  const handleNodeToggle = useCallback((event, nodeIds) => {
    setExpandedNodes(nodeIds)
  }, [])

  // 트리 렌더링 함수
  const renderTreeItems = useCallback((nodes) => {
    return nodes.map((node) => (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
            {node.type === 'class' ? (
              <ClassIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
            ) : (
              <CodeIcon color="secondary" fontSize="small" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2">{node.label}</Typography>
          </Box>
        }
      >
        {node.children && renderTreeItems(node.children)}
      </TreeItem>
    ))
  }, [])

  // 컬럼 정의
  const columns = [
    {
      field: 'type',
      headerName: '타입',
      width: 100,
      renderCell: (params) => {
        const type = params.value || params.row?.type
        if (type === 'class') {
          return <Chip icon={<ClassIcon/>} label="클래스" size="small" color="primary"/>
        } else if (type === 'code') {
          return <Chip icon={<CodeIcon/>} label="코드" size="small" color="secondary"/>
        }
        return null
      }
    },
    {
      field: 'name',
      headerName: '이름/코드',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const row = params.row
        if (!row || !row.type) {
          return ''
        }

        if (row.displayName) {
          return row.name || ''
        } else {
          return row.code || ''
        }
      }
    },
    {
      field: 'displayName',
      headerName: '표시명',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const row = params.row
        if (!row || !row.type) {
          return ''
        }
        return row.type === 'class' ? (row.displayName || '') : (row.name || '')
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
      field: 'attributes',
      headerName: '속성',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const row = params.row
        if (!row || !row.type) {
          return null
        }

        if (row.type === 'class') {
          const attrs = [
            row.attribute1Name,
            row.attribute2Name,
            row.attribute3Name,
            row.attribute4Name,
            row.attribute5Name
          ].filter(Boolean)
          return (
              <Box sx={{display: 'flex', gap: 0.5, flexWrap: 'wrap'}}>
                {attrs.slice(0, 3).map((attr, index) => (
                    <Chip key={index} label={attr} size="small" variant="outlined"/>
                ))}
                {attrs.length > 3 && <Chip label={`+${attrs.length - 3}`} size="small"/>}
              </Box>
          )
        } else {
          const attrs = [
            row.attribute1Value,
            row.attribute2Value,
            row.attribute3Value,
            row.attribute4Value,
            row.attribute5Value
          ].filter(Boolean)
          return (
              <Box sx={{display: 'flex', gap: 0.5, flexWrap: 'wrap'}}>
                {attrs.slice(0, 2).map((attr, index) => (
                    <Chip key={index} label={attr} size="small" variant="outlined"/>
                ))}
                {attrs.length > 2 && <Chip label={`+${attrs.length - 2}`} size="small"/>}
              </Box>
          )
        }
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '액션',
      width: 120,
      cellClassName: 'actions',
      getActions: ({id, row}) => {
        const actions = [
          <GridActionsCellItem
              icon={<EditIcon/>}
              label="편집"
              onClick={handleEditClick(id)}
              color="inherit"
          />,
          <GridActionsCellItem
              icon={<DeleteIcon/>}
              label="삭제"
              onClick={handleDeleteClick(id)}
              color="inherit"
          />
        ]

        if (row.type === 'class') {
          actions.unshift(
              <GridActionsCellItem
                  icon={<AddIcon/>}
                  label="코드 추가"
                  onClick={handleAddCodeClick(id)}
                  color="inherit"
              />
          )
        } else if (row.type === 'code') {
          actions.unshift(
              <GridActionsCellItem
                  icon={<TreeIcon/>}
                  label="하위 클래스 추가"
                  onClick={handleAddChildClassClick(id)}
                  color="inherit"
              />
          )
        }

        return actions
      },
    },
  ]

  // 이벤트 핸들러들
  const handleAddClassClick = () => {
    setDialogType('class')
    setSelectedRow(null)
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
      sort: 0
    })
    setOpenDialog(true)
  }

  const handleAddCodeClick = (id) => () => {
    const row = rows.find(r => r.id === id)
    setDialogType('code')
    setSelectedRow(row)
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
      sort: 0
    })
    setOpenDialog(true)
  }

  const handleAddChildClassClick = (id) => () => {
    const row = rows.find(r => r.id === id)
    if (!row || row.type !== 'code') {
      setSnackbar({
        open: true,
        message: '코드에서만 하위 클래스를 추가할 수 있습니다.',
        severity: 'warning'
      })
      return
    }

    setDialogType('childClass')
    setSelectedRow(row)
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
      parentCode: row  // 부모 코드 정보 저장
    })
    setOpenDialog(true)
  }

  const handleEditClick = (id) => () => {
    const row = rows.find(r => r.id === id)
    setDialogType('edit')
    setSelectedRow(row)

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
        sort: 0
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
        sort: row.sort || 0
      })
    }
    setOpenDialog(true)
  }

  const handleDeleteClick = (id) => () => {
    const row = rows.find(r => r.id === id)
    if (confirm(`${row.type === 'class' ? '클래스' : '코드'} "${row.name || row.code}"를 삭제하시겠습니까?`)) {
      handleDelete(row)
    }
  }

  // 폼 유효성 검사
  const validateForm = async () => {
    const errors = []

    if (dialogType === 'class' || dialogType === 'childClass') {
      if (!formData.name.trim()) {
        errors.push('클래스명은 필수입니다.')
      } else if (!/^[A-Z_][A-Z0-9_]*$/.test(formData.name)) {
        errors.push('클래스명은 영문 대문자와 밑줄(_)만 사용할 수 있습니다.')
      }

      if (!formData.displayName.trim()) {
        errors.push('표시명은 필수입니다.')
      }

      // 중복 체크 (새로 생성하는 경우만)
      if (dialogType !== 'edit') {
        try {
          const exists = await commonCodeService.checkClassExists(formData.name)
          if (exists) {
            errors.push(`클래스명 '${formData.name}'은 이미 존재합니다.`)
          }
        } catch (error) {
          console.warn('클래스명 중복 체크 실패:', error)
        }
      }
    } else if (dialogType === 'code') {
      if (!formData.code.trim()) {
        errors.push('코드값은 필수입니다.')
      } else if (!/^[A-Z_][A-Z0-9_]*$/.test(formData.code)) {
        errors.push('코드값은 영문 대문자와 밑줄(_)만 사용할 수 있습니다.')
      }

      if (!formData.name.trim()) {
        errors.push('코드명은 필수입니다.')
      }

      // 중복 체크 (새로 생성하는 경우만)
      if (dialogType !== 'edit') {
        try {
          const exists = await commonCodeService.checkCodeExists(formData.className, formData.code)
          if (exists) {
            errors.push(`코드값 '${formData.code}'은 해당 클래스에서 이미 존재합니다.`)
          }
        } catch (error) {
          console.warn('코드값 중복 체크 실패:', error)
        }
      }
    }

    return errors
  }

  // CRUD operations
  const handleSave = async () => {
    try {
      setLoading(true)

      // 폼 유효성 검사
      const validationErrors = await validateForm()
      if (validationErrors.length > 0) {
        setSnackbar({
          open: true,
          message: validationErrors.join('\n'),
          severity: 'error'
        })
        return
      }

      if (dialogType === 'class') {
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
      } else if (dialogType === 'code') {
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
      } else if (dialogType === 'childClass') {
        // 1단계: 하위 클래스 생성
        const newClass = await commonCodeService.createClass({
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
            formData.parentCode.className,
            formData.parentCode.code,
            {
              ...formData.parentCode,
              childClassName: formData.name
            }
        )

        setSnackbar({
          open: true,
          message: '하위 클래스가 성공적으로 생성되었습니다.',
          severity: 'success'
        })
      } else if (dialogType === 'edit' && selectedRow) {
        if (selectedRow.type === 'class') {
          await commonCodeService.updateClass(selectedRow.name, {
            displayName: formData.displayName,
            description: formData.description,
            attribute1Name: formData.attribute1Name || null,
            attribute2Name: formData.attribute2Name || null,
            attribute3Name: formData.attribute3Name || null,
            attribute4Name: formData.attribute4Name || null,
            attribute5Name: formData.attribute5Name || null,
            isActive: formData.isActive
          })
        } else {
          await commonCodeService.updateCode(selectedRow.className, selectedRow.code, {
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
        }
        setSnackbar({
          open: true,
          message: '데이터가 성공적으로 수정되었습니다.',
          severity: 'success'
        })
      }

      setOpenDialog(false)
      await loadData()
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '저장 중 알 수 없는 오류가 발생했습니다.'

      // 특정 오류 타입별 메시지 처리
      let userMessage = errorMessage
      if (error.response?.status === 409) {
        userMessage = '중복된 데이터입니다. 다른 이름을 사용해주세요.'
      } else if (error.response?.status === 400) {
        userMessage = '입력 데이터가 올바르지 않습니다. 형식을 확인해주세요.'
      } else if (error.response?.status >= 500) {
        userMessage = '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }

      setSnackbar({
        open: true,
        message: `저장 실패: ${userMessage}`,
        severity: 'error'
      })
      console.error('공통코드 저장 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (row) => {
    try {
      setLoading(true)

      if (row.type === 'class') {
        // 클래스 삭제 전에 하위 코드가 있는지 확인
        const hasChildren = rows.some(r => r.type === 'code' && r.className === row.name)
        if (hasChildren && !confirm(`클래스 '${row.name}'에 속한 코드들도 함께 삭제됩니다. 계속하시겠습니까?`)) {
          return
        }
        await commonCodeService.deleteClass(row.name)
      } else {
        // 코드 삭제 전에 하위 클래스가 있는지 확인
        if (row.childClassName && !confirm(`코드 '${row.code}'의 하위 클래스 '${row.childClassName}'의 연결이 끊어집니다. 계속하시겠습니까?`)) {
          return
        }
        await commonCodeService.deleteCode(row.className, row.code)
      }

      setSnackbar({
        open: true,
        message: `${row.type === 'class' ? '클래스' : '코드'}가 성공적으로 삭제되었습니다.`,
        severity: 'success'
      })
      await loadData()
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '삭제 중 오류가 발생했습니다.'

      let userMessage = errorMessage
      if (error.response?.status === 409) {
        userMessage = '다른 데이터에서 참조되고 있어 삭제할 수 없습니다.'
      } else if (error.response?.status === 404) {
        userMessage = '삭제하려는 데이터를 찾을 수 없습니다.'
      }

      setSnackbar({
        open: true,
        message: `삭제 실패: ${userMessage}`,
        severity: 'error'
      })
      console.error('공통코드 삭제 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 다이얼로그 폼 렌더링
  const renderDialogContent = () => {
    const isClass = dialogType === 'class' || dialogType === 'childClass' || (dialogType === 'edit' && selectedRow?.type === 'class')

    return (
        <Stack spacing={3}>
          {isClass ? (
              // 클래스 폼
              <>
                {dialogType === 'childClass' && (
                    <Alert severity="info" sx={{mb: 2}}>
                      부모 코드: <strong>{formData.parentCode?.className} - {formData.parentCode?.code} ({formData.parentCode?.name})</strong>
                      <br/>
                      이 코드의 하위 클래스로 새로운 클래스가 생성됩니다.
                    </Alert>
                )}
                <TextField
                    label="클래스명"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    required
                    disabled={dialogType === 'edit'}
                    fullWidth
                />
                <TextField
                    label="표시명"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({...prev, displayName: e.target.value}))}
                    fullWidth
                />
                <TextField
                    label="설명"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
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
                        onChange={(e) => setFormData(prev => ({...prev, [`attribute${num}Name`]: e.target.value}))}
                        fullWidth
                    />
                ))}

                <FormControlLabel
                    control={
                      <Switch
                          checked={formData.isActive}
                          onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.checked}))}
                      />
                    }
                    label="활성화"
                />

                {dialogType === 'childClass' && (
                    <Alert severity="warning" sx={{mt: 2}}>
                      하위 클래스 생성 후에는 부모 코드의 childClassName이 자동으로 업데이트됩니다.
                    </Alert>
                )}
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
                    onChange={(e) => setFormData(prev => ({...prev, code: e.target.value}))}
                    required
                    disabled={dialogType === 'edit'}
                    fullWidth
                />
                <TextField
                    label="코드명"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    required
                    fullWidth
                />
                <TextField
                    label="설명"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
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
                        onChange={(e) => setFormData(prev => ({...prev, [`attribute${num}Value`]: e.target.value}))}
                        fullWidth
                    />
                ))}

                <TextField
                    label="하위 클래스명"
                    value={formData.childClassName}
                    onChange={(e) => setFormData(prev => ({...prev, childClassName: e.target.value}))}
                    placeholder="재귀 구조용 (선택사항)"
                    fullWidth
                />

                <TextField
                    label="정렬순서"
                    type="number"
                    value={formData.sort}
                    onChange={(e) => setFormData(prev => ({...prev, sort: parseInt(e.target.value) || 0}))}
                    fullWidth
                />

                <FormControlLabel
                    control={
                      <Switch
                          checked={formData.isActive}
                          onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.checked}))}
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
      <Box sx={{width: '100%'}}>
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

        <Box sx={{ display: 'flex', height: 600, width: '100%', gap: 2 }}>
          {/* TreeView 패널 */}
          <Paper sx={{ width: 300, minWidth: 250, p: 2, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TreeIcon sx={{ mr: 1 }} />
              구조
            </Typography>
            {treeData.length > 0 ? (
              <TreeView
                expanded={expandedNodes}
                selected={selectedNodeId}
                onNodeSelect={handleNodeSelect}
                onNodeToggle={handleNodeToggle}
                sx={{
                  flexGrow: 1,
                  maxWidth: 400,
                  overflowY: 'auto',
                  '& .MuiTreeItem-content': {
                    padding: '4px 8px',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                    },
                  },
                }}
              >
                {renderTreeItems(treeData)}
              </TreeView>
            ) : (
              <Typography variant="body2" color="text.secondary">
                데이터가 없습니다.
              </Typography>
            )}
          </Paper>

          {/* DataGrid 패널 */}
          <Paper sx={{ flex: 1, overflow: 'hidden' }}>
            <DataGrid
                apiRef={apiRef}
                rows={filteredRows}
                columns={columns}
                loading={loading}
                initialState={{
                  pagination: {
                    paginationModel: {page: 0, pageSize: 25},
                  },
                }}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                sx={{
                  '& .MuiDataGrid-root': {
                    border: 1,
                    borderColor: 'divider',
                  },
                  '& .MuiDataGrid-row': {
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  },
                  '& .MuiDataGrid-cell': {
                    borderRight: 1,
                    borderColor: 'divider',
                  },
                }}
            />
          </Paper>
        </Box>

        {/* 추가/편집 다이얼로그 */}
        <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            maxWidth="md"
            fullWidth
        >
          <DialogTitle>
            {dialogType === 'class' && '클래스 추가'}
            {dialogType === 'code' && '코드 추가'}
            {dialogType === 'childClass' && '하위 클래스 추가'}
            {dialogType === 'edit' && `${selectedRow?.type === 'class' ? '클래스' : '코드'} 편집`}
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
                startIcon={loading ? <CircularProgress size={16}/> : <SaveIcon/>}
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
