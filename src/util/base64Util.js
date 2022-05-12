const base64Encode = (str) => {
    return btoa(unescape(encodeURIComponent(str)))
}
const base64Decode = (str) => {
    return decodeURIComponent(escape(atob(str)))
}

export {base64Encode, base64Decode}
