import {useQuery} from '@tanstack/react-query'
import service from '../service'
import type {SearchAllParam} from '@/types/post'

interface PostSearchResponse {
    totalPage: number
    list: Array<{
        id: string
        subject: string
        categoryName: string
        createDate: string | number
    }>
}

export const postSearchKeys = {
    all: ['postSearch'] as const,
    search: (params: SearchAllParam) => [...postSearchKeys.all, params] as const,
}

export function usePostSearch(searchAllParam: SearchAllParam | null) {
    return useQuery<PostSearchResponse>({
        queryKey: postSearchKeys.search(searchAllParam ?? {}),
        queryFn: () => service.post.search({searchAllParam: searchAllParam!}).then(res => res.data),
        enabled: searchAllParam !== null,
    })
}
