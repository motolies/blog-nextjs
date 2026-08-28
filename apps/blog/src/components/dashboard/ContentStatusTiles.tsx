'use client';

import { StatTile } from '@hvy/ui';
import type { UseQueryResult } from '@tanstack/react-query';
import Link from 'next/link';
import { Skeleton } from '@/components/common/Skeleton';
import { formatCompact } from '@/lib/statFormat';
import type { StatsSummary } from '@/types/stats';

/**
 * 콘텐츠 상태 타일.
 *
 * "총 글 수"를 단독으로 두지 않고 발행/임시/비공개/초안으로 <b>분해</b>한 뒤
 * 각각을 필터링된 /admin/posts 로 연결한다. 클릭해서 들어갈 수 있는 숫자는 허영 지표가 아니다 —
 * 바라만 볼 수 있는 숫자가 허영 지표다.
 *
 * "저장 안 된 초안"은 지금까지 UI 어디에서도 보이지 않던 정보다.
 * 글을 열어보기 전에는 초안이 남아 있는지 알 방법이 없었다.
 */

interface ContentStatusTilesProps {
  query: UseQueryResult<StatsSummary>;
}

const TILE_SPAN = 'col-span-12 sm:col-span-6 xl:col-span-3';

export function ContentStatusTiles({ query }: ContentStatusTilesProps) {
  const posts = query.data?.posts;
  const taxonomy = query.data?.taxonomy;

  const tiles = [
    {
      label: '발행',
      value: posts?.publishedPosts,
      href: '/admin/posts?status=PUB',
      tone: 'neutral' as const,
    },
    {
      label: '임시 저장',
      value: posts?.temporaryPosts,
      href: '/admin/posts?status=TEM',
      tone: 'warning' as const,
    },
    {
      label: '비공개',
      value: posts?.privatePosts,
      href: '/admin/posts?publicAccess=false',
      tone: 'neutral' as const,
    },
    {
      label: '반영 안 된 초안',
      value: taxonomy?.draftCount,
      href: '/admin/posts?hasDraft=true',
      tone: 'warning' as const,
    },
  ];

  return (
    <div className="admin-stat-grid">
      {tiles.map((tile) => (
        <Link
          key={tile.label}
          href={tile.href}
          className={`block rounded-dl-container ${TILE_SPAN}`}
        >
          <StatTile
            label={tile.label}
            // 이 수치는 화면의 그리드가 아니라 다른 화면의 데이터에서 나온다 —
            // StatTile 문서가 요구하는 대로 기준을 hint 에 명기한다
            hint="전체 기준"
            tone={tile.value ? tile.tone : 'neutral'}
            value={
              query.isPending ? (
                <Skeleton variant="text" className="w-12" />
              ) : query.isError ? (
                '—'
              ) : (
                formatCompact(tile.value ?? 0)
              )
            }
          />
        </Link>
      ))}
    </div>
  );
}
