import { DialogPickerScenario } from '../../client/ui-test/docs/demos/dialog-picker/scenario';
import type { DocEntry } from './types';

/** 결합 시나리오 — 선택 모달 안의 그리드에서 골라 부모 폼에 채운다. */
export const dialogPickerDoc: DocEntry = {
  slug: 'dialog-picker',
  category: 'examples',
  title: '선택 모달 → 폼 반영',
  description:
    'PickerDialog 안에 DataGrid 를 넣고, 그리드에서 고른 값을 부모 폼의 잠금 칸(lock — 시스템 채움 영구 불변)에 반영하는 조합. 선택 모달은 Esc·딤 클릭으로 닫히지 않는다 — 고른 것을 잃는 경로를 좁힌 규격이다.',
  examples: [
    {
      id: 'scenario',
      title: '선택 모달에서 골라 폼에 채우기',
      note: '찾아보기 → 그리드에서 주문번호 클릭 → 부모 칸에 반영. 해제는 파괴적 확인 모달을 거친다.',
      file: 'src/client/ui-test/docs/demos/dialog-picker/scenario.tsx',
      Component: DialogPickerScenario,
    },
  ],
};
