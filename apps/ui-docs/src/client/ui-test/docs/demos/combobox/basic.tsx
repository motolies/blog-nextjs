'use client';

import { Combobox, showToast } from '@hvy/ui';
import { useState } from 'react';

const FRUITS = [
  { value: '1', label: '사과' },
  { value: '2', label: '바나나' },
  { value: '3', label: '체리' },
  { value: '4', label: '두리안' },
  { value: '5', label: '엘더베리' },
];

/** 피커형 기본 — 고르면 칩 목록에 추가될 뿐 트리거 문구는 변하지 않는다. */
export function ComboboxBasicDemo() {
  const [picked, setPicked] = useState<string[]>([]);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Combobox
        options={FRUITS}
        pickedValues={picked}
        triggerLabel="과일 추가"
        searchPlaceholder="과일 검색..."
        onPick={(value) => {
          if (picked.includes(value)) {
            showToast('이미 추가된 항목입니다', 'warning');
            return;
          }
          setPicked((prev) => [...prev, value]);
        }}
      />
      <p className="text-dl-fg-muted text-dl-sm">
        추가됨: {picked.map((v) => FRUITS.find((f) => f.value === v)?.label).join(', ') || '없음'}
      </p>
    </div>
  );
}
