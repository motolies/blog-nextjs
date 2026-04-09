import axiosClient from './axiosClient'
import type { AxiosRequestConfig } from 'axios'
import type { LoginRequest } from '@/types/user'

const userService = {
    shake: (config?: AxiosRequestConfig) => {
        return axiosClient.post(`/api/auth/shake`, undefined, config)
    },
    login: ({username, encPassword, publicKey}: LoginRequest, config?: AxiosRequestConfig) => {
        return axiosClient.post(`/api/auth/login`, {
            username: username,
            password: encPassword,
            publicKey: publicKey
        }, config)
    },
    profile: (config?: AxiosRequestConfig) => {
        return axiosClient.get(`/api/auth/profile`, config)
    },
}

export default userService
