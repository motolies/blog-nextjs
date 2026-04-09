import {useQuery, useQueryClient} from '@tanstack/react-query'
import service from '../service'
import type {Tag} from '@/types/tag'

export const tagKeys = {
    all: ['tag'] as const,
    list: () => [...tagKeys.all, 'list'] as const,
}

export function useTags() {
    return useQuery<Tag[]>({
        queryKey: tagKeys.list(),
        queryFn: () => service.tag.allTags().then(res => res.data),
    })
}

export function useInvalidateTags() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({queryKey: tagKeys.all})
}
