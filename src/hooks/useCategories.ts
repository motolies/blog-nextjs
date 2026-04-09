import {useQuery, useQueryClient} from '@tanstack/react-query'
import service from '../service'
import type {Category, CategoryTreeNode} from '@/types/category'

export const categoryKeys = {
    all: ['category'] as const,
    flat: () => [...categoryKeys.all, 'flat'] as const,
    tree: () => [...categoryKeys.all, 'tree'] as const,
}

export function useCategoryFlat() {
    return useQuery<Category[]>({
        queryKey: categoryKeys.flat(),
        queryFn: () => service.category.getCategoryFlat().then(res => res.data),
        staleTime: 5 * 60 * 1000,
    })
}

export function useCategoryTree() {
    return useQuery<CategoryTreeNode>({
        queryKey: categoryKeys.tree(),
        queryFn: () => service.category.getCategoryRoot().then(res => res.data),
        staleTime: 5 * 60 * 1000,
    })
}

export function useInvalidateCategories() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({queryKey: categoryKeys.all})
}
