import masterCodeService from './masterCodeService'
import type { AxiosRequestConfig } from 'axios'
import type { FavoriteCategory, FavoriteLink } from '@/types/favorite'
import type { MasterCodeNode } from '@/types/masterCode'

class FavoriteService {
  async getFavorites(config?: AxiosRequestConfig): Promise<FavoriteCategory[]> {
    try {
      const treeData = await masterCodeService.getSubTree('FAVORITE', config)
      return this.transformToUIFormat(treeData)
    } catch (error) {
      console.error('즐겨찾기 목록 조회 실패:', error)
      throw error
    }
  }

  transformToUIFormat(treeData: MasterCodeNode[]): FavoriteCategory[] {
    if (!Array.isArray(treeData) || treeData.length === 0) {
      return []
    }

    const root = treeData[0]
    if (!root.children || root.children.length === 0) {
      return []
    }

    return root.children.map(category => ({
      name: category.name,
      links: this.extractLinks(category.children || [])
    }))
  }

  extractLinks(sites: MasterCodeNode[]): FavoriteLink[] {
    if (!Array.isArray(sites)) {
      return []
    }

    return sites.map(site => ({
      name: site.name,
      url: site.attributes?.url || '#'
    }))
  }
}

const favoriteService = new FavoriteService()
export default favoriteService
