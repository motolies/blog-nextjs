import axiosClient from './axiosClient'

const fileService = {
    upload: ({formData}: { formData: FormData }) => {
        return axiosClient({
            url: `/api/file/admin`,
            method: "POST",
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },
    delete: ({fileId}: { fileId: string }) => {
        return axiosClient.delete(`/api/file/admin/${fileId}`)
    },
    fileByPostId: ({postId}: { postId: string }) => {
        return axiosClient.get(`/api/file/admin/list/${postId}`)
    }
}

export default fileService
