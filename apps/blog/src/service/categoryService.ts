import axiosClient from './axiosClient'
import type { Category } from '@/types/category'

const categoryService = {
    getCategoryFlat: () => {
        return axiosClient.get(`/api/category`)
    },
    getCategoryRoot: () => {
        return axiosClient.get(`/api/category/root`)
    },
    save: ({category}: { category: Category }) => {
        const {id, name, parentId} = category
        return axiosClient.post(`/api/category/admin`, {id: id, name: name, parentId: parentId})
    },
    update: ({category}: { category: Category }) => {
        const {id, name, parentId} = category
        return axiosClient.put(`/api/category/admin/${category.id}`, {name: name, parentId: parentId})
    },
    delete: ({id}: { id: string }) => {
        return axiosClient.delete(`/api/category/admin/${id}`)
    }
}

export default categoryService
