import { FormSaveScenario } from '../../client/ui-test/docs/demos/form-save/scenario';
import type { DocEntry } from './types';

/** 결합 시나리오 — 필수값 검증 → 확인 → 저장 → 비활성 전환. useFieldErrors 의 실전 배선이다. */
export const formSaveDoc: DocEntry = {
  slug: 'form-save',
  category: 'examples',
  title: '폼 검증 · 저장',
  description:
    "필수값 검증 → 확인 모달 → 저장 → FormMode('disabled') 전환의 흐름. 필수값 오류를 모달로 막지 않고 못 채운 칸 전부에 동시에 표시한다(v3 §ds-05). useFieldErrors · Field.onDirty · RequiredMark · FieldError · FormMode 의 실전 조합이다.",
  examples: [
    {
      id: 'scenario',
      title: '필수값 검증 → 확인 → 저장 → 비활성 전환',
      note: "빈 채로 저장을 누르면 세 칸에 동시에 오류가 뜨고 첫 칸으로 포커스가 간다. 값을 채우면 그 칸의 오류만 사라진다 — 다른 칸은 남아 무엇이 남았는지 보여준다. 저장 후 잠금은 컨트롤별 lock 손 배선이 아니라 FormMode value={saved ? 'disabled' : 'edit'} 하나다 — 이 폼은 비제어(FormData)인데도 다시 편집에서 값이 전부 살아 있다: disabled 모드는 컨트롤이 DOM 에 남기 때문이다(view 모드였다면 입력이 사라져 값이 날아간다 — view↔edit 폼이 제어형이어야 하는 이유. Field 문서의 3모드 데모와 대비해 볼 것).",
      file: 'src/client/ui-test/docs/demos/form-save/scenario.tsx',
      Component: FormSaveScenario,
    },
  ],
};
