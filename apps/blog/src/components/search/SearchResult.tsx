import { ArrowRight, Clock3, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { formatUtcToLocal } from '@/util/dateTimeUtil';

interface SearchResultPost {
  id: string;
  subject: string;
  categoryName: string;
  createDate: string | number;
}

interface SearchResultProps {
  posts?: SearchResultPost[];
}

export default function SearchResult({ posts }: SearchResultProps) {
  const searchedPost = posts ?? [];

  const timestampFormat = (timestamp: string | number): string => {
    return formatUtcToLocal(timestamp, 'yyyy-MM-dd HH:mm:ss');
  };

  return (
    <div className="space-y-3 lg:space-y-4">
      {searchedPost.map((post) => (
        <article
          key={post.id}
          className="surface-panel-strong rounded-(--radius-panel) p-(--public-pad-panel) transition duration-300 hover:-translate-y-1 hover:border-dl-tonal-border"
        >
          <div className="public-label-text public-text-meta flex flex-wrap items-center gap-2 font-medium uppercase tracking-[0.18em] lg:gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-dl-tonal px-2.5 py-1 text-dl-tonal-fg lg:px-3">
              <FolderOpen className="h-3.5 w-3.5" />
              {post.categoryName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {timestampFormat(post.createDate)}
            </span>
          </div>
          <Link href={`/post/${post.id}`} className="group mt-3 block lg:mt-4">
            <h2 className="public-text-title font-semibold tracking-[-0.03em] text-dl-fg transition group-hover:text-dl-primary-ink">
              {post.subject}
            </h2>
            <div className="public-text-body mt-3 inline-flex items-center gap-2 font-semibold text-dl-primary-ink lg:mt-4">
              Read post
              <ArrowRight className="size-(--public-icon) transition group-hover:translate-x-0.5" />
            </div>
          </Link>
        </article>
      ))}
      {searchedPost.length === 0 && (
        <div className="surface-panel-strong rounded-(--radius-panel) px-(--public-pad-panel) py-8 text-center lg:py-10">
          <p className="public-label-text public-text-body font-semibold uppercase tracking-[0.18em]">
            No Results
          </p>
          <h2 className="section-title public-text-title mt-3 font-semibold text-dl-fg">
            검색 결과가 없습니다.
          </h2>
          <p className="public-muted-text public-text-body mt-3">
            키워드 조합을 줄이거나 카테고리, 태그 조건을 다시 선택해 보세요.
          </p>
        </div>
      )}
    </div>
  );
}
