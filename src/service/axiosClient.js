import axios from 'axios'
import {getBackendBaseUrl} from '../lib/backendUrl'

const CLIENT_TIMEZONE_HEADER = 'X-Client-Timezone'
const CLIENT_UTC_OFFSET_HEADER = 'X-Client-Utc-Offset-Minutes'

const axiosClient = axios.create({
    withCredentials: true,
})

axiosClient.defaults.headers.post['Content-Type'] = 'application/json'

axiosClient.interceptors.request.use((config) => {
    config.baseURL = typeof window === 'undefined'
        ? getBackendBaseUrl()
        : ''

    if (typeof window !== 'undefined') {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const offsetMinutes = -new Date().getTimezoneOffset()

        config.headers = config.headers ?? {}
        config.headers[CLIENT_TIMEZONE_HEADER] = timeZone
        config.headers[CLIENT_UTC_OFFSET_HEADER] = String(offsetMinutes)
    }

    return config
})

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
