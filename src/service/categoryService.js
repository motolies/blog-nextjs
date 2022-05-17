import axiosClient from './axiosClient'

const categoryService = {
    getCategoryFlat: () => {
        return axiosClient.get(`/api/category`)
    },
    getCategoryRoot: () => {
        return axiosClient.get(`/api/category/root`)
    },
    save: ({category}) => {
        const {id, name, pId} = category
        return axiosClient.post(`/api/category`, {id: id, name: name, pId: pId})
    },
    delete: ({id}) => {
        return axiosClient.delete(`/api/category/${id}`)
    }
}

export default categoryService