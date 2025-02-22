import axiosClient from './axiosClient'

const userService = {
    shake: () => {
        return axiosClient.post(`/api/auth/shake`)
    },
    login: ({username, encPassword, publicKey}) => {
        return axiosClient.post(`/api/auth/login`, {
            username: username,
            password: encPassword,
            publicKey: publicKey
        })
    },
    profile: () => {
        return axiosClient.get(`/api/auth/profile`)
    },
}

export default userService