import test from 'node:test'
import assert from 'node:assert/strict'

import {normalizeHeadingDepths} from '../../src/util/tocUtils.ts'

test('Empty input yields an empty result', () => {
    assert.deepEqual(normalizeHeadingDepths([], 3), [])
})

test('h1 + h2 문서는 0단계와 1단계로 나뉜다 (post/1211 패턴)', () => {
    assert.deepEqual(normalizeHeadingDepths([1, 2, 2, 1, 2], 3), [0, 1, 1, 0, 1])
})

test('h2부터 시작하는 문서는 h2가 0단계로 정규화된다', () => {
    assert.deepEqual(normalizeHeadingDepths([2, 3, 3, 2], 3), [0, 1, 1, 0])
})

test('중간 레벨을 건너뛰어도 단계가 비지 않는다', () => {
    assert.deepEqual(normalizeHeadingDepths([1, 3, 4], 3), [0, 1, 2])
    assert.deepEqual(normalizeHeadingDepths([2, 4], 3), [0, 1])
})

test('단일 레벨만 있는 문서는 전부 0단계다', () => {
    assert.deepEqual(normalizeHeadingDepths([2, 2, 2], 3), [0, 0, 0])
    assert.deepEqual(normalizeHeadingDepths([4], 3), [0])
})

test('maxDepth를 넘는 깊이는 클램프된다', () => {
    assert.deepEqual(normalizeHeadingDepths([1, 2, 3, 4, 5, 6], 3), [0, 1, 2, 3, 3, 3])
    assert.deepEqual(normalizeHeadingDepths([1, 2, 3], 1), [0, 1, 1])
})

test('입력 배열의 순서와 길이가 그대로 유지된다', () => {
    const levels = [3, 1, 2, 1, 3]
    const depths = normalizeHeadingDepths(levels, 3)
    assert.equal(depths.length, levels.length)
    assert.deepEqual(depths, [2, 0, 1, 0, 2])
})
