const fileLink = (url: string, name: string): string => {
    return `<a href="${url}" target="_blank" class="file-link">
                <span>${name}</span>
            </a>`
}

export {fileLink}
