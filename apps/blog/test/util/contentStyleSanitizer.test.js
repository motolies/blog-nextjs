import test from 'node:test'
import assert from 'node:assert/strict'

import {
    decideStyle,
    isDarkBackground,
    isNearBlack,
    isNearWhite,
    parseCssColor,
    splitDeclarations
} from '../../src/util/contentStyleSanitizer.ts'

test('parseCssColor parses hex, rgb, rgba, named colors', () => {
    assert.deepEqual(parseCssColor('#000'), {r: 0, g: 0, b: 0, a: 1})
    assert.deepEqual(parseCssColor('#cd3131'), {r: 205, g: 49, b: 49, a: 1})
    assert.deepEqual(parseCssColor('#ffffff80'), {r: 255, g: 255, b: 255, a: 128 / 255})
    assert.deepEqual(parseCssColor('rgb(255, 255, 255)'), {r: 255, g: 255, b: 255, a: 1})
    assert.deepEqual(parseCssColor('rgba(0, 0, 0, 0.5)'), {r: 0, g: 0, b: 0, a: 0.5})
    assert.deepEqual(parseCssColor('rgb(0 0 0 / 50%)'), {r: 0, g: 0, b: 0, a: 0.5})
    assert.deepEqual(parseCssColor('rgb(100%, 0%, 0%)'), {r: 255, g: 0, b: 0, a: 1})
    assert.deepEqual(parseCssColor('WHITE'), {r: 255, g: 255, b: 255, a: 1})
    assert.equal(parseCssColor('transparent').a, 0)
})

test('parseCssColor returns null for unparseable values', () => {
    assert.equal(parseCssColor('var(--foo)'), null)
    assert.equal(parseCssColor('hsl(0, 100%, 50%)'), null)
    assert.equal(parseCssColor('linear-gradient(#fff, #000)'), null)
    assert.equal(parseCssColor('url(data:image/png;base64,xx)'), null)
    assert.equal(parseCssColor('#12345'), null)
    assert.equal(parseCssColor('rgb(a, b, c)'), null)
})

test('isNearBlack detects achromatic dark colors but keeps saturated syntax colors', () => {
    assert.equal(isNearBlack(parseCssColor('rgb(0, 0, 0)')), true)
    assert.equal(isNearBlack(parseCssColor('#333333')), true)
    // MD 뷰어가 인용문에 쓰는 뮤트 그레이도 near-black으로 제거 대상
    assert.equal(isNearBlack(parseCssColor('rgb(92, 92, 92)')), true)
    // 채도 있는 어두운 색(신택스 하이라이트)은 near-black이 아님
    assert.equal(isNearBlack(parseCssColor('#cd3131')), false)
    assert.equal(isNearBlack(parseCssColor('#000080')), false)
    // 밝은 회색(다크 IDE 기본 텍스트)은 어둡지 않음
    assert.equal(isNearBlack(parseCssColor('#abb2bf')), false)
})

test('isNearWhite detects light backgrounds and text', () => {
    assert.equal(isNearWhite(parseCssColor('rgb(255, 255, 255)')), true)
    // GitHub 코드 블록 배경, MD 뷰어 구분선(hr) 배경
    assert.equal(isNearWhite(parseCssColor('rgb(246, 248, 250)')), true)
    assert.equal(isNearWhite(parseCssColor('rgb(214, 214, 214)')), true)
    // One Dark 기본 텍스트(밝은 회색)는 near-white 아님
    assert.equal(isNearWhite(parseCssColor('#abb2bf')), false)
    assert.equal(isNearWhite({r: 255, g: 255, b: 0, a: 1}), false)
})

test('isDarkBackground matches IDE code block backgrounds only', () => {
    // VS Code / JetBrains / One Dark 배경
    assert.equal(isDarkBackground(parseCssColor('rgb(30, 30, 30)')), true)
    assert.equal(isDarkBackground(parseCssColor('rgb(43, 43, 43)')), true)
    assert.equal(isDarkBackground(parseCssColor('rgb(40, 44, 52)')), true)
    // 밝은 배경, 반투명 배경은 컨텍스트 전파 대상 아님
    assert.equal(isDarkBackground(parseCssColor('rgb(255, 255, 0)')), false)
    assert.equal(isDarkBackground(parseCssColor('rgba(30, 30, 30, 0.3)')), false)
})

test('decideStyle removes theme-hostile colors outside dark containers', () => {
    // MD 뷰어가 남기는 검정 글자·흰 배경 제거
    assert.equal(decideStyle('color', 'rgb(0, 0, 0)', false), false)
    assert.equal(decideStyle('color', '#ffffff', false), false)
    assert.equal(decideStyle('background-color', 'rgb(255, 255, 255)', false), false)
    assert.equal(decideStyle('background', 'rgb(246, 248, 250)', false), false)
    // 의도된 중간톤 색·어두운 배경은 유지
    assert.equal(decideStyle('color', '#c586c0', false), true)
    assert.equal(decideStyle('background-color', 'rgb(30, 30, 30)', false), true)
    assert.equal(decideStyle('background-color', 'rgb(255, 255, 0)', false), true)
})

test('decideStyle keeps any text color inside dark containers', () => {
    // 다크 IDE의 밝은 기본 텍스트도 어두운 배경 안에서는 보존
    assert.equal(decideStyle('color', '#abb2bf', true), true)
    assert.equal(decideStyle('color', 'rgb(212, 212, 212)', true), true)
    assert.equal(decideStyle('color', '#000000', true), true)
})

test('decideStyle drops all non-whitelisted properties', () => {
    assert.equal(decideStyle('font-family', 'Helvetica, sans-serif', false), false)
    assert.equal(decideStyle('font-size', '2.25em', false), false)
    assert.equal(decideStyle('margin-top', '1em', false), false)
    assert.equal(decideStyle('--tw-ring-offset-color', '#fff', false), false)
    assert.equal(decideStyle('orphans', '2', false), false)
    assert.equal(decideStyle('white-space', 'normal', false), false)
    // 파싱 불가·투명 색상 값도 제거
    assert.equal(decideStyle('color', 'var(--foreground)', false), false)
    assert.equal(decideStyle('background-color', 'transparent', false), false)
    assert.equal(decideStyle('background', 'url(image.png) repeat', false), false)
})

test('splitDeclarations parses style attribute text', () => {
    assert.deepEqual(
        splitDeclarations('color:rgb(0, 0, 0);background-color:rgb(255, 255, 255);'),
        [
            ['color', 'rgb(0, 0, 0)'],
            ['background-color', 'rgb(255, 255, 255)']
        ]
    )
    // 빈 항목, 콜론 없는 항목은 무시
    assert.deepEqual(splitDeclarations(';;color:red;broken;'), [['color', 'red']])
    assert.deepEqual(splitDeclarations(''), [])
})
