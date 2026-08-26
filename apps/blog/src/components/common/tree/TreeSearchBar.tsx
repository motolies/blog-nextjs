import { Icon, Input } from '@hvy/ui';
import { Search } from 'lucide-react';

interface TreeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
  /** 접근성 이름 — placeholder 는 이름이 아니고, 화면마다 무엇을 검색하는지가 다르다. */
  label: string;
  /** 매칭 노드 수. 검색 중이 아니면 null 을 넘겨 건수를 감춘다. */
  resultCount: number | null;
}

/**
 * 트리 화면 상단 검색바 — `/admin/categories` 와 `/admin/master-code` 가 공유한다.
 *
 * 돋보기·× 를 absolute 로 직접 배치하지 않는다. `Input` 의 `prefix`/`clearable` 슬롯이
 * 패딩·배색·접근성 이름은 물론 지우기 후 포커스 복귀까지 관리한다. `clearable` 은 제어형
 * 전용이고 값을 직접 지우지 않으므로 지우기 동작은 `onClear` 로 올라온다.
 *
 * 바깥 여백은 `.admin-workspace` 의 gap(1rem)이 이미 준다 — 여기서 margin 을 더하지 않는다.
 */
export default function TreeSearchBar({
  value,
  onChange,
  onClear,
  placeholder,
  label,
  resultCount,
}: TreeSearchBarProps) {
  return (
    <div className="admin-panel admin-panel-pad">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label={label}
            prefix={<Icon icon={Search} />}
            clearable
            onClear={onClear}
            clearLabel="검색어 지우기"
          />
        </div>
        {resultCount != null && (
          // 타이핑마다 값이 바뀐다 — live region 이 아니면 스크린리더는 결과 수를 알 수 없다.
          <span
            role="status"
            aria-live="polite"
            className="shrink-0 text-dl-xs text-[color:var(--admin-text-faint)]"
          >
            결과 {resultCount}건
          </span>
        )}
      </div>
    </div>
  );
}
