import {useQuery, useQueryClient} from '@tanstack/react-query'
import service from '../service'
import type {FileItem} from '@/types/file'

export const fileKeys = {
    all: ['file'] as const,
    byPost: (postId: string | null) => [...fileKeys.all, 'byPost', postId] as const,
}

export function useFiles(postId: string | null) {
    return useQuery<FileItem[]>({
        queryKey: fileKeys.byPost(postId),
        queryFn: () => service.file.fileByPostId({postId: postId!}).then(res => res.data),
        enabled: !!postId,
    })
}

export function useInvalidateFiles() {
    const queryClient = useQueryClient()
    return (postId: string | null) =>
        queryClient.invalidateQueries({queryKey: fileKeys.byPost(postId)})
}
