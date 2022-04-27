import axios from 'axios'

const axiosClient = axios.create({
    baseURL:
        process.env.NODE_ENV === 'development'
            ? process.env.BLOG_URL_DEV
            : process.env.BLOG_URL_PROD,
    withCredentials: true,
})

axiosClient.defaults.headers.post['Content-Type'] = 'application/json'

export default axiosClient
