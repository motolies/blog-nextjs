/*
 * contentStyleSanitizer.ts
 *
 * 외부 뷰어(MD 렌더러 등)에서 복사해 붙여넣은 HTML의 "테마 적대적" 인라인 스타일을 제거하는 유틸.
 * - 포스트 렌더링(PostComponent)과 에디터 붙여넣기(CKEditorWrapper) 양쪽에서 공유.
 * - 화이트리스트 정책: color·background-color(단색 background 포함)만 조건부 유지, 나머지 전부 제거.
 * - IDE(VS Code/IntelliJ 등)에서 복사한 코드(어두운 배경 + 색상 span)는 보존 대상이므로
 *   무채색 계열의 검정 글자색·흰 배경색만 선별 제거한다.
 */

export interface CssColor {
    r: number
    g: number
    b: number
    a: number
}

const NAMED_COLORS: Record<string, CssColor> = {
    black: {r: 0, g: 0, b: 0, a: 1},
    white: {r: 255, g: 255, b: 255, a: 1},
    transparent: {r: 0, g: 0, b: 0, a: 0}
}

/**
 * CSS 색상 문자열을 RGBA로 파싱한다.
 * rgb()/rgba()(쉼표·공백 문법, % 채널·알파 포함)/#hex(3·4·6·8자리)/black·white·transparent 지원.
 * 그 외(var(), 그라데이션, hsl 등) 파싱 불가 값은 null을 반환한다.
 */
export function parseCssColor(value: string): CssColor | null {
    const v = value.trim().toLowerCase()

    if (NAMED_COLORS[v]) {
        return {...NAMED_COLORS[v]}
    }

    const hexMatch = v.match(/^#([0-9a-f]{3,8})$/)
    if (hexMatch) {
        const hex = hexMatch[1]
        if (hex.length === 3 || hex.length === 4) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16),
                a: hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1
            }
        }
        if (hex.length === 6 || hex.length === 8) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
            }
        }
        return null
    }

    const fnMatch = v.match(/^rgba?\(([^)]+)\)$/)
    if (fnMatch) {
        const parts = fnMatch[1].split(/[\s,/]+/).filter(Boolean)
        if (parts.length < 3 || parts.length > 4) {
            return null
        }
        const channels = parts.slice(0, 3).map(part => {
            const n = Number.parseFloat(part)
            return part.endsWith('%') ? (n * 255) / 100 : n
        })
        if (channels.some(n => Number.isNaN(n))) {
            return null
        }
        let a = 1
        if (parts.length === 4) {
            a = parts[3].endsWith('%') ? Number.parseFloat(parts[3]) / 100 : Number.parseFloat(parts[3])
            if (Number.isNaN(a)) {
                return null
            }
        }
        return {r: channels[0], g: channels[1], b: channels[2], a}
    }

    return null
}

/**
 * 무채색 계열의 어두운 색(검정 본문·인용문의 뮤트 그레이 텍스트 등) 여부.
 * 채널 편차 조건으로 채도 있는 어두운 신택스 색상(#cd3131, navy 등)은 제외해 보존한다.
 * (WCAG luminance는 감마 보정 탓에 채도 높은 색을 near-black으로 오판하므로 채널 기반으로 판정.
 *  임계값 128은 MD 뷰어가 인용문 등에 쓰는 #5c5c5c류 회색까지 포함하도록 실데이터 기준으로 보정한 값)
 */
export function isNearBlack(color: CssColor): boolean {
    const max = Math.max(color.r, color.g, color.b)
    const min = Math.min(color.r, color.g, color.b)
    return max <= 128 && max - min <= 30
}

/** 흰색에 가까운 밝은 색(라이트 테마 기본 배경, 밝은 회색 구분선 배경 등) 여부 */
export function isNearWhite(color: CssColor): boolean {
    return Math.min(color.r, color.g, color.b) >= 200
}

/**
 * 하위 글자색 보존 컨텍스트를 활성화할 "어두운 배경"(IDE 코드 블록 등) 여부.
 * 반투명(알파 0.5 미만)은 실제 배경을 결정하지 못하므로 제외한다.
 */
export function isDarkBackground(color: CssColor): boolean {
    return color.a >= 0.5 && Math.max(color.r, color.g, color.b) <= 128
}

/**
 * 인라인 스타일 속성의 유지 여부를 판정한다(화이트리스트).
 * - color: 어두운 배경 컨테이너 내부면 무조건 유지(다크 IDE의 밝은 기본 텍스트 보존),
 *   그 외에는 near-black·near-white(테마 충돌 원인)만 제거하고 의도된 중간톤 색은 유지.
 * - background(-color): near-white 배경은 제거, 어두운·중간톤 배경(IDE, 하이라이트)은 유지.
 * - 그 외 속성(font-family, margin, --tw-* 등): 전부 제거.
 */
export function decideStyle(name: string, value: string, inDarkContainer: boolean): boolean {
    const prop = name.trim().toLowerCase()

    if (prop === 'color') {
        const color = parseCssColor(value)
        if (!color || color.a === 0) {
            return false
        }
        if (inDarkContainer) {
            return true
        }
        return !isNearBlack(color) && !isNearWhite(color)
    }

    if (prop === 'background-color' || prop === 'background') {
        const color = parseCssColor(value)
        if (!color || color.a === 0) {
            return false
        }
        return !isNearWhite(color)
    }

    return false
}

/** style 속성 문자열을 [속성명, 값] 쌍 목록으로 분해한다 */
export function splitDeclarations(styleText: string): Array<[string, string]> {
    const declarations: Array<[string, string]> = []
    for (const decl of styleText.split(';')) {
        const idx = decl.indexOf(':')
        if (idx < 0) {
            continue
        }
        const name = decl.slice(0, idx).trim()
        const value = decl.slice(idx + 1).trim()
        if (name && value) {
            declarations.push([name, value])
        }
    }
    return declarations
}

/**
 * 요소 트리를 순회하며 테마 적대적 인라인 스타일을 제거한다.
 * "유지된 어두운 배경"을 가진 요소 하위로는 inDarkContainer를 전파해
 * IDE 코드 붙여넣기의 신택스 색상·기본 텍스트 색을 보존한다.
 */
export function sanitizeThemeHostileStyles(root: Element | DocumentFragment): void {
    if ('getAttribute' in root) {
        sanitizeElement(root, false)
        return
    }
    for (const child of Array.from(root.children)) {
        sanitizeElement(child, false)
    }
}

/** 단일 요소의 style 속성을 정화하고 자식으로 재귀한다 */
function sanitizeElement(element: Element, inDarkContainer: boolean): void {
    let childContext = inDarkContainer
    const styleText = element.getAttribute('style')

    if (styleText !== null) {
        const kept = splitDeclarations(styleText)
            .filter(([name, value]) => decideStyle(name, value, inDarkContainer))

        if (kept.length === 0) {
            element.removeAttribute('style')
        } else {
            element.setAttribute('style', kept.map(([name, value]) => `${name}:${value}`).join(';'))
            const background = kept.find(([name]) => {
                const prop = name.toLowerCase()
                return prop === 'background-color' || prop === 'background'
            })
            if (background) {
                const color = parseCssColor(background[1])
                if (color && isDarkBackground(color)) {
                    childContext = true
                }
            }
        }
    }

    for (const child of Array.from(element.children)) {
        sanitizeElement(child, childContext)
    }
}
