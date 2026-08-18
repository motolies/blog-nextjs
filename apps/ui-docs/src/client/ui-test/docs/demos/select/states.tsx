'use client';

import { Field, NativeSelect, Select } from '@hvy/ui';

/**
 * Select 상태 3열(기본 · 비활성 · 오류) + NativeSelect.
 * 트리거 radius 는 8 — 입력(6)과 의도적으로 다르다(QA 실측).
 * NativeSelect 는 OS 팝업을 쓰는 가벼운 대안이다 — 플레이그라운드 컨트롤(EnumControl)도 이걸로 만들어져 있다.
 */
const PRODUCT_OPTIONS = [
  { value: '1', label: '일반 상품' },
  { value: '2', label: '사은품' },
  { value: '3', label: '샘플' },
  { value: '4', label: '추가구성' },
  { value: '5', label: '세트 상품' },
];

export function SelectStatesDemo() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid max-w-4xl gap-5 md:grid-cols-3">
        <Field label="레이블" htmlFor="mx-s1">
          <Select id="mx-s1" placeholder="아이템1" options={PRODUCT_OPTIONS} />
        </Field>
        <Field label="레이블" htmlFor="mx-s2">
          <Select id="mx-s2" placeholder="아이템1" options={PRODUCT_OPTIONS} disabled />
        </Field>
        <Field label="레이블" htmlFor="mx-s3" error="헬퍼 텍스트">
          <Select id="mx-s3" placeholder="아이템1" options={PRODUCT_OPTIONS} />
        </Field>
      </div>

      <Field label="네이티브 셀렉트" htmlFor="pg-native" className="w-44">
        <NativeSelect id="pg-native" defaultValue="1">
          {PRODUCT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
    </div>
  );
}
