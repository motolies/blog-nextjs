import test from 'node:test'
import assert from 'node:assert/strict'

import {calculateNextRuns, generateKoreanDescription} from '../../src/util/crontabUtils.js'

test('Cron description keeps common unix phrases readable', () => {
    assert.equal(generateKoreanDescription('0 0 * * *'), '매일 자정 실행')
    assert.equal(generateKoreanDescription('0 9 * * 1-5'), '매주 오전 9시 평일 실행')
})

test('Cron description supports special characters used in presets', () => {
    assert.equal(generateKoreanDescription('0 0 L * *'), '매월 자정 마지막 날 실행')
    assert.equal(generateKoreanDescription('0 0 * * 5#3'), '매주 자정 셋째 금요일 실행')
})

test('Cron run calculator returns runs for valid expressions and errors for invalid expressions', () => {
    const valid = calculateNextRuns('0 0 * * *', 2)
    const invalid = calculateNextRuns('invalid cron', 2)

    assert.equal(valid.error, null)
    assert.equal(valid.runs.length, 2)
    assert.ok(valid.runs.every((value) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)))

    assert.equal(invalid.runs.length, 0)
    assert.ok(invalid.error)
})
