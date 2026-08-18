import { Combobox } from '@hvy/ui';
import { useEffect, useRef, useState } from 'react';
import { getTsid } from 'tsid-ts';
import service from '@/service';

interface PostSearchResult {
  id: number;
  subject: string;
}

interface PostSearchComboboxProps {
  excludePostIds: number[];
  onSelect: (post: { postId: number; subject: string }) => void;
}

/**
 * 시리즈에 넣을 포스트 검색 피커 — Combobox 의 서버 검색 모드(controlled query).
 * 디바운스(300ms)와 API 호출은 앱 몫이고, Combobox 는 목록·키보드·표시만 맡는다.
 */
export default function PostSearchCombobox({ excludePostIds, onSelect }: PostSearchComboboxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<PostSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 배열이 아니라 **내용**으로 effect 를 건다.
   * 호출부는 `series.posts.map(...)` 처럼 렌더마다 새 배열을 만드는 것이 자연스럽고,
   * 그걸 그대로 의존성에 두면 디바운스 타이머가 매 렌더 되감겨 검색이 영영 실행되지 않는다.
   * 신원 안정화를 호출부에 요구하는 대신 여기서 흡수한다 — 요구는 언젠가 잊힌다.
   */
  const excludeKey = excludePostIds.join(',');

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await service.post.search({
          searchAllParam: {
            searchType: 'TITLE',
            searchCondition: {
              keywords: [{ id: getTsid().toString(), name: searchQuery.trim() }],
              logic: 'AND',
            },
            categories: [],
            tags: [],
            page: 0,
            pageSize: 20,
          },
        });
        const posts: PostSearchResult[] = (res.data?.list ?? []).map((p: any) => ({
          id: Number(p.id),
          subject: p.subject,
        }));
        const excluded = new Set(excludeKey === '' ? [] : excludeKey.split(',').map(Number));
        setResults(posts.filter((p) => !excluded.has(p.id)));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // excludePostIds 가 아니라 excludeKey 를 거는 것이 핵심이다(위 주석 참조).
  }, [searchQuery, excludeKey]);

  const handlePick = (value: string) => {
    const post = results.find((p) => p.id === Number(value));
    if (!post) return;
    onSelect({ postId: post.id, subject: post.subject });
    setSearchQuery('');
    setResults([]);
  };

  return (
    <Combobox
      options={results.map((post) => ({ value: String(post.id), label: post.subject }))}
      onPick={handlePick}
      triggerLabel="포스트 검색하여 추가..."
      searchPlaceholder="포스트 제목으로 검색..."
      emptyLabel={searchQuery.trim() ? '검색 결과가 없습니다.' : '제목을 입력해 검색하세요.'}
      query={searchQuery}
      onQueryChange={setSearchQuery}
      loading={loading}
      className="w-full text-[color:var(--admin-text-muted)]"
    />
  );
}
