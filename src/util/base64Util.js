const base64Encode = (str) => {
    return window.btoa(unescape(encodeURIComponent(str)))
}
const base64Decode = (str) => {
    return decodeURIComponent(escape(window.atob(str)))
}

export {base64Encode, base64Decode}
