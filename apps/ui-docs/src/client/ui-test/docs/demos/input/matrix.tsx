'use client';

import { DatePicker, Field, Input, Textarea } from '@hvy/ui';

/**
 * 입력 계열 상태 매트릭스 — QA component.html 의 3열(기본 · 비활성 · 오류+헬퍼) 패턴.
 * 비활성 열은 `mode="disabled"` 다 — 비활성 표기는 이 축 하나다(disabled prop 은 타입에서 제거).
 * 오류는 보더만 danger 로 바뀌고(배경 틴트 없음) 아래 12px 헬퍼 텍스트가 붙는다.
 *
 * 셋째 줄이 `DatePicker` 인 이유: 날짜 칸도 같은 `dl-field` 껍데기를 쓰므로 상태 규격이
 * 같아야 한다. 예전에는 달력이 안 열리는 `DateInput` 이 이 자리에 있었다.
 */
export function InputMatrixDemo() {
  return (
    <div className="grid max-w-4xl gap-5 md:grid-cols-3">
      <Field label="레이블" htmlFor="mx-i1">
        <Input id="mx-i1" placeholder="텍스트를 입력하세요" />
      </Field>
      <Field label="레이블" htmlFor="mx-i2">
        <Input id="mx-i2" mode="disabled" placeholder="텍스트를 입력하세요" />
      </Field>
      <Field label="레이블" htmlFor="mx-i3" error="헬퍼 텍스트">
        <Input id="mx-i3" placeholder="텍스트를 입력하세요" />
      </Field>

      <Field label="레이블" htmlFor="mx-t1" help="가이드 텍스트">
        <Textarea id="mx-t1" placeholder="텍스트를 입력하세요" />
      </Field>
      <Field label="레이블" htmlFor="mx-t2">
        <Textarea id="mx-t2" mode="disabled" placeholder="텍스트를 입력하세요" />
      </Field>
      <Field label="레이블" htmlFor="mx-t3" error="헬퍼 텍스트">
        <Textarea id="mx-t3" placeholder="텍스트를 입력하세요" />
      </Field>

      <Field label="레이블" htmlFor="mx-d1">
        <DatePicker id="mx-d1" />
      </Field>
      <Field label="레이블" htmlFor="mx-d2">
        <DatePicker id="mx-d2" mode="disabled" />
      </Field>
      <Field label="레이블" htmlFor="mx-d3" error="헬퍼 텍스트">
        <DatePicker id="mx-d3" />
      </Field>
    </div>
  );
}
