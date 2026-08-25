'use client';

import { Input, Textarea } from '@hvy/ui';
import { useState } from 'react';

/**
 * 글자수 카운터 — 제어형 + maxLength 전용(clearable 과 같은 규약: 텍스트형은 값을
 * 미러링하지 않아 비제어에서는 길이를 알 수 없다). 상한 강제는 네이티브 maxLength 가
 * 하고 카운터는 시각 보조다(aria-hidden).
 */
export function InputShowCountDemo() {
  const [memo, setMemo] = useState('');
  const [note, setNote] = useState('');
  return (
    <div className="flex max-w-md flex-col gap-3">
      <Input
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
        maxLength={20}
        showCount
        placeholder="요약 (20자)"
      />
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={200}
        showCount
        autosize
        placeholder="상세 요청 사항 (200자)"
      />
    </div>
  );
}
