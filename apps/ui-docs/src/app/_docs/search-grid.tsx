import { SearchGridScenario } from '../../client/ui-test/docs/demos/search-grid/scenario';
import type { DocEntry } from './types';

/** 결합 시나리오 — 검색 폼 + 그리드. 개별 컨트롤이 아니라 조합했을 때 깨지는 지점이 검증 대상이다. */
export const searchGridDoc: DocEntry = {
  slug: 'search-grid',
  category: 'examples',
  title: '검색 + 그리드',
  description:
    '검색 폼과 그리드의 결합 — 검색바→그리드 상태 동기화, busy 중 재클릭 방지, 결과가 교체되면 선택이 비워지는가(resetKey), 로딩→결과/빈/에러 상태 전환, "아직 검색 안 함"과 "결과 없음"의 구분이 검증 포인트다.',
  examples: [
    {
      id: 'scenario',
      title: '조회 흐름 한 바퀴',
      note: "'수신자 없음' 같은 조건으로 0건을 만들면 빈 상태가, 에러 모의를 켜면 ErrorState 가 나온다. 재조회 후 이전 선택이 남아 있으면 버그다.",
      file: 'src/client/ui-test/docs/demos/search-grid/scenario.tsx',
      Component: SearchGridScenario,
    },
  ],
};
