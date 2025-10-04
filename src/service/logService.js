import axiosClient from './axiosClient'

const LOG_API_BASE = '/api/log/admin'

class LogService {
  /**
   * 시스템 로그 검색
   * @param {Object} searchRequest - 검색 조건
   * @param {number} searchRequest.page - 페이지 번호 (0부터 시작)
   * @param {number} searchRequest.pageSize - 페이지 크기
   * @param {Array} searchRequest.orderBy - 정렬 조건 [{column, direction}]
   * @param {string} searchRequest.traceId - Trace ID
   * @param {string} searchRequest.spanId - Span ID
   * @param {string} searchRequest.requestUri - Request URI
   * @param {string} searchRequest.controllerName - Controller 이름
   * @param {string} searchRequest.methodName - Method 이름
   * @param {string} searchRequest.httpMethodType - HTTP Method (GET, POST, etc.)
   * @param {string} searchRequest.remoteAddr - Remote IP
   * @param {string} searchRequest.status - Status
   * @param {string} searchRequest.createdAtFrom - 생성일시 시작
   * @param {string} searchRequest.createdAtTo - 생성일시 종료
   * @param {Object} config - Axios config (for authentication)
   * @returns {Promise} PageResponse<SystemLog>
   */
  searchSystemLogs = async ({searchRequest}, config) => {
    const response = await axiosClient.post(
      `${LOG_API_BASE}/system/search`,
      searchRequest,
      config
    )
    return response.data
  }

  /**
   * API 로그 검색
   * @param {Object} searchRequest - 검색 조건
   * @param {number} searchRequest.page - 페이지 번호 (0부터 시작)
   * @param {number} searchRequest.pageSize - 페이지 크기
   * @param {Array} searchRequest.orderBy - 정렬 조건 [{column, direction}]
   * @param {string} searchRequest.traceId - Trace ID
   * @param {string} searchRequest.spanId - Span ID
   * @param {string} searchRequest.requestUri - Request URI
   * @param {string} searchRequest.httpMethodType - HTTP Method (GET, POST, etc.)
   * @param {string} searchRequest.responseStatus - Response Status
   * @param {string} searchRequest.createdAtFrom - 생성일시 시작
   * @param {string} searchRequest.createdAtTo - 생성일시 종료
   * @param {Object} config - Axios config (for authentication)
   * @returns {Promise} PageResponse<ApiLog>
   */
  searchApiLogs = async ({searchRequest}, config) => {
    const response = await axiosClient.post(
      `${LOG_API_BASE}/api/search`,
      searchRequest,
      config
    )
    return response.data
  }
}

const logService = new LogService()
export default logService
