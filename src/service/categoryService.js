import axiosClient from './axiosClient'

const categoryService = {
    getCategoryFlat: () => {
        return axiosClient.get(`/api/category`)
    },
    getCategoryRoot: () => {
        return axiosClient.get(`/api/category/root`)
    },
    save: ({category}) => {
        const {id, name, parentId} = category
        return axiosClient.post(`/api/category/admin`, {id: id, name: name, parentId: parentId})
    },
    update: ({category}) => {
        const {id, name, parentId} = category
        return axiosClient.put(`/api/category/admin/${category.id}`, {name: name, parentId: parentId})
    },
    delete: ({id}) => {
        return axiosClient.delete(`/api/category/admin/${id}`)
    }
}

export default categoryService