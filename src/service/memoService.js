import axiosClient from './axiosClient'

const MEMO_API = '/api/memo/admin'
const MEMO_CATEGORY_API = '/api/memo-category/admin'

class MemoService {

  // 메모 CRUD
  create = async (data) => {
    const response = await axiosClient.post(MEMO_API, data)
    return response.data
  }

  getById = async (id) => {
    const response = await axiosClient.get(`${MEMO_API}/${id}`)
    return response.data
  }

  update = async (id, data) => {
    const response = await axiosClient.put(`${MEMO_API}/${id}`, data)
    return response.data
  }

  delete = async (id) => {
    const response = await axiosClient.delete(`${MEMO_API}/${id}`)
    return response.data
  }

  search = async ({searchRequest}) => {
    const response = await axiosClient.post(`${MEMO_API}/search`, searchRequest)
    return response.data
  }

  // 카테고리 CRUD
  getCategories = async () => {
    const response = await axiosClient.get(MEMO_CATEGORY_API)
    return response.data
  }

  createCategory = async (data) => {
    const response = await axiosClient.post(MEMO_CATEGORY_API, data)
    return response.data
  }

  updateCategory = async (id, data) => {
    const response = await axiosClient.put(`${MEMO_CATEGORY_API}/${id}`, data)
    return response.data
  }

  deleteCategory = async (id) => {
    const response = await axiosClient.delete(`${MEMO_CATEGORY_API}/${id}`)
    return response.data
  }
}

const memoService = new MemoService()
export default memoService
