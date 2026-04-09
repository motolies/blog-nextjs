import {useCallback, useEffect, useRef} from 'react'

export const usePostNavigationShortcut = (keys: string[], callback: (event: KeyboardEvent) => void, node: EventTarget | null = null): void => {
    const callbackRef = useRef(callback)
    useEffect(() => {
        callbackRef.current = callback
    })

    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            if (keys.some(key => event.key === key)) {
                callbackRef.current(event)
            }
        },
        [keys]
    )

    useEffect(() => {
        const targetNode = node ?? document
        targetNode &&
        targetNode.addEventListener("keydown", handleKeyPress as EventListener)

        return () =>
            targetNode &&
            targetNode.removeEventListener("keydown", handleKeyPress as EventListener)
    }, [handleKeyPress, node])
}
