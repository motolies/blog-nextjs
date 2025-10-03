import axiosClient from './axiosClient'

const userService = {
    shake: (config) => {
        return axiosClient.post(`/api/auth/shake`, undefined, config)
    },
    login: ({username, encPassword, publicKey}, config) => {
        return axiosClient.post(`/api/auth/login`, {
            username: username,
            password: encPassword,
            publicKey: publicKey
        }, config)
    },
    // SSR에서 쿠키/헤더를 전달할 수 있도록 config를 허용
    profile: (config) => {
        return axiosClient.get(`/api/auth/profile`, config)
    },
}

export default userService
