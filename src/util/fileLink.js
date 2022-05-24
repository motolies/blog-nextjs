const fileLink = (url, name) => {
    return `<a href="${url}" target="_blank" class="file-link">
                <span>${name}</span>
            </a>`
}

export {fileLink}