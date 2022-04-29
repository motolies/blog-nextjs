import axiosClient from './axiosClient'

const categoryService = {
    getCategory: () => {
        return axiosClient.get(`/api/category`)
    },

}

export default categoryService