'use client';

import { Button, Checkbox, Field, PickerDialog } from '@hvy/ui';
import { useState } from 'react';

/**
 * 선택 모달 — **닫는 경로를 좁힌 창**.
 *
 * 콘텐츠 모달과 두 가지가 다르다: Esc·딤 클릭을 받지 않고, 폭·높이 축이 없다.
 *
 * 검증 포인트:
 * · **Esc 를 눌러도, 딤을 클릭해도 닫히지 않는다** — 체크해 둔 것을 잃는 경로를
 *   헤더 × 와 푸터 닫기 둘로 좁힌 규격이다. 체크를 몇 개 해 두고 Esc 를 눌러 볼 것
 * · 우하단을 끌어 창 크기를 바꿀 수 있고 min-width 아래로는 줄어들지 않는다 —
 *   크기 축(size·height)이 없는 이유가 이 리사이즈다. 드래그 이동까지 직접 만들면
 *   포커스 트랩·키보드 이동을 다시 만들게 되어 Radix 를 쓰는 의미가 없어진다
 * · 폭 기본 1140 · 높이 80vh
 * · Tab 을 계속 눌러 포커스가 창 밖으로 새지 않는지 본다
 * · 그리드가 든 실전 조합은 Examples 의 「선택 모달 → 폼 반영」에 있다
 */
const TAGS = [
  'React',
  'Next.js',
  'TypeScript',
  'CSS',
  '테스트',
  '성능',
  '접근성',
  '디자인 시스템',
  'Spring',
  '데이터베이스',
  'DevOps',
  '회고',
];

export function DialogPickerDemo() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [applied, setApplied] = useState<readonly string[]>([]);

  const toggle = (tag: string) =>
    setPicked((previous) =>
      previous.includes(tag) ? previous.filter((entry) => entry !== tag) : [...previous, tag],
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button variant="outline-gray" onClick={() => setOpen(true)}>
          태그 고르기
        </Button>
        <p className="text-dl-xs text-dl-fg-muted">
          적용됨: {applied.length === 0 ? '(없음)' : applied.join(', ')}
        </p>
      </div>

      <PickerDialog
        open={open}
        onOpenChange={setOpen}
        title="태그 선택"
        footer={
          <>
            <Button variant="outline-strong" onClick={() => setOpen(false)}>
              닫기
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setApplied(picked);
                setOpen(false);
              }}
            >
              적용 ({picked.length})
            </Button>
          </>
        }
      >
        <div className="rounded-dl-container border border-dl-border p-3">
          <p className="mb-2 text-dl-xs text-dl-fg-muted">
            몇 개 체크한 뒤 <b>Esc</b> 를 눌러 보세요 — 닫히지 않아야 합니다. 딤(바깥 어두운 영역)
            클릭도 마찬가지입니다.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-3">
            {TAGS.map((tag) => (
              <Field key={tag} label={tag} htmlFor={`pk-${tag}`} layout="inline">
                <Checkbox
                  id={`pk-${tag}`}
                  checked={picked.includes(tag)}
                  onChange={() => toggle(tag)}
                />
              </Field>
            ))}
          </div>
        </div>
      </PickerDialog>
    </div>
  );
}
