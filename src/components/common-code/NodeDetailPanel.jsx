import React from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography
} from '@mui/material'
import {
  AccountTree as TreeIcon,
  Add as AddIcon,
  Class as ClassIcon,
  Code as CodeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material'

export default function NodeDetailPanel({
  selectedNode,
  parentClassNode,
  onEdit,
  onDelete,
  onAddCode,
  onAddChildClass
}) {
  if (!selectedNode) {
    return (
      <Paper variant="outlined" sx={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Typography color="text.secondary">항목을 선택하세요</Typography>
      </Paper>
    )
  }

  const isClass = selectedNode.type === 'CLASS'

  const renderClassDetail = () => (
    <Table size="small">
      <TableBody>
        <TableRow>
          <TableCell sx={{fontWeight: 600, width: 120, color: 'text.secondary'}}>코드</TableCell>
          <TableCell>{selectedNode.code}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>이름</TableCell>
          <TableCell>{selectedNode.name}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>설명</TableCell>
          <TableCell>{selectedNode.description || '-'}</TableCell>
        </TableRow>
        {[1, 2, 3, 4, 5].map(num => {
          const attrName = selectedNode[`attribute${num}Name`]
          if (!attrName) return null
          return (
            <TableRow key={num}>
              <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>속성{num}</TableCell>
              <TableCell>{attrName}</TableCell>
            </TableRow>
          )
        })}
        <TableRow>
          <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>상태</TableCell>
          <TableCell>
            <Chip
              label={selectedNode.isActive ? '활성' : '비활성'}
              size="small"
              color={selectedNode.isActive ? 'success' : 'default'}
            />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>코드 수</TableCell>
          <TableCell>{selectedNode.codes?.length || 0}개</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )

  const renderCodeDetail = () => (
    <Table size="small">
      <TableBody>
        <TableRow>
          <TableCell sx={{fontWeight: 600, width: 120, color: 'text.secondary'}}>코드</TableCell>
          <TableCell>{selectedNode.code}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>이름</TableCell>
          <TableCell>{selectedNode.name}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>소속 클래스</TableCell>
          <TableCell>{selectedNode.classCode}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>설명</TableCell>
          <TableCell>{selectedNode.description || '-'}</TableCell>
        </TableRow>
        {parentClassNode && [1, 2, 3, 4, 5].map(num => {
          const attrName = parentClassNode[`attribute${num}Name`]
          const attrValue = selectedNode[`attribute${num}Value`]
          if (!attrName) return null
          return (
            <TableRow key={num}>
              <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>{attrName}</TableCell>
              <TableCell>{attrValue || '-'}</TableCell>
            </TableRow>
          )
        })}
        <TableRow>
          <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>정렬순서</TableCell>
          <TableCell>{selectedNode.sort ?? 0}</TableCell>
        </TableRow>
        {selectedNode.childClass && (
          <TableRow>
            <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>하위 클래스</TableCell>
            <TableCell>
              <Chip
                icon={<ClassIcon/>}
                label={`${selectedNode.childClass.code} (${selectedNode.childClass.name})`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </TableCell>
          </TableRow>
        )}
        <TableRow>
          <TableCell sx={{fontWeight: 600, color: 'text.secondary'}}>상태</TableCell>
          <TableCell>
            <Chip
              label={selectedNode.isActive ? '활성' : '비활성'}
              size="small"
              color={selectedNode.isActive ? 'success' : 'default'}
            />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )

  return (
    <Paper variant="outlined" sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      {/* 헤더 */}
      <Box sx={{px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1}}>
        {isClass
          ? <ClassIcon color="primary"/>
          : <CodeIcon color="secondary"/>
        }
        <Typography variant="subtitle1" sx={{fontWeight: 600, flex: 1}}>
          {isClass ? '클래스' : '코드'} 상세
        </Typography>
        <Chip
          label={selectedNode.code}
          size="small"
          color={isClass ? 'primary' : 'secondary'}
        />
      </Box>
      <Divider/>

      {/* 상세 정보 */}
      <Box sx={{flex: 1, overflow: 'auto', p: 1}}>
        {isClass ? renderClassDetail() : renderCodeDetail()}
      </Box>

      {/* 액션 버튼 */}
      <Divider/>
      <Stack direction="row" spacing={1} sx={{p: 1.5, flexWrap: 'wrap', gap: 0.5}}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon/>}
          onClick={() => onEdit(selectedNode)}
        >
          편집
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon/>}
          onClick={() => onDelete(selectedNode)}
        >
          삭제
        </Button>
        {isClass ? (
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            startIcon={<AddIcon/>}
            onClick={() => onAddCode(selectedNode)}
          >
            코드 추가
          </Button>
        ) : (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<TreeIcon/>}
            onClick={() => onAddChildClass(selectedNode)}
          >
            하위 클래스 추가
          </Button>
        )}
      </Stack>
    </Paper>
  )
}
