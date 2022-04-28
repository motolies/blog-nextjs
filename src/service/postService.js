import axiosClient from './axiosClient'

const postService = {
    mainPost: () => {
        return axiosClient.get(`/api/post`)
    },
    getPost: ({postId}) => {
        return axiosClient.get(`/api/post/${postId}`)
    },
}

export default postService