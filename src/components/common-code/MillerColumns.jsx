import React, {useMemo, useRef, useEffect} from 'react'
import {Box} from '@mui/material'
import MillerColumn from './MillerColumn'

/**
 * buildColumns: treeData + navigationPath를 기반으로 표시할 컬럼 목록을 생성
 *
 * treeData 구조 (transformTreeForUI 결과):
 *   [{ type:"CLASS", code, name, codes: [{ type:"CODE", code, name, childClass: { type:"CLASS", codes:[...] } }] }]
 *
 * navigationPath: [{ type, code, node }] - 선택된 경로
 *
 * 컬럼0: 최상위 CLASS 목록
 * 경로[0] = CLASS 선택 → 컬럼1: 해당 CLASS.codes (CODE 목록)
 * 경로[1] = CODE 선택 + childClass 있음 → 컬럼2: CODE.childClass.codes
 * ... 재귀
 */
function buildColumns(treeData, navigationPath) {
  const columns = []

  // 컬럼0: 최상위 CLASS 목록
  columns.push({
    type: 'CLASS_LIST',
    label: '클래스 목록',
    items: treeData || [],
    selectedCode: navigationPath.length > 0 ? navigationPath[0].code : null,
    parentNode: null
  })

  // 경로를 따라가며 추가 컬럼 생성
  let currentItems = treeData
  for (let i = 0; i < navigationPath.length; i++) {
    const pathEntry = navigationPath[i]

    if (pathEntry.type === 'CLASS') {
      // CLASS를 선택했으면 → 해당 CLASS의 codes를 CODE 컬럼으로
      const classNode = currentItems?.find(item => item.code === pathEntry.code)
      if (classNode && classNode.codes) {
        columns.push({
          type: 'CODE_LIST',
          label: `${classNode.code} 코드`,
          items: classNode.codes,
          selectedCode: (i + 1 < navigationPath.length) ? navigationPath[i + 1].code : null,
          parentNode: classNode
        })
        currentItems = classNode.codes
      }
    } else if (pathEntry.type === 'CODE') {
      // CODE를 선택했고 childClass가 있으면 → childClass.codes를 CODE 컬럼으로
      const codeNode = currentItems?.find(item => item.code === pathEntry.code)
      if (codeNode?.childClass?.codes) {
        columns.push({
          type: 'CODE_LIST',
          label: `${codeNode.childClass.code} 코드`,
          items: codeNode.childClass.codes,
          selectedCode: (i + 1 < navigationPath.length) ? navigationPath[i + 1].code : null,
          parentNode: codeNode.childClass
        })
        currentItems = codeNode.childClass.codes
      }
    }
  }

  return columns
}

export default function MillerColumns({treeData, navigationPath, onNavigate, onAddClass, onAddCode}) {
  const scrollRef = useRef(null)
  const columns = useMemo(
    () => buildColumns(treeData, navigationPath),
    [treeData, navigationPath]
  )

  // 새 컬럼 추가 시 오른쪽으로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [columns.length])

  const handleItemClick = (columnIndex, item) => {
    onNavigate(columnIndex, item)
  }

  const handleAddClick = (column, columnIndex) => {
    if (column.type === 'CLASS_LIST' && columnIndex === 0) {
      // 최상위 클래스 추가
      onAddClass()
    } else if (column.type === 'CODE_LIST' && column.parentNode) {
      // 해당 CLASS에 코드 추가
      onAddCode(column.parentNode)
    }
  }

  return (
    <Box
      ref={scrollRef}
      sx={{
        display: 'flex',
        gap: 0.5,
        height: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        p: 0.5,
        '&::-webkit-scrollbar': {height: 6},
        '&::-webkit-scrollbar-thumb': {bgcolor: 'grey.400', borderRadius: 3}
      }}
    >
      {columns.map((col, idx) => (
        <MillerColumn
          key={`${col.type}-${col.label}-${idx}`}
          columnData={col}
          onItemClick={(item) => handleItemClick(idx, item)}
          onAddClick={() => handleAddClick(col, idx)}
        />
      ))}
    </Box>
  )
}
