'use client';

import { ContentDialog, Icon, InlineNotice, Input, Spinner } from '@hvy/ui';
import { Ban } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { filterIconGroups, LINK_ICON_NAMES, resolveLinkIcon } from '@/lib/linkIcons';
import {
  type LucideCatalog,
  type LucideCatalogEntry,
  loadLucideCatalog,
  searchCatalog,
} from '@/lib/lucideMeta';

/** 범위 칩의 고정 값. 나머지는 lucide 카테고리 slug 다. */
const SCOPE_ALL = 'all';
const SCOPE_CURATED = 'curated';

/**
 * 긴 목록을 한 번에 몇 개씩 그릴지. 타일 하나가 아이콘 청크 하나를 요청하므로 이 값이 곧 동시 요청
 * 수다 — HTTP/2 뒤에서는 넉넉하지만 `next dev`(HTTP/1.1) 에서는 이보다 크면 워터폴이 눈에 띈다.
 */
const PAGE_SIZE = 96;

const CURATED_NAMES = new Set(LINK_ICON_NAMES);

/**
 * 아이콘 선택 모달 — lucide 전체(1,700여 개)를 카테고리·태그로 찾는다.
 *
 * 이 화면이 존재하는 이유는 **사용자가 어떤 아이콘이 있는지 모르기 때문**이다. 그래서 세 가지를
 * 지킨다: (1) 검색어를 지워 전체 목록으로 돌아올 수 있어야 하고(clearable), (2) 검색은 영어
 * 이름·영문 태그(lucide.dev 와 같은 동의어)뿐 아니라 큐레이션의 한글 keywords 도 본다("배포" 로
 * Rocket 이, "photo" 로 Camera 가 나와야 한다), (3) 카테고리 칩으로 훑어볼 수 있다(lucide.dev 의
 * categories 화면과 같은 구성).
 *
 * 목록(이름·태그·카테고리)은 `lucideMeta.json` 을 열릴 때 지연 로드하고, 타일의 SVG 는
 * `resolveLinkIcon` 이 이름 하나당 청크 하나로 가져온다 — 큐레이션 밖 아이콘 코드는 이 모달을
 * 열기 전까지 어디에도 실리지 않는다. 긴 목록은 IntersectionObserver 센티널로 조금씩 그린다.
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
  const [scope, setScope] = useState<string>(SCOPE_ALL);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [catalog, setCatalog] = useState<LucideCatalog | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 열릴 때 카탈로그를 가져온다. 모듈 캐시라 두 번째부터는 즉시 풀린다.
  useEffect(() => {
    if (!open || catalog) return;
    let cancelled = false;
    setLoadFailed(false);
    loadLucideCatalog()
      .then((loaded) => {
        if (!cancelled) setCatalog(loaded);
      })
      .catch((error: unknown) => {
        console.error('[IconPickerDialog] 아이콘 목록 로드 실패', error);
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, catalog]);

  const changeQuery = (next: string) => {
    setQuery(next);
    setVisibleCount(PAGE_SIZE);
  };
  const changeScope = (next: string) => {
    setScope(next);
    setVisibleCount(PAGE_SIZE);
  };

  const showCurated = scope === SCOPE_ALL || scope === SCOPE_CURATED;
  const curatedGroups = useMemo(
    () => (showCurated ? filterIconGroups(query) : []),
    [showCurated, query],
  );

  /** 전체·카테고리 범위의 결과. 전체 범위에서는 위 "추천" 섹션과 겹치지 않게 큐레이션을 뺀다. */
  const catalogEntries = useMemo<readonly LucideCatalogEntry[]>(() => {
    if (!catalog || scope === SCOPE_CURATED) return [];
    const results = searchCatalog(catalog, query, scope === SCOPE_ALL ? null : scope);
    return scope === SCOPE_ALL
      ? results.filter((entry) => !CURATED_NAMES.has(entry.name))
      : results;
  }, [catalog, scope, query]);

  const visibleEntries = catalogEntries.slice(0, visibleCount);
  const hasMore = visibleCount < catalogEntries.length;

  // 센티널이 보이면 다음 묶음을 그린다. visibleCount 를 의존성에 두어 묶음을 붙인 뒤에도 센티널이
  // 여전히 보이면(큰 화면) 다시 관찰을 시작해 곧바로 이어서 채운다.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!open || !hasMore || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => count + PAGE_SIZE);
        }
      },
      { root: scrollRef.current, rootMargin: '240px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, hasMore, visibleCount]);

  const choose = (iconName: string) => {
    onSelect(iconName);
    onOpenChange(false);
  };

  const curatedCount = curatedGroups.reduce((sum, group) => sum + group.icons.length, 0);
  const nothingFound = curatedCount === 0 && catalogEntries.length === 0;

  return (
    <ContentDialog
      open={open}
      onOpenChange={onOpenChange}
      title="아이콘 선택"
      description="이름·영문 태그·한글 키워드로 검색할 수 있습니다. 예: 배포, chart, photo, db"
      size="lg"
      height="tall"
    >
      {/* @container — 사이드바/칩 전환을 뷰포트가 아니라 모달 폭으로 판단한다(size 옵션이 바뀌어도 같이 따라간다). */}
      <div className="@container flex min-h-0 flex-col gap-3">
        <Input
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          clearable
          onClear={() => changeQuery('')}
          placeholder="아이콘 검색 (예: 배포, camera, 로그)"
        />

        <div className="flex min-h-0 flex-1 flex-col gap-3 @lg:flex-row @lg:gap-4">
          {/* 범위 목록 — lucide.dev 의 카테고리 사이드바에 해당한다. 넓은 모달에서는 왼쪽 세로 목록,
              좁은 모달에서는 가로 스크롤 칩. 단일 선택이라 각 버튼의 aria-pressed 로 표현한다. */}
          <div className="flex shrink-0 gap-1.5 overflow-x-auto pb-1 @lg:w-44 @lg:flex-col @lg:gap-0.5 @lg:overflow-y-auto @lg:border-r @lg:border-dl-border @lg:pr-2 @lg:pb-0">
            <ScopeChip
              label="전체"
              count={catalog?.entries.length}
              pressed={scope === SCOPE_ALL}
              onClick={() => changeScope(SCOPE_ALL)}
            />
            <ScopeChip
              label="추천"
              count={LINK_ICON_NAMES.length}
              pressed={scope === SCOPE_CURATED}
              onClick={() => changeScope(SCOPE_CURATED)}
            />
            {catalog?.categories.map((category) => (
              <ScopeChip
                key={category.slug}
                label={category.title}
                count={category.count}
                pressed={scope === category.slug}
                onClick={() => changeScope(category.slug)}
              />
            ))}
          </div>

          <div
            ref={scrollRef}
            className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-y-auto"
          >
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

            {loadFailed && (
              <InlineNotice tone="warning" title="전체 아이콘 목록을 불러오지 못했습니다">
                추천 아이콘은 계속 고를 수 있습니다. 모달을 닫았다 다시 열면 재시도합니다.
              </InlineNotice>
            )}

            {curatedGroups.map((group) => (
              <IconSection key={group.title} title={group.title} count={group.icons.length}>
                {group.icons.map((entry) => (
                  <IconTile
                    key={entry.name}
                    name={entry.name}
                    selected={value === entry.name}
                    onChoose={choose}
                  />
                ))}
              </IconSection>
            ))}

            {!catalog && !loadFailed && scope !== SCOPE_CURATED && (
              <div className="flex items-center gap-2 py-4 text-dl-sm text-dl-fg-muted">
                <Spinner />
                전체 아이콘 목록을 불러오는 중…
              </div>
            )}

            {catalogEntries.length > 0 && (
              <IconSection
                title={
                  scope === SCOPE_ALL
                    ? '전체'
                    : (catalog?.categories.find((c) => c.slug === scope)?.title ?? scope)
                }
                count={catalogEntries.length}
              >
                {visibleEntries.map((entry) => (
                  <IconTile
                    key={entry.key}
                    name={entry.name}
                    selected={value === entry.name}
                    onChoose={choose}
                  />
                ))}
              </IconSection>
            )}

            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-2" aria-hidden="true">
                <Spinner />
              </div>
            )}

            {nothingFound && (catalog || scope === SCOPE_CURATED) && (
              <p className="py-8 text-center text-dl-sm text-dl-fg-muted">
                검색 결과가 없습니다. 검색어를 지우거나 범위를 "전체"로 바꿔 보세요.
              </p>
            )}
          </div>
        </div>
      </div>
    </ContentDialog>
  );
}

/**
 * 범위 항목. 좁은 모달에서는 알약 칩, 넓은 모달(@lg(32rem) 이상)에서는 사이드바의 행이 된다 — 마크업 하나에
 * 컨테이너 변형만 다르다. 개수는 카탈로그가 오기 전엔 비어 있을 수 있어 선택 표시다.
 */
function ScopeChip({
  label,
  count,
  pressed,
  onClick,
}: {
  readonly label: string;
  readonly count?: number;
  readonly pressed: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-dl-xs transition hover:bg-dl-tonal @lg:w-full @lg:justify-between @lg:rounded-dl-control @lg:py-1.5 @lg:text-dl-sm ${
        pressed
          ? 'border-dl-primary bg-dl-tonal text-dl-primary-ink'
          : 'border-dl-border text-dl-fg-label @lg:border-transparent'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1 text-dl-fg-muted @lg:ml-2 @lg:text-dl-xs">
          {count.toLocaleString('ko-KR')}
        </span>
      )}
    </button>
  );
}

/** 섹션 제목 + 타일 그리드. 제목 옆 개수는 "검색이 얼마나 좁혀졌는지"를 알려준다. */
function IconSection({
  title,
  count,
  children,
}: {
  readonly title: string;
  readonly count: number;
  readonly children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-dl-sm font-semibold text-dl-fg-label">
        {title}
        <span className="ml-1.5 font-normal text-dl-fg-muted">{count.toLocaleString('ko-KR')}</span>
      </p>
      {/* auto-fill: 모달 폭에 따라 열 수가 정해지고 타일은 4.5rem 아래로 줄지 않는다 — 아이콘 32px 이 타일의 40% 안팎을 차지한다. */}
      <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
        {children}
      </div>
    </section>
  );
}

/**
 * 타일 하나. 아이콘은 `resolveLinkIcon` 으로 그린다 — 큐레이션이면 정적 컴포넌트, 아니면 이름별
 * lazy 래퍼라 화면에 들어온 타일만 자기 청크를 요청한다.
 */
function IconTile({
  name,
  selected,
  onChoose,
}: {
  readonly name: string;
  readonly selected: boolean;
  readonly onChoose: (name: string) => void;
}) {
  const IconComponent = resolveLinkIcon(name);
  if (!IconComponent) return null;
  return (
    <button
      type="button"
      title={name}
      aria-label={name}
      aria-pressed={selected}
      onClick={() => onChoose(name)}
      className={`flex aspect-square items-center justify-center rounded-dl-control border transition hover:bg-dl-tonal ${
        selected ? 'border-dl-primary bg-dl-tonal text-dl-primary-ink' : 'border-dl-border'
      }`}
    >
      {/* @hvy/ui Icon 의 크기 토큰(최대 24px)은 타일에 비해 작다 — LinkRow 처럼 직접 그려 32px 로 키운다. */}
      <IconComponent className="size-8 shrink-0" aria-hidden="true" />
    </button>
  );
}
