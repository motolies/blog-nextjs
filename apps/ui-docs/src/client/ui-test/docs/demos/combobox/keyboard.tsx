'use client';

import { Badge, Combobox } from '@hvy/ui';
import { useState } from 'react';

/**
 * 키보드와 가상 포커스 — 옵션은 **focusable 이 아니다**.
 *
 * Select 와 같은 listbox 패턴이다: 포커스는 검색 입력에 머물고 하이라이트만
 * `aria-activedescendant` 로 옮겨 다닌다. 옵션마다 tabIndex 를 주면 Tab 한 번에
 * 목록을 다 지나가야 하고, 검색 입력에서 포커스가 떠나면 타이핑이 끊긴다.
 *
 * 검증 포인트:
 * · 개발자 도구로 검색 입력의 `aria-activedescendant` 속성 값이 ↑↓ 에 따라 바뀌는지 본다
 * · ↑↓ 는 순환하고 **disabled 옵션은 건너뛴다**(2·5번째가 disabled 다)
 * · Enter 는 하이라이트된 행을 확정하고, disabled 행에서는 아무 일도 일어나지 않는다
 * · Esc 는 닫기만 한다
 * · 마우스를 올리면 하이라이트가 그 행으로 따라온다 — 키보드와 같은 상태를 공유한다
 * · 검색어를 고치면 하이라이트가 첫 행으로 되돌아간다
 * · 오른쪽 콤보박스는 **전 항목이 disabled** 다: ↑↓ 로 아무 데도 못 가고 Enter 도 먹지 않는다
 */

const OPTIONS = [
  { value: 'react', label: 'React' },
  { value: 'nextjs', label: 'Next.js (준비 중)', disabled: true },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'css', label: 'CSS' },
  { value: 'spring', label: 'Spring (권한 없음)', disabled: true },
  { value: 'devops', label: 'DevOps' },
];

const ALL_DISABLED = OPTIONS.map((option) => ({ ...option, disabled: true }));

export function ComboboxKeyboardDemo() {
  const [picked, setPicked] = useState<readonly string[]>([]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-dl-xs font-semibold text-dl-fg-strong">
            일부 disabled — ↑↓ 가 건너뛴다
          </span>
          <Combobox
            options={OPTIONS}
            onPick={(value) => setPicked((previous) => [...new Set([...previous, value])])}
            pickedValues={picked}
            triggerLabel="태그 고르기"
            searchPlaceholder="검색"
            emptyLabel="검색 결과가 없습니다"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-dl-xs font-semibold text-dl-fg-strong">
            전부 disabled — 이동도 확정도 안 된다
          </span>
          <Combobox
            options={ALL_DISABLED}
            onPick={() => undefined}
            triggerLabel="고를 수 없음"
            searchPlaceholder="검색"
            emptyLabel="검색 결과가 없습니다"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {picked.length === 0 ? (
          <span className="text-dl-xs text-dl-fg-muted">고른 값이 여기 쌓인다.</span>
        ) : (
          picked.map((value) => (
            <Badge key={value} tone="primary" size="xs">
              {value}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
