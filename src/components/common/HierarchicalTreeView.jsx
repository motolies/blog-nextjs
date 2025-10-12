import React, {useState, useCallback, useMemo} from 'react'
import {Box, Typography, Chip, Paper, CircularProgress} from '@mui/material'
import {TreeView, TreeItem} from '@mui/x-tree-view'
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Class as ClassIcon,
  Code as CodeIcon
} from '@mui/icons-material'

/**
 * 계층형 트리 뷰 컴포넌트
 * CommonCode의 Class → Code → Class → Code 재귀 구조를 렌더링
 *
 * @param {Object} props
 * @param {Array} props.data - 트리 데이터 (Class 배열)
 * @param {Function} props.onSelect - 노드 선택 핸들러 (node, type) => void
 * @param {string} props.selectedId - 선택된 노드 ID
 * @param {Array} props.defaultExpanded - 기본 확장 노드 ID 배열
 * @param {boolean} props.autoExpandAll - 모든 노드 자동 확장 여부 (default: false)
 * @param {boolean} props.loading - 로딩 상태
 * @param {Function} props.renderClassLabel - 클래스 레이블 커스텀 렌더러 (node) => ReactNode
 * @param {Function} props.renderCodeLabel - 코드 레이블 커스텀 렌더러 (node) => ReactNode
 */
export default function HierarchicalTreeView({
  data = [],
  onSelect,
  selectedId,
  defaultExpanded = [],
  autoExpandAll = false,
  loading = false,
  renderClassLabel,
  renderCodeLabel
}) {
  // 확장된 노드 ID 배열
  const [expanded, setExpanded] = useState(defaultExpanded)

  // 모든 노드 ID 수집 (autoExpandAll용)
  const allNodeIds = useMemo(() => {
    if (!autoExpandAll) {
      return []
    }

    const ids = []
    const collectIds = (nodes) => {
      nodes.forEach(node => {
        ids.push(node.id)
        if (node.codes) {
          node.codes.forEach(code => {
            ids.push(code.id)
            if (code.childClass) {
              collectIds([code.childClass])
            }
          })
        }
      })
    }
    collectIds(data)
    return ids
  }, [data, autoExpandAll])

  // autoExpandAll이 true면 모든 노드 확장
  const effectiveExpanded = autoExpandAll ? allNodeIds : expanded

  // 노드 확장/축소 핸들러
  const handleToggle = useCallback((event, nodeIds) => {
    if (!autoExpandAll) {
      setExpanded(nodeIds)
    }
  }, [autoExpandAll])

  // 노드 선택 핸들러
  const handleSelect = useCallback((event, nodeId) => {
    if (!onSelect || !nodeId) {
      return
    }

    // 트리에서 해당 노드 찾기
    const findNode = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) {
          return {node, type: node.type}
        }
        if (node.codes) {
          for (const code of node.codes) {
            if (code.id === id) {
              return {node: code, type: 'CODE'}
            }
            if (code.childClass) {
              const found = findNode([code.childClass], id)
              if (found) {
                return found
              }
            }
          }
        }
      }
      return null
    }

    const result = findNode(data, nodeId)
    if (result) {
      onSelect(result.node, result.type)
    }
  }, [data, onSelect])

  // 기본 클래스 레이블 렌더러
  const defaultClassLabelRenderer = useCallback((node) => (
      <Box sx={{display: 'flex', alignItems: 'center', gap: 1, py: 0.5}}>
        <ClassIcon fontSize="small"/>
        <Typography variant="body2" fontWeight="bold">
          {node.displayName || node.name}
        </Typography>
        <Typography variant="caption" sx={{opacity: 0.8}}>
          ({node.code})
        </Typography>
        {node.codes?.length > 0 && (
            <Chip
                label={node.codes.length}
                size="small"
                variant="outlined"
                sx={{
                  height: 18,
                  fontSize: '0.7rem',
                  borderColor: 'currentColor'
                }}
            />
        )}
        {!node.isActive && (
            <Chip
                label="비활성"
                size="small"
                variant="outlined"
                sx={{
                  height: 18,
                  fontSize: '0.7rem',
                  borderColor: 'currentColor',
                  opacity: 0.7
                }}
            />
        )}
      </Box>
  ), [])

  // 기본 코드 레이블 렌더러
  const defaultCodeLabelRenderer = useCallback((node) => (
      <Box sx={{display: 'flex', alignItems: 'center', gap: 1, py: 0.5}}>
        <CodeIcon fontSize="small"/>
        <Typography variant="body2">
          {node.name}
        </Typography>
        <Typography variant="caption" sx={{opacity: 0.8}}>
          ({node.code})
        </Typography>
        {node.childClass && (
            <Chip
                label="하위"
                size="small"
                variant="outlined"
                sx={{
                  height: 18,
                  fontSize: '0.7rem',
                  borderColor: 'currentColor',
                  opacity: 0.9
                }}
            />
        )}
        {!node.isActive && (
            <Chip
                label="비활성"
                size="small"
                variant="outlined"
                sx={{
                  height: 18,
                  fontSize: '0.7rem',
                  borderColor: 'currentColor',
                  opacity: 0.7
                }}
            />
        )}
      </Box>
  ), [])

  // 트리 노드 재귀 렌더링
  const renderTreeNode = useCallback((node, depth = 0) => {
    if (!node || !node.id) {
      return null
    }

    if (node.type === 'CLASS') {
      const label = renderClassLabel ? renderClassLabel(node)
          : defaultClassLabelRenderer(node)

      return (
          <TreeItem
              key={node.id}
              nodeId={node.id}
              label={label}
              sx={{
                '& .MuiTreeItem-content': {
                  padding: '4px 8px',
                  borderRadius: 1,
                  transition: 'all 0.2s ease',

                  // 기본 상태: 파란색 텍스트/아이콘
                  color: 'primary.main',

                  '& .MuiSvgIcon-root': {
                    color: 'primary.main',
                  },

                  // Hover: 연한 파란색 배경, 진한 파란색 텍스트
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    color: 'primary.dark',

                    '& .MuiSvgIcon-root': {
                      color: 'primary.dark',
                    },
                  },

                  // Selected: 파란색 배경, 흰색 텍스트
                  '&.Mui-selected, &.Mui-focused': {
                    backgroundColor: (theme) => `${theme.palette.primary.main} !important`,

                    color: 'common.white',
                    fontWeight: 'bold',

                    '& .MuiSvgIcon-root': {
                      color: 'common.white',
                    },

                    '& .MuiTypography-root': {
                      color: 'common.white',
                      fontWeight: 'bold',
                    },

                    '& .MuiChip-root': {
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                      color: 'common.white',
                    },

                    // Selected + Hover: 더 진한 파란색
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                      color: 'common.white',

                      '& .MuiSvgIcon-root': {
                        color: 'common.white',
                      },
                    },
                  },
                },
              }}
          >
            {node.codes?.map(code => renderCodeNode(code, depth + 1))}
          </TreeItem>
      )
    }
    return null
  }, [renderClassLabel, defaultClassLabelRenderer])

  // 코드 노드 렌더링
  const renderCodeNode = useCallback((codeNode, depth = 0) => {
    if (!codeNode || !codeNode.id) {
      return null
    }

    const label = renderCodeLabel ? renderCodeLabel(codeNode)
        : defaultCodeLabelRenderer(codeNode)

    return (
        <TreeItem
            key={codeNode.id}
            nodeId={codeNode.id}
            label={label}
            sx={{
              '& .MuiTreeItem-content': {
                padding: '4px 8px',
                borderRadius: 1,
                transition: 'all 0.2s ease',

                // 기본 상태: 기본 텍스트, 보라색 아이콘
                color: 'text.primary',

                '& .MuiSvgIcon-root': {
                  color: 'secondary.main',
                  opacity: 0.7,
                },

                // Hover: 연한 보라색 배경, 진한 보라색 텍스트
                '&:hover': {
                  backgroundColor: 'rgba(156, 39, 176, 0.08)',
                  color: 'secondary.dark',

                  '& .MuiSvgIcon-root': {
                    color: 'secondary.main',
                    opacity: 1,
                  },
                },

                // Selected: 보라색 배경, 흰색 텍스트
                '&.Mui-selected, &.Mui-focused': {
                  backgroundColor: (theme) => `${theme.palette.secondary.main} !important`,
                  color: 'common.white',

                  '& .MuiSvgIcon-root': {
                    color: 'common.white',
                    opacity: 1,
                  },

                  '& .MuiTypography-root': {
                    color: 'common.white',
                  },

                  '& .MuiChip-root': {
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                    color: 'common.white',
                  },

                  // Selected + Hover: 더 진한 보라색
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                    color: 'common.white',

                    '& .MuiSvgIcon-root': {
                      color: 'common.white',
                    },
                  },
                },
              },
            }}
        >
          {codeNode.childClass && renderTreeNode(codeNode.childClass,
              depth + 1)}
        </TreeItem>
    )
  }, [renderCodeLabel, defaultCodeLabelRenderer, renderTreeNode])

  // 로딩 상태
  if (loading) {
    return (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%'
        }}>
          <CircularProgress/>
        </Box>
    )
  }

  // 데이터 없음
  if (!data || data.length === 0) {
    return (
        <Box sx={{p: 2}}>
          <Typography variant="body2" color="text.secondary">
            데이터가 없습니다.
          </Typography>
        </Box>
    )
  }

  return (
      <Box sx={{width: '100%', height: '100%', overflow: 'auto', p: 2}}>
        <TreeView
            aria-label="hierarchical tree"
            defaultCollapseIcon={<ExpandMoreIcon/>}
            defaultExpandIcon={<ChevronRightIcon/>}
            expanded={effectiveExpanded}
            selected={selectedId}
            onNodeToggle={handleToggle}
            onNodeSelect={handleSelect}
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
            }}
        >
          {data.map(node => renderTreeNode(node, 0))}
        </TreeView>
      </Box>
  )
}
