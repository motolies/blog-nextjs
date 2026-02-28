import React from 'react'
import {ChevronRight, GitBranch, Code} from 'lucide-react'
import {Badge} from '../ui/badge'
import {cn} from '../../lib/utils'

export default function MillerColumnItem({item, selected, onClick}) {
  const isClass = item.type === 'CLASS'
  const hasChildren = isClass
    ? (item.codes && item.codes.length > 0)
    : !!item.childClass

  return (
    <button
      onClick={() => onClick(item)}
      className={cn(
        'flex w-full items-center gap-2 border-l-2 px-2 py-1.5 text-left transition-colors hover:bg-sky-600/8',
        selected
          ? isClass ? 'border-sky-600 bg-sky-600/10' : 'border-fuchsia-600 bg-fuchsia-600/10'
          : 'border-transparent'
      )}
    >
      <span className="shrink-0">
        {isClass
          ? <GitBranch className="h-4 w-4 text-sky-700"/>
          : <Code className="h-4 w-4 text-fuchsia-700"/>
        }
      </span>
      <span className="flex-1 min-w-0">
        <span className={cn('block truncate text-sm text-[color:var(--admin-text)]', selected && 'font-semibold')}>
          {item.code}
        </span>
        <span className="block truncate text-xs text-[color:var(--admin-text-muted)]">{item.name}</span>
      </span>
      {!item.isActive && (
        <Badge variant="secondary" className="text-xs h-5 shrink-0 px-1">비활성</Badge>
      )}
      {hasChildren && (
        <ChevronRight className="h-4 w-4 shrink-0 text-[color:var(--admin-text-faint)]"/>
      )}
    </button>
  )
}
