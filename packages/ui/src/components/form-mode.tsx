'use client';

import { createContext, type ReactNode, useContext } from 'react';

/**
 * 폼 수준 모드 축 — `edit`(편집) · `view`(값 텍스트) · `disabled`(비활성 컨트롤).
 *
 * 읽기 전용 축은 셋이고 서로 직교한다:
 *   · `FieldValue` — 애초에 **고칠 대상이 아닌** 값. 시간 개념이 없다 (field.tsx)
 *   · `lock` — 마스킹/자동입력/조건부 잠금. **칸** 수준 (input.tsx)
 *   · `mode` — 조회↔수정을 오가는 **폼** 수준의 현재 상태 (여기)
 * mode≠edit 이어도 lock 은 지워지지 않고 잠복한다 — edit 로 돌아오면 그대로 복원된다.
 *
 * `FormGrid` 가 아니라 별도 Provider 인 이유: FormGrid 는 `'use client'` 가 없는
 * 레이아웃 상자라 RSC 에서 렌더된다 — 컨텍스트를 얹는 순간 모든 사용처에 클라이언트
 * 경계가 생긴다. 이 파일은 react 외에 아무것도 import 하지 않고,
 * field.tsx → form-mode.tsx 단방향이라 순환도 없다.
 */
export type FieldMode = 'edit' | 'view' | 'disabled';

const FormModeContext = createContext<FieldMode | null>(null);

/** `Field`/컨트롤이 폼 수준 모드를 읽는 내부 통로 — barrel 로 내보내지 않는다. */
export function useFormMode(): FieldMode | null {
  return useContext(FormModeContext);
}

/**
 * 폼 전체에 모드를 내리는 경량 Provider. 필드별 예외는 `<Field mode="...">` 가 이긴다.
 *
 * **폼에만 감는다** — DataGrid·GridToolbar·ColumnSettingsDialog 는 내부에서 `edit` 로
 * 핀되어 있다(그리드 크롬은 폼이 아니다 — 상세 화면을 통째로 감싸도 그리드의 행 선택·
 * 셀 편집·툴바가 잠기면 안 된다). `Button` 은 모드를 소비하지 않으므로
 * "다시 편집" 같은 조작 버튼은 disabled 모드에서도 살아 있다.
 */
export function FormMode({
  value,
  children,
}: {
  readonly value: FieldMode;
  readonly children: ReactNode;
}) {
  return <FormModeContext.Provider value={value}>{children}</FormModeContext.Provider>;
}
