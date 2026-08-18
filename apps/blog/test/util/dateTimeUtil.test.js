import test from 'node:test'
import assert from 'node:assert/strict'

import {
    formatLocalDate,
    formatLocalDateTime,
    formatUtcToLocal,
    parseServerDate
} from '../../src/util/dateTimeUtil.ts'

test('Offset-aware strings are parsed as-is (Z, +00:00, +09:00, Jira +0900)', () => {
    assert.equal(parseServerDate('2026-07-13T02:00:00Z').toISOString(), '2026-07-13T02:00:00.000Z')
    assert.equal(parseServerDate('2026-07-13T02:00:00+00:00').toISOString(), '2026-07-13T02:00:00.000Z')
    assert.equal(parseServerDate('2026-07-13T02:00:00+09:00').toISOString(), '2026-07-12T17:00:00.000Z')
    assert.equal(parseServerDate('2026-07-13T02:00:00.000+0900').toISOString(), '2026-07-12T17:00:00.000Z')
})

test('Naive strings without offset fall back to UTC interpretation', () => {
    assert.equal(parseServerDate('2026-07-13T02:00:00').toISOString(), '2026-07-13T02:00:00.000Z')
    // 구 백엔드 포맷: 공백 구분자 + 마이크로초, 오프셋 없음
    assert.equal(parseServerDate('2026-07-13 02:00:00.123456').toISOString(), '2026-07-13T02:00:00.123Z')
})

test('Fractional seconds are truncated to milliseconds regardless of offset', () => {
    assert.equal(parseServerDate('2026-07-13T02:00:00.123456Z').toISOString(), '2026-07-13T02:00:00.123Z')
    assert.equal(parseServerDate('2026-07-13T02:00:00.123456').toISOString(), '2026-07-13T02:00:00.123Z')
})

test('Epoch number input is parsed directly', () => {
    assert.equal(parseServerDate(0).toISOString(), '1970-01-01T00:00:00.000Z')
    assert.equal(parseServerDate(Date.UTC(2026, 6, 13, 2, 0, 0)).toISOString(), '2026-07-13T02:00:00.000Z')
})

test('Invalid and empty inputs return null / empty string', () => {
    assert.equal(parseServerDate(null), null)
    assert.equal(parseServerDate(undefined), null)
    assert.equal(parseServerDate(''), null)
    assert.equal(parseServerDate('not-a-date'), null)

    assert.equal(formatUtcToLocal(null), '')
    assert.equal(formatUtcToLocal(undefined), '')
    assert.equal(formatUtcToLocal(''), '')
    assert.equal(formatUtcToLocal('not-a-date'), '')
})

test('Naive and explicit-Z of the same wall clock format identically', () => {
    assert.equal(
        formatUtcToLocal('2026-07-13T02:00:00'),
        formatUtcToLocal('2026-07-13T02:00:00Z')
    )
})

test('Format variants apply their default patterns (timezone-independent shape)', () => {
    assert.match(formatUtcToLocal('2026-07-13T02:00:00Z'), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/)
    assert.match(formatLocalDate('2026-07-13T02:00:00Z'), /^\d{4}-\d{2}-\d{2}$/)
    assert.match(formatLocalDateTime('2026-07-13T02:00:00Z'), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    // 명시 포맷 인자도 존중한다
    assert.match(formatUtcToLocal('2026-07-13T02:00:00Z', 'yyyy-MM-dd HH:mm:ss'), /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
})
