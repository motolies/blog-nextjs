import React from 'react'
import moment from 'moment'
import {Stack, Typography} from '@mui/material'
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import {AdapterMoment} from '@mui/x-date-pickers/AdapterMoment'
import {DatePicker} from '@mui/x-date-pickers/DatePicker'
import {useSnackbar} from 'notistack'

/**
 * 날짜 범위 선택 공통 컴포넌트
 *
 * @param {Object} props
 * @param {string} props.fromValue - 시작일 (YYYY-MM-DD)
 * @param {string} props.toValue - 종료일 (YYYY-MM-DD)
 * @param {Function} props.onFromChange - 시작일 변경 콜백 (value: string) => void
 * @param {Function} props.onToChange - 종료일 변경 콜백 (value: string) => void
 * @param {string} props.fromLabel - 시작일 라벨 (default: '시작일')
 * @param {string} props.toLabel - 종료일 라벨 (default: '종료일')
 * @param {'small'|'medium'} props.size - 입력 필드 크기 (default: 'small')
 */
export default function DateRangePicker({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  fromLabel = '시작일',
  toLabel = '종료일',
  size = 'small',
}) {
  const {enqueueSnackbar} = useSnackbar()

  const handleFromChange = (date) => {
    const newFrom = date ? date.format('YYYY-MM-DD') : ''
    if (newFrom && toValue && moment(newFrom, 'YYYY-MM-DD').isAfter(moment(toValue, 'YYYY-MM-DD'))) {
      onFromChange(toValue)
      onToChange(newFrom)
      enqueueSnackbar('시작일이 종료일보다 커서 자동으로 변환되었습니다.', {variant: 'info'})
    } else {
      onFromChange(newFrom)
    }
  }

  const handleToChange = (date) => {
    const newTo = date ? date.format('YYYY-MM-DD') : ''
    if (fromValue && newTo && moment(fromValue, 'YYYY-MM-DD').isAfter(moment(newTo, 'YYYY-MM-DD'))) {
      onFromChange(newTo)
      onToChange(fromValue)
      enqueueSnackbar('시작일이 종료일보다 커서 자동으로 변환되었습니다.', {variant: 'info'})
    } else {
      onToChange(newTo)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Stack direction="row" spacing={1} alignItems="center">
        <DatePicker
          label={fromLabel}
          value={fromValue ? moment(fromValue, 'YYYY-MM-DD') : null}
          onChange={handleFromChange}
          format="YYYY-MM-DD"
          slotProps={{textField: {size, sx: {minWidth: 150}}}}
        />
        <Typography variant="body2" sx={{color: 'text.secondary'}}>~</Typography>
        <DatePicker
          label={toLabel}
          value={toValue ? moment(toValue, 'YYYY-MM-DD') : null}
          onChange={handleToChange}
          format="YYYY-MM-DD"
          slotProps={{textField: {size, sx: {minWidth: 150}}}}
        />
      </Stack>
    </LocalizationProvider>
  )
}
