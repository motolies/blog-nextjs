import {Cron} from 'croner'
import {format} from 'date-fns'

export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
export const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export const generateKoreanDescription = (expression, isSpring = false) => {
    try {
        const parts = expression.trim().split(/\s+/)

        let second
        let minute
        let hour
        let dayOfMonth
        let month
        let dayOfWeek

        if (isSpring && parts.length === 6) {
            [second, minute, hour, dayOfMonth, month, dayOfWeek] = parts
        } else if (!isSpring && parts.length === 5) {
            [minute, hour, dayOfMonth, month, dayOfWeek] = parts
            second = '0'
        } else {
            return '유효하지 않은 표현식입니다.'
        }

        const descriptions = []

        if (isSpring) {
            if (second === '*') {
                descriptions.push('매초')
            } else if (second.startsWith('*/')) {
                descriptions.push(`${second.slice(2)}초마다`)
            } else if (second !== '0') {
                descriptions.push(`${second}초에`)
            }
        }

        if (minute === '*') {
            if (!descriptions.some((description) => description.includes('초'))) {
                descriptions.push('매분')
            }
        } else if (minute.startsWith('*/')) {
            descriptions.push(`${minute.slice(2)}분마다`)
        } else if (minute.includes(',')) {
            descriptions.push(`${minute.split(',').join(', ')}분에`)
        } else if (minute.includes('-')) {
            const [start, end] = minute.split('-')
            descriptions.push(`${start}분부터 ${end}분까지 매분`)
        } else if (minute !== '0' || hour === '*') {
            descriptions.push(`${minute}분에`)
        }

        if (hour === '*') {
            if (!descriptions.some((description) => description.includes('분마다'))) {
                descriptions.push('매시')
            }
        } else if (hour.startsWith('*/')) {
            descriptions.push(`${hour.slice(2)}시간마다`)
        } else if (hour.includes(',')) {
            descriptions.push(hour.split(',').map((value) => `${value}시`).join(', '))
        } else if (hour.includes('-')) {
            const [start, end] = hour.split('-')
            descriptions.push(`${start}시부터 ${end}시까지`)
        } else {
            const parsedHour = parseInt(hour, 10)

            if (parsedHour === 0) {
                descriptions.push('자정')
            } else if (parsedHour === 12) {
                descriptions.push('정오')
            } else if (parsedHour < 12) {
                descriptions.push(`오전 ${parsedHour}시`)
            } else {
                descriptions.push(`오후 ${parsedHour - 12}시`)
            }
        }

        if (dayOfMonth !== '*' && dayOfMonth !== '?') {
            if (dayOfMonth === 'L') {
                descriptions.push('마지막 날')
            } else if (dayOfMonth.includes(',')) {
                descriptions.push(`${dayOfMonth.split(',').join(', ')}일`)
            } else if (dayOfMonth.includes('-')) {
                const [start, end] = dayOfMonth.split('-')
                descriptions.push(`${start}일부터 ${end}일까지`)
            } else {
                descriptions.push(`${dayOfMonth}일`)
            }
        }

        if (month !== '*' && month !== '?') {
            if (month.includes(',')) {
                descriptions.push(month.split(',').map((value) => MONTH_NAMES[parseInt(value, 10) - 1] || value).join(', '))
            } else if (month.includes('-')) {
                const [start, end] = month.split('-')
                descriptions.push(`${MONTH_NAMES[parseInt(start, 10) - 1]}부터 ${MONTH_NAMES[parseInt(end, 10) - 1]}까지`)
            } else {
                const parsedMonth = parseInt(month, 10)
                if (parsedMonth >= 1 && parsedMonth <= 12) {
                    descriptions.push(MONTH_NAMES[parsedMonth - 1])
                }
            }
        }

        if (dayOfWeek !== '*' && dayOfWeek !== '?') {
            if (dayOfWeek.includes('#')) {
                const [dow, nth] = dayOfWeek.split('#')
                const dayName = DAY_NAMES[parseInt(dow, 10)] || dow
                const ordinal = ['첫째', '둘째', '셋째', '넷째', '다섯째'][parseInt(nth, 10) - 1] || `${nth}번째`
                descriptions.push(`${ordinal} ${dayName}요일`)
            } else if (dayOfWeek.includes('L')) {
                const dow = dayOfWeek.replace('L', '')
                const dayName = DAY_NAMES[parseInt(dow, 10)] || dow
                descriptions.push(`마지막 ${dayName}요일`)
            } else if (dayOfWeek === '1-5' || dayOfWeek === 'MON-FRI') {
                descriptions.push('평일')
            } else if (dayOfWeek === '0,6' || dayOfWeek === '6,0' || dayOfWeek === 'SAT,SUN' || dayOfWeek === 'SUN,SAT') {
                descriptions.push('주말')
            } else if (dayOfWeek.includes(',')) {
                descriptions.push(`${dayOfWeek.split(',').map((value) => DAY_NAMES[parseInt(value, 10)] || value).join(', ')}요일`)
            } else if (dayOfWeek.includes('-')) {
                const [start, end] = dayOfWeek.split('-')
                const startDay = DAY_NAMES[parseInt(start, 10)] || start
                const endDay = DAY_NAMES[parseInt(end, 10)] || end
                descriptions.push(`${startDay}요일부터 ${endDay}요일까지`)
            } else {
                const parsedDay = parseInt(dayOfWeek, 10)

                if (parsedDay >= 0 && parsedDay <= 7) {
                    descriptions.push(`${DAY_NAMES[parsedDay === 7 ? 0 : parsedDay]}요일`)
                }
            }
        }

        if (dayOfMonth === '*' && month === '*' && (dayOfWeek === '*' || dayOfWeek === '?')) {
            if (hour === '*' && minute === '*' && (!isSpring || second === '*')) {
                return isSpring ? '매초마다 실행' : '매분마다 실행'
            }

            if (hour !== '*') {
                descriptions.unshift('매일')
            }
        } else if (dayOfWeek !== '*' && dayOfWeek !== '?' && dayOfMonth === '*') {
            descriptions.unshift('매주')
        } else if (dayOfMonth !== '*' && month === '*') {
            descriptions.unshift('매월')
        } else if (month !== '*') {
            descriptions.unshift('매년')
        }

        return `${descriptions.join(' ')} 실행`.replace(/\s+/g, ' ').trim()
    } catch (e) {
        return '표현식을 분석할 수 없습니다.'
    }
}

export const calculateNextRuns = (expression, runCount = 10, timezone = 'Asia/Seoul') => {
    try {
        const cron = new Cron(expression, {timezone})
        const runs = cron.nextRuns(runCount).map((date) => format(date, 'yyyy-MM-dd HH:mm:ss'))
        return {
            runs,
            error: null
        }
    } catch (e) {
        return {
            runs: [],
            error: e.message || '유효하지 않은 cron 표현식입니다.'
        }
    }
}
