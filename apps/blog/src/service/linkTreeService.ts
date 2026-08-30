import type { AxiosRequestConfig } from 'axios';
import { toAdminLinkTree, toLinkGroups } from '@/lib/linkTree';
import type { AdminLinkTree, LinkGroup, LinkRootKey } from '@/types/linkTree';
import type { MasterCodeCreateRequest, MasterCodeUpdateRequest } from '@/types/masterCode';
import masterCodeService from './masterCodeService';

/**
 * 즐겨찾기/플랫폼 링크 서비스 — 마스터코드 관리자 API 위에 도메인 의미를 씌운 얇은 층.
 *
 * 공개 즐겨찾기(FAVORITE)와 플랫폼(PLATFORM)은 같은 트리 구조라 CRUD 를 공유하고,
 * 루트 코드만 파라미터로 받는다. 조회는 **둘 다 관리자 엔드포인트**를 쓴다 —
 * 공개 엔드포인트는 isActive=false 노드를 걸러버려서 숨긴 링크를 다시 켤 수 없다.
 *
 * 공개 홈의 즐겨찾기 렌더는 여전히 favoriteService(공개 엔드포인트) 담당이다.
 * 실패 정책(throw vs 흡수)과 필요한 필드가 달라 하나로 합치지 않았다.
 */
const linkTreeService = {
  /**
   * 홈의 관리자 전용 플랫폼 섹션용 조회 — **어떤 실패도 빈 배열로 흡수한다.**
   *
   * 403 은 "관리자가 아니다"라는 정상 경로다. 그 외(루트 미시드로 인한 500, 백엔드 장애)도
   * 부가 섹션 하나 때문에 공개 홈 전체가 error.tsx 로 넘어가서는 안 된다.
   * 500 은 백엔드가 이미 Slack(#hvy-error)으로 알리므로 신호가 사라지지는 않는다.
   */
  async getPlatformGroupsOrEmpty(config?: AxiosRequestConfig): Promise<LinkGroup[]> {
    try {
      return toLinkGroups(await masterCodeService.getAdminSubTree('PLATFORM', config));
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status !== 401 && status !== 403) {
        console.error('플랫폼 링크 조회 실패(섹션 생략):', status ?? error);
      }
      return [];
    }
  },

  /** 관리 화면용 조회. 홈과 달리 실패를 삼키지 않는다 — 편집 화면은 실패를 알려야 한다. */
  async getAdminTree(rootCode: LinkRootKey): Promise<AdminLinkTree | null> {
    return toAdminLinkTree(await masterCodeService.getAdminSubTree(rootCode));
  },

  createNode(payload: MasterCodeCreateRequest) {
    return masterCodeService.createNode(payload);
  },

  updateNode(id: string, payload: MasterCodeUpdateRequest) {
    return masterCodeService.updateNode(id, payload);
  },

  deleteNode(id: string) {
    return masterCodeService.deleteNode(id);
  },

  /**
   * 형제들의 sort 를 일괄 갱신한다. renumberSiblings 가 돌려준 "실제로 바뀐 것"만 넘긴다.
   *
   * ⚠️ reorder 전용 엔드포인트는 백엔드에 없다(PUT /nodes/{id}/reorder 는 404).
   *    sort 필드를 updateNode 로 갱신하는 것이 정석 경로다.
   * 순차 실행하는 이유: 같은 부모의 형제를 동시에 PUT 하면 캐시 evict 가 겹쳐 낭비다.
   */
  async applySortUpdates(updates: readonly { id: string; sort: number }[]) {
    for (const { id, sort } of updates) {
      await masterCodeService.updateNode(id, { sort });
    }
  },
};

export default linkTreeService;
