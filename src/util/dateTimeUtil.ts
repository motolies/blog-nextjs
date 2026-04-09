import { format } from 'date-fns'

export const formatUtcToLocal = (utcDateString: string | null | undefined, fmt: string = 'yyyy-MM-dd HH:mm:ss.SSS'): string => {
  if (!utcDateString) return ''

  const dateStr = utcDateString.endsWith('Z') ? utcDateString : utcDateString + 'Z'
  return format(new Date(dateStr), fmt)
}
