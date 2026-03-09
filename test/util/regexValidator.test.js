import test from 'node:test'
import assert from 'node:assert/strict'

import {
    analyzeCompatibility,
    executeRegexTest,
    validateBasicSyntax
} from '../../src/util/regexValidator.js'

test('Python named groups are marked as browser-convertible', () => {
    const result = analyzeCompatibility('(?P<year>\\d{4})-(?P<month>\\d{2})', 'python')

    assert.equal(result.isJsCompatible, false)
    assert.equal(result.canRunInBrowser, true)
    assert.equal(result.canConvert, true)
    assert.equal(result.convertedPattern, '(?<year>\\d{4})-(?<month>\\d{2})')
    assert.match(result.warnings[0].message, /변환/)
})

test('Atomic groups remain browser-incompatible', () => {
    const result = analyzeCompatibility('(?>abc)', 'java')

    assert.equal(result.canRunInBrowser, false)
    assert.equal(result.canConvert, false)
    assert.equal(result.warnings[0].severity, 'error')
})

test('Python named groups execute after conversion', () => {
    const result = executeRegexTest('(?P<year>\\d{4})-(?P<month>\\d{2})', '2024-01', {g: true}, 'python')

    assert.equal(result.success, true)
    assert.equal(result.matchCount, 1)
    assert.deepEqual(result.matches[0].namedGroups, {year: '2024', month: '01'})
})

test('Basic syntax validator catches unbalanced delimiters', () => {
    const result = validateBasicSyntax('(?<year>\\d{4}')

    assert.equal(result.isValid, false)
    assert.match(result.errors.join(' '), /괄호/)
})
