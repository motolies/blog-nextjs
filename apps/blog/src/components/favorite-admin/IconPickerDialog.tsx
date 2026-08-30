'use client';

import { ContentDialog, Icon, Input } from '@hvy/ui';
import { Ban } from 'lucide-react';
import { useMemo, useState } from 'react';
import { filterIconGroups } from '@/lib/linkIcons';

/**
 * 아이콘 선택 모달.
 *
 * 이 화면이 존재하는 이유는 **사용자가 어떤 아이콘이 있는지 모르기 때문**이다. 그래서
 * 두 가지를 반드시 지킨다: (1) 검색어를 지워 전체 목록으로 돌아올 수 있어야 하고(clearable),
 * (2) 검색은 영어 이름뿐 아니라 한글 keywords 도 본다("배포" 로 Rocket 이 나와야 한다).
 *
 * 링크 편집 모달 안에서 열리는 중첩 다이얼로그다. PickerDialog 대신 ContentDialog 를 쓰는
 * 이유는 PickerDialog 가 Esc·딤 클릭을 막기 때문이다 — 다건 선택을 지키려는 설계라
 * 클릭 한 번으로 끝나는 단일 선택에는 오히려 빠져나갈 길을 막는다.
 */
export default function IconPickerDialog({
  open,
  onOpenChange,
  value,
  onSelect,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** 현재 선택된 아이콘 이름. 빈 문자열이면 "없음". */
  readonly value: string;
  readonly onSelect: (iconName: string) => void;
}) {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => filterIconGroups(query), [query]);

  const choose = (iconName: string) => {
    onSelect(iconName);
    onOpenChange(false);
  };

  return (
    <ContentDialog
      open={open}
      onOpenChange={onOpenChange}
      title="아이콘 선택"
      description="이름이나 한글 키워드로 검색할 수 있습니다. 예: 배포, 차트, db"
      size="lg"
      height="tall"
    >
      <div className="flex min-h-0 flex-col gap-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          clearable
          onClear={() => setQuery('')}
          placeholder="아이콘 검색 (예: 배포, chart, 로그)"
        />

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          <button
            type="button"
            onClick={() => choose('')}
            aria-pressed={value === ''}
            className={`flex items-center gap-2 self-start rounded-dl-control border px-3 py-2 text-dl-sm ${
              value === '' ? 'border-dl-primary text-dl-primary-ink' : 'border-dl-border'
            }`}
          >
            <Icon icon={Ban} size="sm" />
            아이콘 없음
          </button>

          {groups.map((group) => (
            <section key={group.title}>
              <p className="text-dl-sm font-semibold text-dl-fg-label">{group.title}</p>
              <div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-8">
                {group.icons.map((entry) => (
                  <button
                    key={entry.name}
                    type="button"
                    title={entry.name}
                    aria-label={entry.name}
                    aria-pressed={value === entry.name}
                    onClick={() => choose(entry.name)}
                    className={`flex aspect-square items-center justify-center rounded-dl-control border transition hover:bg-dl-tonal ${
                      value === entry.name
                        ? 'border-dl-primary bg-dl-tonal text-dl-primary-ink'
                        : 'border-dl-border'
                    }`}
                  >
                    <Icon icon={entry.icon} size="md" />
                  </button>
                ))}
              </div>
            </section>
          ))}

          {groups.length === 0 && (
            <p className="py-8 text-center text-dl-sm text-dl-fg-muted">
              검색 결과가 없습니다. 검색어를 지우면 전체 목록이 나옵니다.
            </p>
          )}
        </div>
      </div>
    </ContentDialog>
  );
}
