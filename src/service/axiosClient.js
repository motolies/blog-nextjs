import axios from 'axios'

const axiosClient = axios.create({
    baseURL:
        process.env.NODE_ENV === 'development'
            ? process.env.BLOG_URL_DEV
            : process.env.BLOG_URL_PROD,
    withCredentials: true,
})

axiosClient.defaults.headers.post['Content-Type'] = 'application/json'

// 요청 인터셉터 (디버깅용)
axiosClient.interceptors.request.use(
    (config) => {
        if (typeof window === 'undefined') {
            console.log('[SSR Axios] Request URL:', config.url)
            console.log('[SSR Axios] Request Headers:', JSON.stringify(config.headers, null, 2))
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터
axiosClient.interceptors.response.use(
    (response) => {
        // 서버에서 내려준 response.data 안에 data가 있을 때
        if (response.data && response.data.data) {
            // response.data를 서버에서 주는 data 필드로 덮어씌움
            response.data = response.data.data;
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosClient
