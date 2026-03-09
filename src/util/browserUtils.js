export const isBrowserEnvironment = () => (
    typeof window !== 'undefined'
    && typeof document !== 'undefined'
)

const ensureBrowserEnvironment = () => {
    if (!isBrowserEnvironment()) {
        throw new Error('브라우저 환경에서만 사용할 수 있습니다.')
    }
}

export const copyTextToClipboard = async (text) => {
    if (!text) {
        throw new Error('복사할 내용이 없습니다.')
    }

    ensureBrowserEnvironment()

    if (!navigator?.clipboard?.writeText) {
        throw new Error('클립보드 API를 사용할 수 없습니다.')
    }

    await navigator.clipboard.writeText(text)
}

export const downloadDataUrl = (dataUrl, fileName) => {
    if (!dataUrl) {
        throw new Error('다운로드할 데이터가 없습니다.')
    }

    ensureBrowserEnvironment()

    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    link.click()
}

export const downloadBlob = (blob, fileName) => {
    if (!blob) {
        throw new Error('다운로드할 데이터가 없습니다.')
    }

    ensureBrowserEnvironment()

    const url = URL.createObjectURL(blob)

    try {
        const link = document.createElement('a')
        link.download = fileName
        link.href = url
        link.click()
    } finally {
        URL.revokeObjectURL(url)
    }
}
