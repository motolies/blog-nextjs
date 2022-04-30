import axiosClient from './axiosClient'

const categoryService = {
    getCategoryFlat: () => {
        return axiosClient.get(`/api/category`)
    },
    getCategoryRoot: () => {
        return axiosClient.get(`/api/category/root`)
    },
}

export default categoryService