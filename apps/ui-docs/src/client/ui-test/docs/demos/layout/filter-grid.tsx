'use client';

import { Input, Select, Switch } from '@hvy/ui';
import { useState } from 'react';

const OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'ready', label: '준비' },
  { value: 'done', label: '완료' },
] as const;

/**
 * 검색 필터 그리드 — `dl-filter-grid` 유틸리티(theme/utilities.css).
 * 라벨+필드 4쌍 그리드가 **컨테이너 폭 1200px 미만**에서 2쌍으로 접힌다.
 * 미디어 쿼리가 아니라 컨테이너 쿼리라 모달 안에서도 같은 규칙으로 접힌다 —
 * 부모에 `[container-type:inline-size]` 컨텍스트가 필요하다.
 */
export function FilterGridDemo() {
  const [narrow, setNarrow] = useState(false);

  const label = 'px-3 text-dl-sm font-semibold text-dl-fg-label';

  return (
    <div className="flex flex-col gap-3">
      <span className="flex w-fit items-center gap-2 text-dl-sm">
        <Switch checked={narrow} onCheckedChange={setNarrow} label="좁은 컨테이너로 보기" />
        좁은 컨테이너로 보기 (1200px 미만 → 2쌍 접힘)
      </span>

      <div
        className={`rounded-dl-container border border-dl-border bg-dl-surface p-3 [container-type:inline-size] ${
          narrow ? 'max-w-2xl' : ''
        }`}
      >
        <div className="dl-filter-grid">
          <span className={label}>주문번호</span>
          <Input placeholder="ORD-..." />
          <span className={label}>상태</span>
          <Select options={[...OPTIONS]} placeholder="전체" />
          <span className={label}>고객명</span>
          <Input placeholder="이름" />
          <span className={label}>센터</span>
          <Select options={[...OPTIONS]} placeholder="전체" />
        </div>
      </div>
    </div>
  );
}
