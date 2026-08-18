import axiosClient from './axiosClient'
import type { StatsOverview } from '@/types/stats'

const STATS_API_BASE = '/api/stats/admin'

class StatsService {
  getOverview = async (days: number = 30) => {
    const response = await axiosClient.get<StatsOverview>(
      `${STATS_API_BASE}/overview`,
      { params: { days } }
    )
    return response.data
  }
}

const statsService = new StatsService()
export default statsService
