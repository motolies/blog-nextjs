import { Button } from '@hvy/ui';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface SearchPaginationProps {
  /** 1-based 현재 페이지 */
  currentPage: number;
  totalPage: number;
  onPageChange: (page: number) => void;
}

/** 검색 결과 페이지네이션 — 첫/이전/현재±2/다음/마지막 버튼을 nav 랜드마크로 감싼다 */
export default function SearchPagination({
  currentPage,
  totalPage,
  onPageChange,
}: SearchPaginationProps) {
  if (totalPage <= 0) {
    return null;
  }

  return (
    <nav
      aria-label="검색 결과 페이지"
      className="public-card-surface flex flex-wrap items-center justify-center gap-2 rounded-(--radius-card) border px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
    >
      <Button
        variant="outline-gray"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        title="첫 페이지입니다"
        aria-label="첫 페이지"
        className="public-control-surface aspect-square rounded-full border p-0"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline-gray"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        title="첫 페이지입니다"
        aria-label="이전 페이지"
        className="public-control-surface aspect-square rounded-full border p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {Array.from({ length: totalPage }, (_, i) => i + 1)
        .filter((p: number) => Math.abs(p - currentPage) <= 2)
        .map((p: number) => (
          <Button
            key={p}
            variant={p === currentPage ? 'primary' : 'outline-gray'}
            onClick={() => onPageChange(p)}
            aria-label={`${p} 페이지`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={
              p === currentPage
                ? 'aspect-square rounded-full bg-dl-primary p-0 text-dl-primary-fg'
                : 'public-control-surface aspect-square rounded-full border p-0'
            }
          >
            {p}
          </Button>
        ))}

      <Button
        variant="outline-gray"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPage}
        title="마지막 페이지입니다"
        aria-label="다음 페이지"
        className="public-control-surface aspect-square rounded-full border p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline-gray"
        onClick={() => onPageChange(totalPage)}
        disabled={currentPage === totalPage}
        title="마지막 페이지입니다"
        aria-label="마지막 페이지"
        className="public-control-surface aspect-square rounded-full border p-0"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
