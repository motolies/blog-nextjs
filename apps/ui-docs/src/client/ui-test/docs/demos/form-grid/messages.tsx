'use client';

import { DatePicker, Field, FormGrid, Input, Select } from '@hvy/ui';

/**
 * 메시지가 섞인 격자 — **행 정렬을 보는 예제다.**
 *
 * 오류 문구가 붙은 칸은 다른 칸보다 세로로 길다. `dl-form-grid` 가 `align-items: start`
 * 이므로 짧은 칸이 늘어나거나 가운데로 밀리지 않고 **라벨 윗선이 한 줄에 남는다** —
 * 저장 한 번에 여러 칸이 동시에 오류를 뿜는 것이 이 폼의 정상 동작이라(v3 §ds-05)
 * 그때 배치가 흔들리면 무엇이 잘못됐는지 읽기 어려워진다.
 *
 * 오류는 `Field` 의 `error` 가 컨텍스트로 내려보내 컨트롤이 배색과 `aria-invalid` 를
 * 스스로 입는다 — 여기서는 상태를 고정해 두었고, 실제 폼의 배선은 form-save 예제에 있다.
 */
export function FormGridMessagesDemo() {
  return (
    <div className="max-w-4xl">
      <FormGrid>
        <Field label="작성자명" htmlFor="fm-author" required error="작성자명을 입력해 주세요">
          <Input id="fm-author" placeholder="작성자명 입력" />
        </Field>

        <Field label="연락처" htmlFor="fm-phone">
          <Input id="fm-phone" defaultValue="010-1234-5678" />
        </Field>

        <Field label="작성일" htmlFor="fm-date" required error="YYYY-MM-DD 형식으로 입력해 주세요">
          <DatePicker id="fm-date" />
        </Field>

        <Field label="카테고리" htmlFor="fm-service" help="미선택은 전체를 뜻한다">
          <Select id="fm-service" placeholder="선택" options={[{ value: 'DEV', label: '개발' }]} />
        </Field>
      </FormGrid>
    </div>
  );
}
