'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  showToast,
} from '@hvy/ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const FIELDS = ['카테고리', '상태', '기간'] as const;

/**
 * 아이템이 하나면 팝업 없이 즉시 발화한다 — 고를 것이 없는 패널은 클릭만 늘린다.
 *
 * 아이템 수는 런타임에 오간다(권한 필터·검색 조건 소진). 아래 토글로 그 순간을 재현한다 —
 * **트리거 버튼은 리마운트되지 않으므로** 포커스를 준 채 토글해도 포커스가 유지되고,
 * 메뉴를 연 상태에서 1개로 줄여도 열린 패널이 사라지지 않는다.
 */
export function DropdownMenuSingleItemDemo() {
  const [count, setCount] = useState(1);
  const fields = FIELDS.slice(0, count);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline-gray" onClick={() => setCount(count === 1 ? 3 : 1)}>
          아이템 {count}개 → {count === 1 ? 3 : 1}개로
        </Button>
        <span className="text-dl-fg-muted text-dl-sm">
          {count === 1 ? '지금은 버튼 — 클릭이 곧 실행' : '지금은 메뉴 — 클릭하면 열린다'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button icon={Plus} size="sm" variant="ghost">
              검색 조건 추가
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {fields.map((field) => (
              <DropdownMenuItem
                key={field}
                onSelect={() => showToast(`${field} 추가 (데모)`, 'info')}
              >
                {field}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button size="sm" variant="outline-strong" title="추가할 검색 조건이 남지 않았습니다">
              조건 추가 (비활성)
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem disabled onSelect={() => {}}>
              카테고리
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
