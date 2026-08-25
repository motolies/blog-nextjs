'use client';

import { StatTile, type StatTileTone } from '@hvy/ui';
import { useState } from 'react';

/**
 * StatTile — 목록 화면 상단의 요약 수치 타일.
 * `onClick` 이 없으면 표시 전용, 있으면 필터 숏컷(토글 버튼)이다.
 * 실제 앱에서 `active` 판정의 진실은 URL 검색조건이다 — 이 데모는 state 로 대신한다.
 */

const numberFormat = new Intl.NumberFormat('ko-KR');

const SHORTCUTS: readonly {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly tone: StatTileTone;
}[] = [
  { key: 'all', label: '전체', value: 1240, tone: 'neutral' },
  { key: 'DRAFT', label: '초안', value: 214, tone: 'primary' },
  { key: 'EDITING', label: '수정중', value: 86, tone: 'warning' },
  { key: 'PUBLISHED', label: '발행', value: 903, tone: 'success' },
  { key: 'ERROR', label: '색인오류', value: 4, tone: 'danger' },
];

export function StatTilePlaygroundDemo() {
  const [selected, setSelected] = useState('all');

  return (
    <div className="flex flex-col gap-4">
      {/* 표시 전용 — 그리드와 같은 데이터에서 파생한 수치 + 집계 기준(hint) 명기 */}
      <section className="grid grid-cols-2 gap-dl-gutter md:grid-cols-4">
        <StatTile label="총 조회수" hint="조회 결과 기준" value={numberFormat.format(52180)} />
        <StatTile label="이번 주 조회수" hint="조회 결과 기준" value={numberFormat.format(3120)} />
        <StatTile label="순 방문자" hint="조회 결과 기준" value={numberFormat.format(47960)} />
        <StatTile
          label="색인 실패"
          hint="최근 30일"
          tone="danger"
          value={numberFormat.format(12)}
        />
      </section>

      {/* 필터 숏컷 — 클릭하면 검색조건이 바뀐다(실제 앱은 URL 로 반영) */}
      <section className="grid grid-cols-2 gap-dl-gutter md:grid-cols-5">
        {SHORTCUTS.map((stat) => (
          <StatTile
            key={stat.key}
            label={stat.label}
            hint="전체 기준"
            tone={stat.tone}
            value={numberFormat.format(stat.value)}
            active={selected === stat.key}
            onClick={() => setSelected(stat.key)}
          />
        ))}
      </section>

      <p className="text-dl-xs text-dl-fg-muted">선택된 필터: {selected}</p>
    </div>
  );
}
