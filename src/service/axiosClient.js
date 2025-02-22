import axios from 'axios'

const axiosClient = axios.create({
    baseURL:
        process.env.NODE_ENV === 'development'
            ? process.env.BLOG_URL_DEV
            : process.env.BLOG_URL_PROD,
    withCredentials: true,
})

axiosClient.defaults.headers.post['Content-Type'] = 'application/json'

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
