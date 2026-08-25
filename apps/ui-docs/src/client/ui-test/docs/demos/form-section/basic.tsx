'use client';

import { Button, Field, FormSection, Input, Select, showToast } from '@hvy/ui';

const SERVICE_OPTIONS = [
  { value: 'DEV', label: '개발' },
  { value: 'ESSAY', label: '에세이' },
];

/**
 * 기본 — Card(form) + CardHeader + FormGrid 3중주가 prop 몇 개로 끝난다.
 * children 은 Field/FieldValue — FormGrid 에 그대로 담긴다.
 */
export function FormSectionBasicDemo() {
  return (
    <FormSection
      title="게시글 기본 정보"
      actions={
        <Button size="sm" onClick={() => showToast('저장 (데모)', 'success')}>
          저장
        </Button>
      }
    >
      <Field label="게시글 ID" htmlFor="fs-order">
        <Input id="fs-order" placeholder="자동 / 저장 시 발급" lock />
      </Field>
      <Field label="서비스 타입" htmlFor="fs-service" required>
        <Select id="fs-service" placeholder="선택" options={SERVICE_OPTIONS} />
      </Field>
      <Field label="고객명" htmlFor="fs-customer">
        <Input id="fs-customer" />
      </Field>
    </FormSection>
  );
}

/**
 * 접기(collapsible) — 제목이 토글이 된다(aria-expanded·키보드는 radix Collapsible).
 * 긴 상세 화면에서 안 쓰는 섹션을 접는 용도다. 접힘 상태는 세션 휘발이다.
 */
export function FormSectionCollapsibleDemo() {
  return (
    <div className="flex flex-col gap-3">
      <FormSection title="발송인 정보" collapsible>
        <Field label="이름" htmlFor="fs-sender-name">
          <Input id="fs-sender-name" />
        </Field>
        <Field label="연락처" htmlFor="fs-sender-phone">
          <Input id="fs-sender-phone" inputMode="numeric" />
        </Field>
      </FormSection>
      <FormSection title="작성자 정보" collapsible defaultOpen={false}>
        <Field label="이름" htmlFor="fs-author-name">
          <Input id="fs-author-name" />
        </Field>
        <Field label="연락처" htmlFor="fs-author-phone">
          <Input id="fs-author-phone" inputMode="numeric" />
        </Field>
      </FormSection>
    </div>
  );
}
