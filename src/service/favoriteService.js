import masterCodeService from './masterCodeService'

class FavoriteService {
  /**
   * 즐겨찾기 목록 조회 (계층 구조)
   * MasterCode의 FAVORITE 서브트리를 가져와 UI에 맞게 변환
   */
  async getFavorites(config) {
    try {
      const treeData = await masterCodeService.getSubTree('FAVORITE', config)
      return this.transformToUIFormat(treeData)
    } catch (error) {
      console.error('즐겨찾기 목록 조회 실패:', error)
      throw error
    }
  }

  /**
   * API 응답을 UI 형식으로 변환
   *
   * MasterCode API 응답 형식 (GET /api/v1/codes/tree/FAVORITE):
   * [
   *   {
   *     code: "FAVORITE",
   *     name: "즐겨찾기",
   *     children: [
   *       {
   *         code: "COMMUNITY",
   *         name: "Community",
   *         children: [
   *           { code: "CLIEN", name: "clien", attributes: { url: "http://..." } }
   *         ]
   *       }
   *     ]
   *   }
   * ]
   *
   * UI 형식:
   * [
   *   { name: "Community", links: [{ name: "clien", url: "http://..." }] }
   * ]
   */
  transformToUIFormat(treeData) {
    if (!Array.isArray(treeData) || treeData.length === 0) {
      return []
    }

    // 루트 노드(FAVORITE)의 children이 카테고리들
    const root = treeData[0]
    if (!root.children || root.children.length === 0) {
      return []
    }

    // 카테고리별로 변환
    return root.children.map(category => ({
      name: category.name,
      links: this.extractLinks(category.children || [])
    }))
  }

  /**
   * 사이트 children을 링크 배열로 변환
   */
  extractLinks(sites) {
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
