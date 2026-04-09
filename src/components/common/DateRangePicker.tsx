import React, {useState} from 'react'
import {format, parse, isAfter, isValid} from 'date-fns'
import {ko} from 'date-fns/locale'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Button} from '@/components/ui/button'
import {Calendar} from '@/components/ui/calendar'
import {CalendarIcon} from 'lucide-react'
import {cn} from '@/lib/utils'
import {toast} from 'sonner'

interface DateRangePickerProps {
  fromValue: string
  toValue: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  fromLabel?: string
  toLabel?: string
  size?: 'small' | 'medium'
}

export default function DateRangePicker({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  fromLabel = '시작일',
  toLabel = '종료일',
  size = 'small',
}: DateRangePickerProps) {
  const [fromOpen, setFromOpen] = useState<boolean>(false)
  const [toOpen, setToOpen] = useState<boolean>(false)

  const parseDate = (value: string): Date | undefined => {
    if (!value) return undefined
    const parsed = parse(value, 'yyyy-MM-dd', new Date())
    return isValid(parsed) ? parsed : undefined
  }

  const formatDate = (date: Date | undefined): string => {
    if (!date || !isValid(date)) return ''
    return format(date, 'yyyy-MM-dd')
  }

  const handleFromSelect = (date: Date | undefined) => {
    const newFrom = formatDate(date)
    setFromOpen(false)
    if (newFrom && toValue && isAfter(parse(newFrom, 'yyyy-MM-dd', new Date()), parse(toValue, 'yyyy-MM-dd', new Date()))) {
      onFromChange(toValue)
      onToChange(newFrom)
      toast.info('시작일이 종료일보다 커서 자동으로 변환되었습니다.')
    } else {
      onFromChange(newFrom)
    }
  }

  const handleToSelect = (date: Date | undefined) => {
    const newTo = formatDate(date)
    setToOpen(false)
    if (fromValue && newTo && isAfter(parse(fromValue, 'yyyy-MM-dd', new Date()), parse(newTo, 'yyyy-MM-dd', new Date()))) {
      onFromChange(newTo)
      onToChange(fromValue)
      toast.info('시작일이 종료일보다 커서 자동으로 변환되었습니다.')
    } else {
      onToChange(newTo)
    }
  }

  const buttonSizeClass = size === 'small' ? 'h-8 text-xs px-2' : 'h-9 text-sm px-3'

  return (
    <div className="flex flex-row items-center gap-1.5">
      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'min-w-[140px] justify-start rounded-xl border-border/70 bg-background/78 font-normal shadow-xs backdrop-blur-sm hover:bg-accent/75 hover:text-accent-foreground',
              buttonSizeClass,
              !fromValue && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-1 size-3.5" />
            {fromValue || fromLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto rounded-[1.5rem] border border-border/70 bg-background/88 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
          align="start"
        >
          <Calendar
            mode="single"
            selected={parseDate(fromValue)}
            onSelect={handleFromSelect}
            locale={ko}
            captionLayout="dropdown"
            navLayout="after"
          />
        </PopoverContent>
      </Popover>

      <span className="text-xs font-semibold tracking-[0.24em] text-muted-foreground/80">~</span>

      <Popover open={toOpen} onOpenChange={setToOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'min-w-[140px] justify-start rounded-xl border-border/70 bg-background/78 font-normal shadow-xs backdrop-blur-sm hover:bg-accent/75 hover:text-accent-foreground',
              buttonSizeClass,
              !toValue && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-1 size-3.5" />
            {toValue || toLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto rounded-[1.5rem] border border-border/70 bg-background/88 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
          align="start"
        >
          <Calendar
            mode="single"
            selected={parseDate(toValue)}
            onSelect={handleToSelect}
            locale={ko}
            captionLayout="dropdown"
            navLayout="after"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
