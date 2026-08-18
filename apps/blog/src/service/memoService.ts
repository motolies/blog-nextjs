import axiosClient from './axiosClient'
import type { MemoSearchRequest } from '@/types/memo'

const MEMO_API = '/api/memo/admin'
const MEMO_CATEGORY_API = '/api/memo-category/admin'

class MemoService {

  create = async (data: Record<string, unknown>) => {
    const response = await axiosClient.post(MEMO_API, data)
    return response.data
  }

  getById = async (id: string | number) => {
    const response = await axiosClient.get(`${MEMO_API}/${id}`)
    return response.data
  }

  update = async (id: string | number, data: Record<string, unknown>) => {
    const response = await axiosClient.put(`${MEMO_API}/${id}`, data)
    return response.data
  }

  delete = async (id: string | number) => {
    const response = await axiosClient.delete(`${MEMO_API}/${id}`)
    return response.data
  }

  search = async ({searchRequest}: { searchRequest: MemoSearchRequest }) => {
    const response = await axiosClient.post(`${MEMO_API}/search`, searchRequest)
    return response.data
  }

  getCategories = async () => {
    const response = await axiosClient.get(MEMO_CATEGORY_API)
    return response.data
  }

  createCategory = async (data: Record<string, unknown>) => {
    const response = await axiosClient.post(MEMO_CATEGORY_API, data)
    return response.data
  }

  updateCategory = async (id: string | number, data: Record<string, unknown>) => {
    const response = await axiosClient.put(`${MEMO_CATEGORY_API}/${id}`, data)
    return response.data
  }

  deleteCategory = async (id: string | number) => {
    const response = await axiosClient.delete(`${MEMO_CATEGORY_API}/${id}`)
    return response.data
  }
}

const memoService = new MemoService()
export default memoService
