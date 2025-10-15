import axiosClient from './axiosClient'

const FAVORITE_API_BASE = '/api/common-code'

class FavoriteService {
  /**
   * 즐겨찾기 목록 조회 (계층 구조)
   * FAVORITE_ROOT의 트리 구조를 가져와 UI에 맞게 변환
   */
  async getFavorites(config) {
    try {
      const response = await axiosClient.get(
        `${FAVORITE_API_BASE}/class/FAVORITE_ROOT/tree`,
        config
      )
      return this.transformToUIFormat(response.data)
    } catch (error) {
      console.error('즐겨찾기 목록 조회 실패:', error)
      throw error
    }
  }

  /**
   * API 응답을 UI 형식으로 변환
   *
   * API 응답 형식:
   * {
   *   className: "FAVORITE_ROOT",
   *   codes: [
   *     {
   *       code: "ROOT",
   *       name: "즐겨찾기",
   *       children: [
   *         {
   *           code: "COMMUNITY",
   *           name: "Community",
   *           children: [
   *             { code: "CLIEN", name: "clien", attributes: { url: "http://..." } }
   *           ]
   *         }
   *       ]
   *     }
   *   ]
   * }
   *
   * UI 형식:
   * [
   *   { name: "Community", links: [{ name: "clien", url: "http://..." }] }
   * ]
   */
  transformToUIFormat(apiResponse) {
    if (!apiResponse || !apiResponse.codes || apiResponse.codes.length === 0) {
      return []
    }

    // ROOT 코드의 children이 카테고리들
    const rootCode = apiResponse.codes[0]
    if (!rootCode.children || rootCode.children.length === 0) {
      return []
    }

    // 카테고리별로 변환
    return rootCode.children.map(category => ({
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
