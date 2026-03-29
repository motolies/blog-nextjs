import axiosClient from './axiosClient'

const HOT_DEAL_API_BASE = '/api/hot-deal/admin'

class HotDealService {
  getAllSites = async (config) => {
    const response = await axiosClient.get(`${HOT_DEAL_API_BASE}/sites`, config)
    return response.data
  }

  updateSite = async (siteId, data) => {
    const response = await axiosClient.put(`${HOT_DEAL_API_BASE}/sites/${siteId}`, data)
    return response.data
  }

  searchItems = async ({searchRequest}, config) => {
    const response = await axiosClient.post(
      `${HOT_DEAL_API_BASE}/items/search`,
      searchRequest,
      config
    )
    return response.data
  }

  triggerScrape = async () => {
    const response = await axiosClient.post(HOT_DEAL_API_BASE)
    return response.data
  }
}

const hotDealService = new HotDealService()
export default hotDealService
