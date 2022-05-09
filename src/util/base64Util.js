const base64Encode = (str) => {
    return window.btoa(encodeURIComponent(str))
}
const base64Decode = (str) => {
    return decodeURIComponent(window.atob(str))
}

export {base64Encode, base64Decode}
