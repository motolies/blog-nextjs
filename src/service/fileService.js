import axiosClient from './axiosClient'

const fileService = {
    upload: ({formData}) => {
        return axiosClient({
            url: `/api/file`,
            method: "POST",
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },
    delete: ({fileId}) => {
        return axiosClient.delete(`/api/file/${fileId}`)
    }
}

export default fileService