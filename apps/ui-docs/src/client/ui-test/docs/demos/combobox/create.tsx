'use client';

import { Combobox, showToast } from '@hvy/ui';
import { useState } from 'react';

/** 자유입력 생성 — 정확 일치 옵션이 없으면 "'검색어' 만들기" 행이 열린다(태그 생성 패턴). */
export function ComboboxCreateDemo() {
  const [tags, setTags] = useState<string[]>(['docker', 'nextjs']);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Combobox
        options={tags.map((tag) => ({ value: tag, label: tag }))}
        triggerLabel="태그 추가"
        searchPlaceholder="태그 검색 또는 새 태그 입력..."
        createLabel={(input) => `+ "${input}" 새 태그 추가`}
        onPick={(value) => showToast(`기존 태그 선택: ${value}`)}
        onCreate={(input) => {
          setTags((prev) => [...prev, input]);
          showToast(`새 태그 생성: ${input}`);
        }}
      />
      <p className="text-dl-fg-muted text-dl-sm">태그: {tags.join(', ')}</p>
    </div>
  );
}
