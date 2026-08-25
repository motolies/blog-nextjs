'use client';

import { Calendar } from '@hvy/ui';
import { useState } from 'react';

/**
 * 단일 선택 · 6주 고정 그리드.
 *
 * 검증 포인트:
 * · 달을 앞뒤로 넘겨도 **행 수가 변하지 않는다**(항상 6주 42칸) — 4~6행으로 출렁이면
 *   이 그리드를 팝업으로 쓰는 DatePicker 의 높이가 널뛴다
 * · 앞뒤 인접 달 날짜는 흐리게(outside) 그려지되 **누르면 선택된다**
 * · 오늘은 굵은 primary 글자 + `aria-current="date"` 이고 선택은 primary 채움이다 —
 *   오늘이면서 선택된 날은 선택 배색이 이긴다
 * · 값의 계약은 Date 가 아니라 **`YYYY-MM-DD` 문자열**이다(아래 출력으로 확인)
 * · 헤더 « ‹ › » 는 각각 −1년 −1월 +1월 +1년이다
 * · initialFocus 를 주면 그 달에서 열리고, 없으면 value → range.start → 오늘 순으로 정해진다
 */
export function CalendarBasicDemo() {
  const [value, setValue] = useState('2026-07-15');

  return (
    <div className="flex flex-col gap-2">
      <Calendar value={value} onSelect={setValue} />
      <p className="text-dl-xs text-dl-fg-subtle">
        value = <code className="font-dl-mono">{value}</code> — Date 객체가 아니라 문자열이다.
      </p>
    </div>
  );
}
