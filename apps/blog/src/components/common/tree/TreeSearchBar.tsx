import { Icon, Input } from '@hvy/ui';
import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

interface TreeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
  /** 접근성 이름 — placeholder 는 이름이 아니고, 화면마다 무엇을 검색하는지가 다르다. */
  label: string;
  /** 매칭 노드 수. 검색 중이 아니면 null 을 넘겨 건수를 감춘다. */
  resultCount: number | null;
  /**
   * 화면 액션 슬롯 — 루트 추가·캐시 삭제 등. 검색 입력 오른쪽 끝에 붙는다.
   *
   * 트리 화면에는 그리드가 없어 `GridToolbar` 의 액션 슬롯을 쓸 수 없다. 이 줄이 유일한
   * 가로 밴드이므로 여기가 그리드 화면의 툴바 액션과 같은 층이다 — 액션 전용 패널을
   * 따로 두면 `.admin-page-frame--fixed` 의 높이 예산만 축낸다.
   */
  actions?: ReactNode;
}

/**
 * 트리 화면 상단 검색바 — `/admin/categories`·`/admin/master-code`·`/admin/series` 가 공유한다.
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
  actions,
}: TreeSearchBarProps) {
  return (
    <div className="admin-panel admin-panel-pad">
      {/* flex-wrap: 액션이 둘 이상인 화면(master-code)에서 좁은 폭이면 버튼 줄이 통째로 내려간다 */}
      <div className="flex flex-wrap items-center gap-3">
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
        {/* shrink-0 은 필수다 — 없으면 flex-1 인 입력과 폭 경쟁에서 버튼이 눌린다 */}
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
