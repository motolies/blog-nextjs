import React from 'react'
import {Plus} from 'lucide-react'
import {Button} from '../ui/button'
import {Badge} from '../ui/badge'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '../ui/tooltip'
import {cn} from '../../lib/utils'
import MillerColumnItem from './MillerColumnItem'

export default function MillerColumn({columnData, onItemClick, onAddClick}) {
  const {type, label, items, selectedCode} = columnData
  const isClassList = type === 'CLASS_LIST'

  return (
    <div className="flex h-full min-w-[220px] max-w-[280px] shrink-0 flex-col rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
      {/* 헤더 */}
      <div className={cn(
        'flex items-center gap-2 border-b px-3 py-2',
        isClassList ? 'border-sky-600/12 bg-sky-600/8' : 'border-fuchsia-600/12 bg-fuchsia-600/8'
      )}>
        <span className={cn(
          'flex-1 text-sm font-semibold truncate',
          isClassList ? 'text-sky-700' : 'text-fuchsia-700'
        )}>
          {label}
        </span>
        <Badge variant="outline" className="h-5 text-xs px-1.5">
          {items.length}
        </Badge>
        {onAddClick && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onAddClick} className="h-6 w-6">
                  <Plus className="h-3.5 w-3.5"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isClassList ? '클래스 추가' : '코드 추가'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* 아이템 리스트 */}
      <div className="flex-1 divide-y divide-[color:var(--admin-border)] overflow-y-auto overflow-x-hidden">
        {items.length === 0 ? (
          <div className="p-4 text-center text-sm text-[color:var(--admin-text-faint)]">항목 없음</div>
        ) : (
          items.map((item) => (
            <MillerColumnItem
              key={`${item.type}-${item.code}`}
              item={item}
              selected={item.code === selectedCode}
              onClick={onItemClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
