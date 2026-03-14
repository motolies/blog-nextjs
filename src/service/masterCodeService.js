import axiosClient from './axiosClient'

const MASTER_CODE_API_BASE = '/api/v1/codes'

const masterCodeService = {
  /**
   * 전체 트리 조회
   */
  async getTree() {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_API_BASE}/tree`)
      return response.data
    } catch (error) {
      console.error('트리 조회 실패:', error)
      throw error
    }
  },

  /**
   * 루트 코드별 서브트리 조회
   * @param {string} rootCode - 루트 코드
   * @param {Object} [config] - axios 요청 설정 (SSR 인증 등)
   */
  async getSubTree(rootCode, config) {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_API_BASE}/tree/${rootCode}`, config)
      return response.data
    } catch (error) {
      console.error(`서브트리 조회 실패 [${rootCode}]:`, error)
      throw error
    }
  },

  /**
   * 루트(그룹) 목록 조회
   */
  async getGroups() {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_API_BASE}/groups`)
      return response.data
    } catch (error) {
      console.error('그룹 목록 조회 실패:', error)
      throw error
    }
  },

  /**
   * 노드 상세 조회
   * @param {number} id - 노드 ID
   */
  async getNode(id) {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_API_BASE}/nodes/${id}`)
      return response.data
    } catch (error) {
      console.error(`노드 상세 조회 실패 [${id}]:`, error)
      throw error
    }
  },

  /**
   * 노드 생성
   * @param {Object} data - 노드 데이터
   */
  async createNode(data) {
    try {
      const response = await axiosClient.post(`${MASTER_CODE_API_BASE}/nodes`, data)
      return response.data
    } catch (error) {
      console.error('노드 생성 실패:', error)
      throw error
    }
  },

  /**
   * 노드 수정
   * @param {number} id - 노드 ID
   * @param {Object} data - 수정 데이터
   */
  async updateNode(id, data) {
    try {
      const response = await axiosClient.put(`${MASTER_CODE_API_BASE}/nodes/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`노드 수정 실패 [${id}]:`, error)
      throw error
    }
  },

  /**
   * 노드 삭제
   * @param {number} id - 노드 ID
   */
  async deleteNode(id) {
    try {
      const response = await axiosClient.delete(`${MASTER_CODE_API_BASE}/nodes/${id}`)
      return response.data
    } catch (error) {
      console.error(`노드 삭제 실패 [${id}]:`, error)
      throw error
    }
  },

  /**
   * 노드 이동 (부모 변경)
   * @param {number} id - 노드 ID
   * @param {Object} data - 이동 데이터 { newParentId }
   */
  async moveNode(id, data) {
    try {
      const response = await axiosClient.put(`${MASTER_CODE_API_BASE}/nodes/${id}/move`, data)
      return response.data
    } catch (error) {
      console.error(`노드 이동 실패 [${id}]:`, error)
      throw error
    }
  },

  /**
   * 정렬순서 변경
   * @param {number} id - 노드 ID
   * @param {Object} data - 정렬 데이터 { sort }
   */
  async reorderNode(id, data) {
    try {
      const response = await axiosClient.put(`${MASTER_CODE_API_BASE}/nodes/${id}/reorder`, data)
      return response.data
    } catch (error) {
      console.error(`정렬순서 변경 실패 [${id}]:`, error)
      throw error
    }
  },

  /**
   * 이름/코드 검색
   * @param {string} q - 검색어
   */
  async search(q) {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_API_BASE}/search`, { params: { q } })
      return response.data
    } catch (error) {
      console.error(`검색 실패 [${q}]:`, error)
      throw error
    }
  },

  /**
   * 전체 캐시 삭제
   */
  async evictAllCaches() {
    try {
      const response = await axiosClient.post('/api/cache/admin/evict-all')
      return response.data
    } catch (error) {
      console.error('전체 캐시 삭제 실패:', error)
      throw error
    }
  },
}

export default masterCodeService
