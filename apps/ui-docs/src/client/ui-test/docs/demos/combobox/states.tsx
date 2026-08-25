'use client';

import { CONTROL_SIZES, Combobox, Label } from '@hvy/ui';
import { useState } from 'react';

/**
 * 크기와 상태 — size 5단 · disabled · 라벨 연결 · 패널 폭.
 *
 * 검증 포인트:
 * · size 5단(xs~xl)에서 트리거 높이·글자가 함께 움직인다 —
 *   **패널 안 검색 입력은 항상 sm 규격**이다(패널은 트리거 크기를 따라가지 않는다)
 * · disabled 트리거는 dl-field-locked 배색이고 열리지 않는다
 * · 패널 폭은 트리거 폭을 따라간다(--radix-popover-trigger-width, 최소 40) —
 *   맨 아래 좁은 트리거를 열어 패널도 좁아지는지 본다
 * · id 를 주고 `<Label htmlFor>` 로 묶으면 **라벨 클릭으로 열려야 한다**
 * · 열리면 트리거 보더가 primary-hover 가 되고 캐럿이 180° 돈다
 */

const OPTIONS = [
  { value: 'react', label: 'React' },
  { value: 'nextjs', label: 'Next.js' },
  { value: 'typescript', label: 'TypeScript' },
];

export function ComboboxStatesDemo() {
  const [last, setLast] = useState('');

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <h4 className="text-dl-xs font-semibold text-dl-fg-strong">size 5단</h4>
        <div className="flex flex-wrap items-end gap-2">
          {CONTROL_SIZES.map((size) => (
            <div key={size} className="flex flex-col gap-1">
              <span className="text-dl-xs text-dl-fg-muted">{size}</span>
              <Combobox
                size={size}
                options={OPTIONS}
                onPick={setLast}
                triggerLabel="태그 추가"
                searchPlaceholder="검색"
                emptyLabel="없음"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-dl-xs font-semibold text-dl-fg-strong">disabled</span>
          <Combobox
            options={OPTIONS}
            onPick={setLast}
            triggerLabel="태그 추가"
            disabled
            searchPlaceholder="검색"
            emptyLabel="없음"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="cb-labeled" className="text-dl-xs font-semibold text-dl-fg-strong">
            라벨 클릭으로 열림
          </Label>
          <Combobox
            id="cb-labeled"
            options={OPTIONS}
            onPick={setLast}
            triggerLabel="태그 추가"
            searchPlaceholder="검색"
            emptyLabel="없음"
          />
        </div>

        <div className="flex w-32 flex-col gap-1">
          <span className="text-dl-xs font-semibold text-dl-fg-strong">좁은 트리거</span>
          {/* 패널 폭이 트리거를 따라간다 — 열어서 패널도 좁아지는지 본다. */}
          <Combobox
            options={OPTIONS}
            onPick={setLast}
            triggerLabel="추가"
            className="w-full"
            searchPlaceholder="검색"
            emptyLabel="없음"
          />
        </div>
      </section>

      {last === '' ? null : (
        <p className="text-dl-xs text-dl-fg-subtle">마지막으로 고른 값: {last}</p>
      )}
    </div>
  );
}
