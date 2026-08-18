'use client';

import { Field, Input } from '@hvy/ui';

/**
 * Field 배선 전수 — label/required/help/error 가 접근성 속성으로 이어진다.
 * error 가 있으면 자식 컨트롤이 자동으로 오류 배색 + aria-invalid 를 입고 help 는 감춰진다.
 * 필수값 오류를 모달로 막지 않는다(v3 §ds-05) — 못 채운 칸 전부에 동시에 표시한다.
 */
export function FieldStatesDemo() {
  return (
    <div className="grid max-w-4xl gap-5 md:grid-cols-2">
      <Field label="기본" htmlFor="fd-1">
        <Input id="fd-1" placeholder="텍스트를 입력하세요" />
      </Field>
      <Field label="필수" htmlFor="fd-2" required>
        <Input id="fd-2" placeholder="필수 입력 항목" />
      </Field>
      <Field label="가이드" htmlFor="fd-3" help="가이드 텍스트 — 오류가 있으면 감춘다">
        <Input id="fd-3" placeholder="텍스트를 입력하세요" />
      </Field>
      <Field label="오류" htmlFor="fd-4" error="헬퍼 텍스트 — 필수 입력 항목입니다">
        <Input id="fd-4" placeholder="텍스트를 입력하세요" />
      </Field>
    </div>
  );
}
