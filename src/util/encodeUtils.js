const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null
const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null

const ensureTextCodec = () => {
    if (!encoder || !decoder) {
        throw new Error('텍스트 인코더를 사용할 수 없습니다.')
    }
}

const normalizeBase64Value = (value) => {
    const sanitized = value.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
    return sanitized.padEnd(sanitized.length + ((4 - sanitized.length % 4) % 4), '=')
}

const bytesToBase64 = (bytes) => {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(bytes).toString('base64')
    }

    let binary = ''
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte)
    })

    return btoa(binary)
}

const base64ToBytes = (value) => {
    const normalized = normalizeBase64Value(value)

    if (typeof Buffer !== 'undefined') {
        return Uint8Array.from(Buffer.from(normalized, 'base64'))
    }

    const binary = atob(normalized)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export const encodeBase64Utf8 = (value) => {
    ensureTextCodec()
    return bytesToBase64(encoder.encode(value))
}

export const decodeBase64Utf8 = (value) => {
    ensureTextCodec()
    return decoder.decode(base64ToBytes(value))
}

export const encodeUnicodeEscapes = (value) => (
    Array.from(value)
        .flatMap((char) => {
            const codePoint = char.codePointAt(0)

            if (codePoint <= 0xFFFF) {
                return [`\\u${codePoint.toString(16).padStart(4, '0')}`]
            }

            const normalized = codePoint - 0x10000
            const highSurrogate = 0xD800 + (normalized >> 10)
            const lowSurrogate = 0xDC00 + (normalized & 0x3FF)

            return [
                `\\u${highSurrogate.toString(16).padStart(4, '0')}`,
                `\\u${lowSurrogate.toString(16).padStart(4, '0')}`
            ]
        })
        .join('')
)

export const decodeUnicodeEscapes = (value) => (
    value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
)

export const parseJsonText = (value) => JSON.parse(value)

export const formatJsonText = (value) => JSON.stringify(parseJsonText(value), null, 2)

export const minifyJsonText = (value) => JSON.stringify(parseJsonText(value))

export const decodeBase64UrlJson = (value) => {
    const decoded = decodeBase64Utf8(value)
    return JSON.parse(decoded)
}

export const decodeJwtToken = (token) => {
    const parts = token.split('.')

    if (parts.length !== 3) {
        throw new Error('유효하지 않은 JWT 형식입니다. (header.payload.signature)')
    }

    const header = decodeBase64UrlJson(parts[0])
    const payload = decodeBase64UrlJson(parts[1])

    return {
        header,
        payload,
        signature: parts[2]
    }
}
