'use client';

import { Badge, Button, Checkbox, CONTROL_SIZES, Input, Select, Switch } from '@hvy/ui';
import { Save } from 'lucide-react';
import { useState } from 'react';

/**
 * 컨트롤 스케일 종합 — 주요 컨트롤을 5단 나란히 놓는다.
 *
 * 핵심은 단일 테마 안의 5단이 아니라 **테마 전환**이다: 상단 테마 선택(또는
 * `?theme=compact`)을 바꾸면 모든 단계가 일괄 축소된다 — 치수·폰트가 하드코딩이
 * 아니라 테마 스케일(`--dl-scale-*` 5키)에서 calc 로 유도된다는 실증이다.
 */
const OPTIONS = [
  { value: 'seoul', label: '서울' },
  { value: 'busan', label: '부산' },
];

export function ScaleDemo() {
  const [on, setOn] = useState(true);

  return (
    <div className="flex flex-col gap-4">
      {CONTROL_SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-3">
          <span className="w-6 shrink-0 text-dl-xs text-dl-fg-muted">{size}</span>
          <Button size={size} variant="primary" icon={Save}>
            저장
          </Button>
          <Input size={size} placeholder="입력" className="w-40" />
          <Select size={size} options={OPTIONS} placeholder="선택" className="w-32" />
          <Checkbox size={size} defaultChecked aria-label={`체크박스 ${size}`} />
          <Switch size={size} checked={on} onCheckedChange={setOn} label={`스위치 ${size}`} />
          <Badge size={size} tone="primary">
            배지
          </Badge>
        </div>
      ))}
    </div>
  );
}
