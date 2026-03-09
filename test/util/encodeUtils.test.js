import test from 'node:test'
import assert from 'node:assert/strict'

import {
    decodeBase64Utf8,
    decodeJwtToken,
    decodeUnicodeEscapes,
    encodeBase64Utf8,
    encodeUnicodeEscapes,
    formatJsonText,
    minifyJsonText
} from '../../src/util/encodeUtils.js'

test('UTF-8 Base64 roundtrip handles Korean and emoji', () => {
    const input = '한글 emoji 😀'
    const encoded = encodeBase64Utf8(input)

    assert.equal(decodeBase64Utf8(encoded), input)
})

test('Unicode escape encoder emits surrogate pairs for emoji', () => {
    assert.equal(encodeUnicodeEscapes('A😀'), '\\u0041\\ud83d\\ude00')
    assert.equal(decodeUnicodeEscapes('\\u0041\\ud83d\\ude00'), 'A😀')
})

test('JWT decoder parses base64url JSON payloads', () => {
    const token = [
        Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64url'),
        Buffer.from(JSON.stringify({sub: 'user-1', exp: 1735689600})).toString('base64url'),
        'signature'
    ].join('.')

    const decoded = decodeJwtToken(token)

    assert.deepEqual(decoded.header, {alg: 'HS256', typ: 'JWT'})
    assert.deepEqual(decoded.payload, {sub: 'user-1', exp: 1735689600})
    assert.equal(decoded.signature, 'signature')
})

test('JSON formatter and minifier keep parser errors explicit', () => {
    assert.equal(formatJsonText('{"name":"john","age":30}'), '{\n  "name": "john",\n  "age": 30\n}')
    assert.equal(minifyJsonText('{\n  "name": "john",\n  "age": 30\n}'), '{"name":"john","age":30}')

    assert.throws(() => formatJsonText('{"name":}'), /Unexpected token/)
})
