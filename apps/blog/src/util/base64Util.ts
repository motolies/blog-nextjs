// URL-safe base64(패딩 없음)로 인코딩한다. 표준 base64 후 +/- /_ 치환하고 = 패딩을 제거 (Java Base64.getUrlDecoder 호환)
const base64Encode = (str: string): string => {
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}
// URL-safe 및 구 표준 base64 모두 디코딩한다. URL-safe 문자를 표준으로 되돌리고 누락된 패딩을 복원
const base64Decode = (str: string): string => {
    let s = str.replace(/-/g, '+').replace(/_/g, '/')
    const pad = s.length % 4
    if (pad) s += '='.repeat(4 - pad)
    return decodeURIComponent(escape(atob(s)))
}

export {base64Encode, base64Decode}
