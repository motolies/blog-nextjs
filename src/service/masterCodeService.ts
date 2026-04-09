import axiosClient from './axiosClient'
import type { AxiosRequestConfig } from 'axios'
import type { MasterCodeCreateRequest, MasterCodeUpdateRequest, MasterCodeMoveRequest, MasterCodeReorderRequest } from '@/types/masterCode'

const MASTER_CODE_API_BASE = '/api/v1/codes'

const masterCodeService = {
  async getTree() {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_API_BASE}/tree`)
      return response.data
    } catch (error) {
      console.error('트리 조회 실패:', error)
      throw error
    }
  },

  async getSubTree(rootCode: string, config?: AxiosRequestConfig) {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_API_BASE}/tree/${rootCode}`, config)
      return response.data
    } catch (error) {
      console.error(`서브트리 조회 실패 [${rootCode}]:`, error)
      throw error
    }
  },

  async getGroups() {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_API_BASE}/groups`)
      return response.data
    } catch (error) {
      console.error('그룹 목록 조회 실패:', error)
      throw error
    }
  },

  async getNode(id: number) {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_API_BASE}/nodes/${id}`)
      return response.data
    } catch (error) {
      console.error(`노드 상세 조회 실패 [${id}]:`, error)
      throw error
    }
  },

  async createNode(data: MasterCodeCreateRequest) {
    try {
      const response = await axiosClient.post(`${MASTER_CODE_API_BASE}/nodes`, data)
      return response.data
    } catch (error) {
      console.error('노드 생성 실패:', error)
      throw error
    }
  },

  async updateNode(id: number, data: MasterCodeUpdateRequest) {
    try {
      const response = await axiosClient.put(`${MASTER_CODE_API_BASE}/nodes/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`노드 수정 실패 [${id}]:`, error)
      throw error
    }
  },

  async deleteNode(id: number) {
    try {
      const response = await axiosClient.delete(`${MASTER_CODE_API_BASE}/nodes/${id}`)
      return response.data
    } catch (error) {
      console.error(`노드 삭제 실패 [${id}]:`, error)
      throw error
    }
  },

  async moveNode(id: number, data: MasterCodeMoveRequest) {
    try {
      const response = await axiosClient.put(`${MASTER_CODE_API_BASE}/nodes/${id}/move`, data)
      return response.data
    } catch (error) {
      console.error(`노드 이동 실패 [${id}]:`, error)
      throw error
    }
  },

  async reorderNode(id: number, data: MasterCodeReorderRequest) {
    try {
      const response = await axiosClient.put(`${MASTER_CODE_API_BASE}/nodes/${id}/reorder`, data)
      return response.data
    } catch (error) {
      console.error(`정렬순서 변경 실패 [${id}]:`, error)
      throw error
    }
  },

  async search(q: string) {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_API_BASE}/search`, { params: { q } })
      return response.data
    } catch (error) {
      console.error(`검색 실패 [${q}]:`, error)
      throw error
    }
  },

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
