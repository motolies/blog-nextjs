import axiosClient from './axiosClient'
import type { AxiosRequestConfig } from 'axios'
import type { MasterCodeCreateRequest, MasterCodeUpdateRequest, MasterCodeMoveRequest, MasterCodeReorderRequest } from '@/types/masterCode'

// 공개(비인증) 조회용 base. 응답에서 민감 attribute는 백엔드가 제거한다.
const MASTER_CODE_PUBLIC_BASE = '/api/codes'
// 관리자 전용(읽기+쓰기) base. /api/*/admin/** 패턴으로 ROLE_ADMIN 인가가 강제된다.
const MASTER_CODE_ADMIN_BASE = '/api/codes/admin'

const masterCodeService = {
  async getTree() {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_ADMIN_BASE}/tree`)
      return response.data
    } catch (error) {
      console.error('트리 조회 실패:', error)
      throw error
    }
  },

  async getSubTree(rootCode: string, config?: AxiosRequestConfig) {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_PUBLIC_BASE}/tree/${rootCode}`, config)
      return response.data
    } catch (error) {
      console.error(`서브트리 조회 실패 [${rootCode}]:`, error)
      throw error
    }
  },

  async getGroups() {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_ADMIN_BASE}/groups`)
      return response.data
    } catch (error) {
      console.error('그룹 목록 조회 실패:', error)
      throw error
    }
  },

  async getNode(id: number) {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_ADMIN_BASE}/nodes/${id}`)
      return response.data
    } catch (error) {
      console.error(`노드 상세 조회 실패 [${id}]:`, error)
      throw error
    }
  },

  async createNode(data: MasterCodeCreateRequest) {
    try {
      const response = await axiosClient.post(`${MASTER_CODE_ADMIN_BASE}/nodes`, data)
      return response.data
    } catch (error) {
      console.error('노드 생성 실패:', error)
      throw error
    }
  },

  async updateNode(id: number, data: MasterCodeUpdateRequest) {
    try {
      const response = await axiosClient.put(`${MASTER_CODE_ADMIN_BASE}/nodes/${id}`, data)
      return response.data
    } catch (error) {
      console.error(`노드 수정 실패 [${id}]:`, error)
      throw error
    }
  },

  async deleteNode(id: number) {
    try {
      const response = await axiosClient.delete(`${MASTER_CODE_ADMIN_BASE}/nodes/${id}`)
      return response.data
    } catch (error) {
      console.error(`노드 삭제 실패 [${id}]:`, error)
      throw error
    }
  },

  async moveNode(id: number, data: MasterCodeMoveRequest) {
    try {
      const response = await axiosClient.put(`${MASTER_CODE_ADMIN_BASE}/nodes/${id}/move`, data)
      return response.data
    } catch (error) {
      console.error(`노드 이동 실패 [${id}]:`, error)
      throw error
    }
  },

  async reorderNode(id: number, data: MasterCodeReorderRequest) {
    try {
      const response = await axiosClient.put(`${MASTER_CODE_ADMIN_BASE}/nodes/${id}/reorder`, data)
      return response.data
    } catch (error) {
      console.error(`정렬순서 변경 실패 [${id}]:`, error)
      throw error
    }
  },

  async search(q: string) {
    try {
      const response = await axiosClient.get(`${MASTER_CODE_ADMIN_BASE}/search`, { params: { q } })
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
