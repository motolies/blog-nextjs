import axiosClient from './axiosClient';
import type { AxiosRequestConfig } from 'axios';
import type { HotDealItemSearchRequest, HotDealKeywordPayload } from '@/types/hotDeal';

const HOT_DEAL_API_BASE = '/api/hot-deal/admin';

class HotDealService {
  getAllSites = async (config?: AxiosRequestConfig) => {
    const response = await axiosClient.get(`${HOT_DEAL_API_BASE}/sites`, config);
    return response.data;
  };

  updateSite = async (siteId: string | number, data: Record<string, unknown>) => {
    const response = await axiosClient.put(`${HOT_DEAL_API_BASE}/sites/${siteId}`, data);
    return response.data;
  };

  searchItems = async (
    { searchRequest }: { searchRequest: HotDealItemSearchRequest },
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosClient.post(
      `${HOT_DEAL_API_BASE}/items/search`,
      searchRequest,
      config,
    );
    return response.data;
  };

  triggerScrape = async () => {
    const response = await axiosClient.post(HOT_DEAL_API_BASE);
    return response.data;
  };

  getKeywords = async (config?: AxiosRequestConfig) => {
    const response = await axiosClient.get(`${HOT_DEAL_API_BASE}/keywords`, config);
    return response.data;
  };

  createKeyword = async (data: HotDealKeywordPayload) => {
    const response = await axiosClient.post(`${HOT_DEAL_API_BASE}/keywords`, data);
    return response.data;
  };

  updateKeyword = async (keywordId: string | number, data: HotDealKeywordPayload) => {
    const response = await axiosClient.put(`${HOT_DEAL_API_BASE}/keywords/${keywordId}`, data);
    return response.data;
  };

  deleteKeyword = async (keywordId: string | number) => {
    const response = await axiosClient.delete(`${HOT_DEAL_API_BASE}/keywords/${keywordId}`);
    return response.data;
  };
}

const hotDealService = new HotDealService();
export default hotDealService;
