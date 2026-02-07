import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  Paper,
  TextField,
  Toolbar,
  Typography
} from '@mui/material'
import {
  Add as AddIcon,
  ClearAll as ClearAllIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import {useSnackbar} from 'notistack'
import commonCodeService from '../../service/commonCodeService'
import MillerColumns from './MillerColumns'
import NodeDetailPanel from './NodeDetailPanel'
import ClassForm from './ClassForm'
import CodeForm from './CodeForm'

const INITIAL_FORM_DATA = {
  classCode: '',
  className: '',
  description: '',
  attribute1Name: '',
  attribute2Name: '',
  attribute3Name: '',
  attribute4Name: '',
  attribute5Name: '',
  isActive: true,
  codeClassCode: '',
  code: '',
  codeName: '',
  attribute1Value: '',
  attribute2Value: '',
  attribute3Value: '',
  attribute4Value: '',
  attribute5Value: '',
  childClassCode: '',
  sort: 0,
  parentCodeNode: null
}

export default function CommonCodePage() {
  const {enqueueSnackbar} = useSnackbar()

  // 데이터 상태
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(false)

  // 네비게이션 상태: [{ type, code, node }]
  const [navigationPath, setNavigationPath] = useState([])

  // 다이얼로그 상태
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [originalCode, setOriginalCode] = useState('')

  // 현재 선택된 노드 (경로의 마지막)
  const selectedNode = navigationPath.length > 0
    ? navigationPath[navigationPath.length - 1].node
    : null

  // 부모 CLASS 노드 (CODE가 선택된 경우 사용)
  const parentClassNode = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'CODE') return null
    // 경로에서 CODE 바로 앞의 CLASS를 찾음
    for (let i = navigationPath.length - 2; i >= 0; i--) {
      const entry = navigationPath[i]
      if (entry.node.type === 'CLASS') return entry.node
      // CODE의 childClass도 CLASS이므로 확인
      if (entry.node.type === 'CODE' && entry.node.childClass) return entry.node.childClass
    }
    return null
  }, [navigationPath, selectedNode])

  // 검색용 전체 노드 목록 (flat)
  const allNodes = useMemo(() => {
    const nodes = []
    const traverse = (items, path) => {
      if (!items) return
      items.forEach(item => {
        nodes.push({...item, _searchPath: path})
        if (item.type === 'CLASS' && item.codes) {
          traverse(item.codes, [...path, item])
        }
        if (item.type === 'CODE' && item.childClass?.codes) {
          traverse(item.childClass.codes, [...path, item])
        }
      })
    }
    traverse(treeData, [])
    return nodes
  }, [treeData])

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const hierarchicalData = await commonCodeService.loadHierarchicalTree()
      setTreeData(hierarchicalData || [])
    } catch (error) {
      enqueueSnackbar(`데이터 로드 실패: ${error.message}`, {variant: 'error'})
      setTreeData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Miller Columns 네비게이션
  const handleNavigate = useCallback((columnIndex, item) => {
    setNavigationPath(prev => {
      // columnIndex 위치에서 선택 → 이후 경로 잘라내기
      const newPath = prev.slice(0, columnIndex)
      newPath.push({type: item.type, code: item.code, node: item})
      return newPath
    })
  }, [])

  // Breadcrumb 클릭
  const handleBreadcrumbClick = useCallback((index) => {
    if (index < 0) {
      setNavigationPath([])
    } else {
      setNavigationPath(prev => prev.slice(0, index + 1))
    }
  }, [])

  // 검색에서 노드 선택
  const handleSearchSelect = useCallback((event, node) => {
    if (!node) return
    // _searchPath를 기반으로 navigationPath 재구성
    const path = node._searchPath.map(p => ({type: p.type, code: p.code, node: p}))
    path.push({type: node.type, code: node.code, node})
    setNavigationPath(path)
  }, [])

  // 클래스 추가
  const handleAddClass = useCallback(() => {
    setDialogMode('addClass')
    setFormData({...INITIAL_FORM_DATA})
    setOpenDialog(true)
  }, [])

  // 코드 추가
  const handleAddCode = useCallback((classNode) => {
    setDialogMode('addCode')
    setFormData({...INITIAL_FORM_DATA, codeClassCode: classNode.code})
    setOpenDialog(true)
  }, [])

  // 하위 클래스 추가
  const handleAddChildClass = useCallback((codeNode) => {
    setDialogMode('addChildClass')
    setFormData({...INITIAL_FORM_DATA, parentCodeNode: codeNode})
    setOpenDialog(true)
  }, [])

  // 편집
  const handleEdit = useCallback((node) => {
    const isClass = node.type === 'CLASS'
    setDialogMode(isClass ? 'editClass' : 'editCode')

    if (isClass) {
      setFormData({
        ...INITIAL_FORM_DATA,
        classCode: node.code,
        className: node.name,
        description: node.description || '',
        attribute1Name: node.attribute1Name || '',
        attribute2Name: node.attribute2Name || '',
        attribute3Name: node.attribute3Name || '',
        attribute4Name: node.attribute4Name || '',
        attribute5Name: node.attribute5Name || '',
        isActive: node.isActive
      })
    } else {
      setFormData({
        ...INITIAL_FORM_DATA,
        codeClassCode: node.classCode,
        code: node.code,
        codeName: node.name,
        description: node.description || '',
        attribute1Value: node.attribute1Value || '',
        attribute2Value: node.attribute2Value || '',
        attribute3Value: node.attribute3Value || '',
        attribute4Value: node.attribute4Value || '',
        attribute5Value: node.attribute5Value || '',
        childClassCode: node.childClass?.code || '',
        sort: node.sort || 0,
        isActive: node.isActive
      })
    }
    setOriginalCode(node.code)
    setOpenDialog(true)
  }, [])

  // 삭제
  const handleDelete = useCallback(async (node) => {
    const isClass = node.type === 'CLASS'
    const confirmMessage = isClass
      ? `클래스 "${node.name}"를 삭제하시겠습니까?`
      : `코드 "${node.name}"를 삭제하시겠습니까?`

    if (!confirm(confirmMessage)) return

    try {
      setLoading(true)
      if (isClass) {
        await commonCodeService.deleteClass(node.code)
      } else {
        await commonCodeService.deleteCode(node.classCode, node.code)
      }
      enqueueSnackbar(`${isClass ? '클래스' : '코드'}가 성공적으로 삭제되었습니다.`, {variant: 'success'})

      // 삭제된 노드가 경로에 있으면 경로 조정
      setNavigationPath(prev => {
        const idx = prev.findIndex(p => p.code === node.code && p.type === node.type)
        return idx >= 0 ? prev.slice(0, idx) : prev
      })
      await loadData()
    } catch (error) {
      enqueueSnackbar(`삭제 실패: ${error.response?.data?.message || error.message}`, {variant: 'error'})
    } finally {
      setLoading(false)
    }
  }, [loadData])

  // 저장
  const handleSave = async () => {
    try {
      setLoading(true)

      if (dialogMode === 'addClass') {
        await commonCodeService.createClass({
          code: formData.classCode,
          name: formData.className,
          description: formData.description,
          attribute1Name: formData.attribute1Name || null,
          attribute2Name: formData.attribute2Name || null,
          attribute3Name: formData.attribute3Name || null,
          attribute4Name: formData.attribute4Name || null,
          attribute5Name: formData.attribute5Name || null,
          isActive: formData.isActive
        })
        enqueueSnackbar('클래스가 성공적으로 생성되었습니다.', {variant: 'success'})
      } else if (dialogMode === 'addCode') {
        await commonCodeService.createCode({
          classCode: formData.codeClassCode,
          code: formData.code,
          name: formData.codeName,
          description: formData.description,
          attribute1Value: formData.attribute1Value || null,
          attribute2Value: formData.attribute2Value || null,
          attribute3Value: formData.attribute3Value || null,
          attribute4Value: formData.attribute4Value || null,
          attribute5Value: formData.attribute5Value || null,
          childClassCode: formData.childClassCode || null,
          sort: formData.sort,
          isActive: formData.isActive
        })
        enqueueSnackbar('코드가 성공적으로 생성되었습니다.', {variant: 'success'})
      } else if (dialogMode === 'addChildClass') {
        await commonCodeService.createClass({
          code: formData.classCode,
          name: formData.className,
          description: formData.description,
          attribute1Name: formData.attribute1Name || null,
          attribute2Name: formData.attribute2Name || null,
          attribute3Name: formData.attribute3Name || null,
          attribute4Name: formData.attribute4Name || null,
          attribute5Name: formData.attribute5Name || null,
          isActive: formData.isActive
        })
        await commonCodeService.updateCode(
          formData.parentCodeNode.classCode,
          formData.parentCodeNode.code,
          {
            ...formData.parentCodeNode,
            childClassCode: formData.classCode
          }
        )
        enqueueSnackbar('하위 클래스가 성공적으로 생성되었습니다.', {variant: 'success'})
      } else if (dialogMode === 'editClass') {
        await commonCodeService.updateClass(originalCode, {
          code: formData.classCode,
          name: formData.className,
          description: formData.description,
          attribute1Name: formData.attribute1Name || null,
          attribute2Name: formData.attribute2Name || null,
          attribute3Name: formData.attribute3Name || null,
          attribute4Name: formData.attribute4Name || null,
          attribute5Name: formData.attribute5Name || null,
          isActive: formData.isActive
        })
        enqueueSnackbar('클래스가 성공적으로 수정되었습니다.', {variant: 'success'})
      } else if (dialogMode === 'editCode') {
        await commonCodeService.updateCode(formData.codeClassCode, originalCode, {
          code: formData.code,
          name: formData.codeName,
          description: formData.description,
          attribute1Value: formData.attribute1Value || null,
          attribute2Value: formData.attribute2Value || null,
          attribute3Value: formData.attribute3Value || null,
          attribute4Value: formData.attribute4Value || null,
          attribute5Value: formData.attribute5Value || null,
          childClassCode: formData.childClassCode || null,
          sort: formData.sort,
          isActive: formData.isActive
        })
        enqueueSnackbar('코드가 성공적으로 수정되었습니다.', {variant: 'success'})
      }

      setOpenDialog(false)
      await loadData()
    } catch (error) {
      enqueueSnackbar(`저장 실패: ${error.response?.data?.message || error.message}`, {variant: 'error'})
    } finally {
      setLoading(false)
    }
  }

  // 전체 캐시 삭제
  const handleClearAllCache = async () => {
    if (!confirm('전체 캐시를 삭제하시겠습니까?\n\n모든 캐시가 삭제되며 시스템 성능에 일시적인 영향을 줄 수 있습니다.')) {
      return
    }
    try {
      setLoading(true)
      const result = await commonCodeService.evictAllCaches()
      enqueueSnackbar(
        `${result.message} (${result.evictedCacheCount}개 캐시 삭제됨)`,
        {variant: 'success'}
      )
    } catch (error) {
      enqueueSnackbar(
        `캐시 삭제 실패: ${error.response?.data?.message || error.message}`,
        {variant: 'error'}
      )
    } finally {
      setLoading(false)
    }
  }

  // 다이얼로그 폼 타입
  const isClassForm = dialogMode === 'addClass' || dialogMode === 'addChildClass' || dialogMode === 'editClass'

  const dialogTitle = {
    addClass: '클래스 추가',
    addCode: '코드 추가',
    addChildClass: '하위 클래스 추가',
    editClass: '클래스 편집',
    editCode: '코드 편집'
  }[dialogMode] || ''

  return (
    <Box sx={{m: 2}}>
      {/* 상단 툴바 */}
      <Paper sx={{p: 2, mb: 2}}>
        <Toolbar sx={{pl: 0, pr: 0, gap: 2}}>
          <Typography variant="h4" component="h1" sx={{flexShrink: 0}}>
            공통코드 관리
          </Typography>
          <Autocomplete
            size="small"
            options={allNodes}
            getOptionLabel={(option) => `${option.code} - ${option.name}`}
            groupBy={(option) => option.type === 'CLASS' ? '클래스' : '코드'}
            onChange={handleSearchSelect}
            renderInput={(params) => (
              <TextField {...params} placeholder="검색..." />
            )}
            sx={{minWidth: 250, flex: 1}}
            noOptionsText="결과 없음"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon/>}
            onClick={handleAddClass}
            disabled={loading}
          >
            클래스 추가
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<ClearAllIcon/>}
            onClick={handleClearAllCache}
            disabled={loading}
          >
            전체 캐시 삭제
          </Button>
        </Toolbar>
      </Paper>

      {/* Breadcrumb */}
      <Paper sx={{px: 2, py: 1, mb: 1}}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small"/>}>
          <Link
            component="button"
            underline="hover"
            color={navigationPath.length === 0 ? 'text.primary' : 'inherit'}
            onClick={() => handleBreadcrumbClick(-1)}
            sx={{display: 'flex', alignItems: 'center', gap: 0.5}}
          >
            <HomeIcon fontSize="small"/>
            전체
          </Link>
          {navigationPath.map((entry, idx) => (
            <Link
              key={`${entry.type}-${entry.code}`}
              component="button"
              underline="hover"
              color={idx === navigationPath.length - 1 ? 'text.primary' : 'inherit'}
              fontWeight={idx === navigationPath.length - 1 ? 600 : 400}
              onClick={() => handleBreadcrumbClick(idx)}
            >
              {entry.code}
            </Link>
          ))}
        </Breadcrumbs>
      </Paper>

      {/* 메인 콘텐츠 */}
      {loading && treeData.length === 0 ? (
        <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}>
          <CircularProgress/>
        </Box>
      ) : (
        <Grid container spacing={1} sx={{height: 'calc(85vh - 180px)'}}>
          {/* 왼쪽: Miller Columns */}
          <Grid item xs={12} md={8} sx={{height: '100%'}}>
            <MillerColumns
              treeData={treeData}
              navigationPath={navigationPath}
              onNavigate={handleNavigate}
              onAddClass={handleAddClass}
              onAddCode={handleAddCode}
            />
          </Grid>

          {/* 오른쪽: 상세 패널 */}
          <Grid item xs={12} md={4} sx={{height: '100%'}}>
            <NodeDetailPanel
              selectedNode={selectedNode}
              parentClassNode={parentClassNode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddCode={handleAddCode}
              onAddChildClass={handleAddChildClass}
            />
          </Grid>
        </Grid>
      )}

      {/* 추가/편집 다이얼로그 */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {isClassForm ? (
            <ClassForm
              formData={formData}
              setFormData={setFormData}
              dialogMode={dialogMode}
              originalCode={originalCode}
            />
          ) : (
            <CodeForm
              formData={formData}
              setFormData={setFormData}
              dialogMode={dialogMode}
              originalCode={originalCode}
              parentClassNode={parentClassNode}
            />
          )}
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
    </Box>
  )
}
