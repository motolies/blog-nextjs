import React from 'react'
import {
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  Paper,
  Tooltip,
  Typography
} from '@mui/material'
import {Add as AddIcon} from '@mui/icons-material'
import MillerColumnItem from './MillerColumnItem'

export default function MillerColumn({columnData, onItemClick, onAddClick}) {
  const {type, label, items, selectedCode} = columnData
  const isClassList = type === 'CLASS_LIST'

  return (
    <Paper
      variant="outlined"
      sx={{
        minWidth: 220,
        maxWidth: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}
    >
      {/* 헤더 */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: isClassList ? 'primary.50' : 'secondary.50',
          borderBottom: 2,
          borderColor: isClassList ? 'primary.main' : 'secondary.main'
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{flex: 1, fontWeight: 600, color: isClassList ? 'primary.dark' : 'secondary.dark'}}
          noWrap
        >
          {label}
        </Typography>
        <Chip
          label={items.length}
          size="small"
          sx={{height: 20, fontSize: '0.7rem'}}
          color={isClassList ? 'primary' : 'secondary'}
          variant="outlined"
        />
        {onAddClick && (
          <Tooltip title={isClassList ? '클래스 추가' : '코드 추가'}>
            <IconButton size="small" onClick={onAddClick} sx={{p: 0.25}}>
              <AddIcon fontSize="small"/>
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* 아이템 리스트 */}
      <List
        dense
        disablePadding
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {items.length === 0 ? (
          <Box sx={{p: 2, textAlign: 'center'}}>
            <Typography variant="caption" color="text.secondary">
              항목 없음
            </Typography>
          </Box>
        ) : (
          items.map((item) => (
            <React.Fragment key={`${item.type}-${item.code}`}>
              <MillerColumnItem
                item={item}
                selected={item.code === selectedCode}
                onClick={onItemClick}
              />
              <Divider component="li"/>
            </React.Fragment>
          ))
        )}
      </List>
    </Paper>
  )
}
