'use client';

import { Badge, Combobox } from '@hvy/ui';
import { useEffect, useState } from 'react';

/**
 * 서버 검색 — 검색어를 **앱이 소유**하고(query/onQueryChange) 목록은 걸러 온 결과를 그대로 그린다.
 *
 * 이 모드에서는 **내부 필터가 꺼진다**. 디바운스와 API 호출은 전부 앱 몫이다.
 *
 * 검증 포인트:
 * · 타이핑을 멈춘 뒤에야(300ms) 목록이 바뀐다 — 그 사이 loading 이 켜져 스피너 행이 뜬다
 * · 결과가 0건이면 emptyLabel 이 뜬다
 * · **고르지 않고 닫았다 다시 열었을 때 지난 검색 결과가 남아 있으면 버그다** —
 *   검색어가 앱 state 라 컴포넌트가 열림·닫힘에서 비워 주지 않으면 지난 결과가
 *   새 결과처럼 보인다. 이 모드의 핵심 계약이다
 * · 내부 필터가 정말 꺼졌는지 본다: 서버가 검색어와 **무관한 항목**을 하나 섞어 돌려주는데
 *   (아래 "· 서버가 끼워 넣은 추천" 배지) 그대로 나와야 한다. 내부 필터가 살아 있으면 사라진다
 * · 검색 중에도 onCreate 행이 겹칠 수 있다 — 정확 일치 판정은 **서버가 준 options** 기준이다
 */

const ALL_TAGS = [
  'React',
  'Next.js',
  'TypeScript',
  'CSS',
  'Tailwind',
  '테스트',
  '성능',
  '접근성',
  '디자인 시스템',
  'Spring',
  '데이터베이스',
  'DevOps',
  '회고',
  '번역',
  '오픈소스',
];

/** 서버가 끼워 넣는 추천 — 검색어와 무관하다. 내부 필터가 꺼진 것을 증명하는 장치다. */
const SPONSORED = '주간 인기 태그';

export function ComboboxServerSearchDemo() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<readonly { value: string; label: string }[]>([]);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [calls, setCalls] = useState(0);

  /** 디바운스 300ms — 앱 몫이다. 컴포넌트는 검색어를 올려 줄 뿐 호출 시점을 모른다. */
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const hits = ALL_TAGS.filter((tag) => tag.toLowerCase().includes(query.trim().toLowerCase()));
      setOptions([
        ...hits.map((tag) => ({ value: tag, label: tag })),
        // 검색어와 무관한 항목 — 내부 필터가 살아 있으면 여기서 걸러져 사라진다.
        { value: SPONSORED, label: `${SPONSORED} · 서버가 끼워 넣은 추천` },
      ]);
      setCalls((previous) => previous + 1);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Combobox
          options={options}
          query={query}
          onQueryChange={setQuery}
          loading={loading}
          onPick={(value) => setPicked((previous) => [...new Set([...previous, value])])}
          pickedValues={picked}
          triggerLabel="태그 검색 (서버)"
          searchPlaceholder="두 글자 이상 입력"
          emptyLabel="검색 결과가 없습니다"
        />
        <span className="text-dl-xs text-dl-fg-muted">서버 호출 {calls}회</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {picked.length === 0 ? (
          <span className="text-dl-xs text-dl-fg-muted">고른 태그가 여기 쌓인다(피커형).</span>
        ) : (
          picked.map((tag) => (
            <Badge key={tag} tone="primary" size="xs">
              {tag}
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
