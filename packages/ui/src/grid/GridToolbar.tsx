'use client';

import { X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { FormMode } from '../components/form-mode';
import { Input } from '../components/input';
import { Select } from '../components/select';
import { Icon } from '../icons';
import { cn } from '../lib/cn';

/** 선택 컨텍스트 — 선택이 있는 동안 툴바가 "선택에 대한 조작대"로 교대하는 계약. */
export type GridToolbarSelection = {
  /** 선택 건수 — `useGridSelection` 의 `selectedIds.size` 를 배선한다. */
  readonly count: number;
  /** "N건 선택" 요약 문구 — `ui` 는 사전을 모른다. 주입받는다. */
  readonly summary: (count: number) => string;
  /** 선택이 있을 때 `actions` 자리를 **교대**하는 액션들 — 선택 삭제·일괄 변경 등. */
  readonly actions?: ReactNode;
  /** 선택 전체 해제 × — label 은 a11y 필수라 핸들러와 함께 받는다. */
  readonly clear?: { readonly label: string; readonly onClick: () => void };
};

/**
 * 그리드 툴바 — v3 §ds-03.
 *
 * ```
 * [총 N건 · 페이저 · 페이지크기]   …   [액션들] │ [표시 컨트롤]
 * ```
 *
 * ⚠️ ds-03 본문은 "왼쪽 = 액션"이라고 서술하지만 **실제 목업(`mock-pm-toolbar`)은
 * 페이징이 왼쪽**이다. 문서의 "왼쪽"은 액션 그룹 안에서의 상대 위치를 말한 것으로 읽힌다.
 * 구현은 스크린샷을 따른다.
 *
 * 잠긴 상태(확정 이후)에서는 **액션만 감춘다** — 표시 컨트롤은 열람에도 쓰인다.
 * 높이 = 액션 버튼 sm + 상하 6 + 보더 1 (default 49). 버튼 sm 이 테마 스케일을
 * 따라가므로 툴바도 자동 추종한다 — `--spacing-dl-grid-toolbar` 공식과 같은 식이다.
 *
 * `selection` 이 있고 count > 0 이면 페이징 옆에 "N건 선택" 요약(+해제 ×)이 뜨고
 * `actions` 자리가 `selection.actions` 로 **교대**한다 — 화면마다
 * `disabled={count === 0}` 삼항식을 반복하던 배선을 여기로 흡수한 것이다.
 * 표시 컨트롤은 교대하지 않는다 — 선택 중에도 열람 도구는 그대로 쓰인다.
 */
export function GridToolbar({
  paging,
  actions,
  viewControls,
  selection,
  className,
}: {
  /** 총 건수 · 페이저 · 페이지당 건수. 어느 화면에서도 빠뜨리지 않는다. */
  readonly paging?: ReactNode;
  /** 화면이 정하는 액션 — 신규 등록 · 선택 삭제 · 엑셀 다운로드 등. */
  readonly actions?: ReactNode;
  /** 행 높이 · 정렬 · 목록 · 컬럼 설정. 액션과 **구분 막대로** 갈린다. */
  readonly viewControls?: ReactNode;
  /** 선택 컨텍스트 — 생략하면 기존 동작 그대로다(전부 opt-in). */
  readonly selection?: GridToolbarSelection;
  readonly className?: string;
}) {
  const selecting = selection !== undefined && selection.count > 0;
  // 선택 액션이 정의되어 있을 때만 교대한다 — 요약만 쓰고 액션은 상시 유지도 가능하다.
  const effectiveActions =
    selecting && selection.actions !== undefined ? selection.actions : actions;

  return (
    /* 그리드 크롬은 폼이 아니다 — FormMode(view/disabled) 아래에서도 퀵서치·
       페이지크기 셀렉트가 잠기면 안 되므로 edit 로 핀한다. paging/actions 등
       prop 으로 받은 요소도 이 트리 안에서 렌더되므로 핀이 관통한다. */
    <FormMode value="edit">
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-b-dl-container border border-t-0 border-dl-border bg-dl-surface px-3 py-1.5',
          className,
        )}
      >
        {/* paging 은 래퍼 없이 루트에 직접 흘린다 — 래퍼로 감싸면 하나의 flex 아이템이 되어
            좁은 화면에서 내부적으로만 접히고 오른쪽 그룹이 셋째 줄로 밀린다. 직접 흘리면
            총건수·페이저·페이지크기가 오른쪽 그룹과 줄을 나눠 가져 두 줄로 정리된다. */}
        {paging}

        {selecting ? (
          <span className="ml-3 inline-flex items-center gap-1 whitespace-nowrap font-semibold text-dl-md text-dl-primary-ink">
            {selection.summary(selection.count)}
            {selection.clear ? (
              <button
                type="button"
                aria-label={selection.clear.label}
                title={selection.clear.label}
                onClick={selection.clear.onClick}
                // PagerButton 과 같은 고스트 규격(24×24) — 액션 버튼과 무게를 가른다.
                className="inline-flex size-6 items-center justify-center rounded-dl-control text-dl-fg-muted hover:bg-dl-option-hover"
              >
                <Icon icon={X} size="sm" />
              </button>
            ) : null}
          </span>
        ) : null}

        <div className="ml-auto flex items-center gap-1.5">
          {effectiveActions}
          {/* 구분 막대는 **버튼↔표시 옵션 사이 하나만** 둔다 */}
          {effectiveActions && viewControls ? <GridToolbarSeparator /> : null}
          {viewControls}
        </div>
      </div>
    </FormMode>
  );
}

/** 구분 막대 — **버튼↔표시 옵션 사이 하나만** 둔다(v3 §ds-03). */
export function GridToolbarSeparator() {
  return <span className="mx-1.5 h-5 w-px shrink-0 self-center bg-dl-separator" />;
}

/**
 * 총 건수 — **박스 없는 텍스트형**. QA table-footer-info:
 * "총·건"은 회색(gray-6b) 600, 숫자만 primary 16px 600.
 */
export function TotalCount({
  total,
  prefix,
  suffix,
  format,
}: {
  readonly total: number;
  readonly prefix: string;
  readonly suffix: string;
  /** 로케일 포맷터. `ui` 는 로케일을 모른다 — 주입받는다. */
  readonly format: (value: number) => string;
}) {
  return (
    <span className="inline-flex items-center whitespace-nowrap text-dl-md">
      <span className="font-semibold text-dl-fg-muted">{prefix}</span>
      <span className="mx-1 font-semibold text-dl-primary-ink text-dl-xl">{format(total)}</span>
      <span className="font-semibold text-dl-fg-muted">{suffix}</span>
    </span>
  );
}

export type PagerLabels = {
  readonly first: string;
  readonly prev: string;
  readonly next: string;
  readonly last: string;
  readonly jump: string;
  /** 비활성 이유. v3 §ds-06 은 왜 못 누르는지 적으라고 한다. */
  readonly atFirst: string;
  readonly atLast: string;
};

/**
 * 페이저 — `≪ < [입력] / N > ≫`.
 *
 * 버튼이 `Button` 이 아니라 고스트 텍스트인 이유: QA 도 페이지 네비를 **버튼 규격 밖**
 * (24×24 `.page-nav`)으로 따로 둔다. 액션 버튼과 같은 무게로 보이면 툴바가 시끄러워진다.
 */
export function Pager({
  pageIndex,
  pageCount,
  onChange,
  labels,
}: {
  readonly pageIndex: number;
  readonly pageCount: number;
  readonly onChange: (next: number) => void;
  readonly labels: PagerLabels;
}) {
  const [jump, setJump] = useState('');
  const current = pageIndex + 1;
  const atFirst = pageIndex <= 0;
  const atLast = current >= pageCount;

  const go = (next: number) => {
    setJump('');
    onChange(next);
  };

  return (
    <div className="inline-flex items-center gap-px">
      <PagerButton
        label={labels.first}
        disabled={atFirst}
        title={labels.atFirst}
        onClick={() => go(0)}
      >
        ≪
      </PagerButton>
      <PagerButton
        label={labels.prev}
        disabled={atFirst}
        title={labels.atFirst}
        onClick={() => go(pageIndex - 1)}
      >
        &lt;
      </PagerButton>

      <Input
        size="sm"
        className="mx-0.5 w-12"
        align="center"
        value={jump === '' ? String(current) : jump}
        aria-label={labels.jump}
        onChange={(event) => setJump(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          const target = Number(jump);
          if (Number.isFinite(target) && target >= 1 && target <= pageCount) go(target - 1);
          else setJump('');
        }}
        // 포커스를 잃으면 편집 중이던 값을 버리고 현재 페이지로 되돌린다 —
        // 안 그러면 화면에 보이는 숫자와 실제 페이지가 어긋난 채 남는다.
        onBlur={() => setJump('')}
      />
      {/* nowrap 이 없으면 좁은 화면에서 "/"와 숫자 사이 공백이 줄바꿈 지점이 된다 — TotalCount 와 같은 규약. */}
      <span className="mr-0.5 whitespace-nowrap text-dl-sm text-dl-fg-muted">/ {pageCount}</span>

      <PagerButton
        label={labels.next}
        disabled={atLast}
        title={labels.atLast}
        onClick={() => go(pageIndex + 1)}
      >
        &gt;
      </PagerButton>
      <PagerButton
        label={labels.last}
        disabled={atLast}
        title={labels.atLast}
        onClick={() => go(pageCount - 1)}
      >
        ≫
      </PagerButton>
    </div>
  );
}

function PagerButton({
  children,
  label,
  disabled,
  title,
  onClick,
}: {
  readonly children: ReactNode;
  readonly label: string;
  readonly disabled: boolean;
  readonly title: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={disabled ? title : label}
      disabled={disabled}
      onClick={onClick}
      // QA .page-nav: 24×24 · 비활성은 opacity .3
      className="inline-flex size-6 items-center justify-center rounded-dl-control text-dl-fg-muted text-dl-xs hover:bg-dl-option-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

/** 페이지당 건수. 값 목록은 `contracts` 가 갖는다 — `ui` 는 계약을 모른다. */
export function PageSizeSelect({
  value,
  onChange,
  options,
  label,
  suffix,
  format,
}: {
  readonly value: number;
  readonly onChange: (next: number) => void;
  readonly options: readonly number[];
  readonly label: string;
  readonly suffix: string;
  readonly format: (value: number) => string;
}) {
  return (
    <Select
      // 폭은 라벨이 정한다 — 접미사("건씩"/"건")는 호출부가, 좌우 패딩은 테마(--dl-scale-*)가
      // 바꾸므로 고정 px 를 박으면 그 순간 truncate 로 잘린다(w-[86px] 시절 실제 증상).
      className="w-auto"
      // 푸터 규격은 sm 이다 — 컬럼 설정 버튼·페이지 이동 입력과 같은 높이로 맞춘다.
      size="sm"
      value={String(value)}
      onValueChange={(next) => onChange(Number(next))}
      placeholder={label}
      options={options.map((pageSize) => ({
        value: String(pageSize),
        label: `${format(pageSize)}${suffix}`,
      }))}
    />
  );
}
