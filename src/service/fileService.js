import axiosClient from './axiosClient'

const fileService = {
    upload: ({formData}) => {
        return axiosClient({
            url: `/api/file/admin`,
            method: "POST",
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },
    delete: ({fileId}) => {
        return axiosClient.delete(`/api/file/admin/${fileId}`)
    },
    fileByPostId: ({postId}) => {
        return axiosClient.get(`/api/file/admin/list/${postId}`)
    }
}

export default fileService