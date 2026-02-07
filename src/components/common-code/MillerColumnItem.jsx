import React from 'react'
import {
  Chip,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material'
import {
  ChevronRight as ChevronRightIcon,
  Class as ClassIcon,
  Code as CodeIcon
} from '@mui/icons-material'

export default function MillerColumnItem({item, selected, onClick}) {
  const isClass = item.type === 'CLASS'
  const hasChildren = isClass
    ? (item.codes && item.codes.length > 0)
    : !!item.childClass

  return (
    <ListItemButton
      selected={selected}
      onClick={() => onClick(item)}
      sx={{
        borderLeft: 3,
        borderColor: selected
          ? (isClass ? 'primary.main' : 'secondary.main')
          : 'transparent',
        py: 0.75,
        '&.Mui-selected': {
          bgcolor: isClass ? 'primary.50' : 'secondary.50'
        }
      }}
    >
      <ListItemIcon sx={{minWidth: 32}}>
        {isClass
          ? <ClassIcon fontSize="small" color="primary"/>
          : <CodeIcon fontSize="small" color="secondary"/>
        }
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography variant="body2" noWrap sx={{fontWeight: selected ? 600 : 400}}>
            {item.code}
          </Typography>
        }
        secondary={
          <Typography variant="caption" color="text.secondary" noWrap>
            {item.name}
          </Typography>
        }
      />
      {!item.isActive && (
        <Chip label="비활성" size="small" sx={{mr: 0.5, height: 20, fontSize: '0.65rem'}}/>
      )}
      {hasChildren && (
        <ChevronRightIcon fontSize="small" color="action"/>
      )}
    </ListItemButton>
  )
}
