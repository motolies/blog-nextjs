import { cn } from '@hvy/ui';
import { ChevronDown, List } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeHeadingDepths } from '@/util/tocUtils';

interface TocItem {
  id: string;
  text: string;
  level: number;
  depth: number;
}

interface TableOfContentsProps {
  postBody: string;
  /**
   * sidebar: 항상 펼침(데스크톱 aside 전용) / collapse: 접기 버튼(모바일 본문 상단 전용).
   * 배치·표시 분기는 부모가 결정한다 — 헤딩 id 부여는 결정적이라 두 인스턴스가 공존해도 안전하다.
   */
  variant?: 'sidebar' | 'collapse';
}

// depth(글 안에서 정규화된 0부터의 상대 깊이)별 들여쓰기 · 크기 · 굵기 · 색상.
// Tailwind는 소스에 문자 그대로 등장하는 클래스만 생성하므로 반드시 리터럴 문자열로 유지한다.
// 색을 .public-muted-text 같은 커스텀 클래스로 주면 안 된다. 그 규칙들은 @layer 밖에 있어
// @layer utilities 안의 hover:text-dl-primary-ink을 이겨버려 hover가 죽는다. 같은 토큰을 유틸리티로 참조한다.
// 굵기는 2단계뿐이다. JetBrains Mono·D2Coding 모두 400/700 페이스만 실어 font-medium(500)은 400으로 내려간다.
// depth 0에 본문 전경색 토큰을 쓰면 안 된다. 다크 모드의 본문색이 --public-text-muted와
// 같은 값이라 depth 1과 색이 구분되지 않는다. Metadata 패널과 같은 강조 색 관례를 따른다.
const DEPTH_STYLES = [
  {
    indent: 'pl-0',
    size: 'text-sm',
    weight: 'font-semibold',
    color: 'text-dl-fg',
  },
  {
    indent: 'pl-3',
    size: 'text-sm',
    weight: 'font-normal',
    color: 'text-[color:var(--public-text-muted)]',
  },
  {
    indent: 'pl-6',
    size: 'text-xs',
    weight: 'font-normal',
    color: 'text-[color:var(--public-text-muted)]',
  },
  {
    indent: 'pl-9',
    size: 'text-xs',
    weight: 'font-normal',
    color: 'text-[color:var(--public-text-subtle)]',
  },
] as const;

// 헤딩 레벨이 한 종류뿐인 글은 계층이 없으므로 강약을 끄고 평평하게 보여준다
const FLAT_STYLE = {
  size: 'text-sm',
  weight: 'font-normal',
  color: 'text-[color:var(--public-text-muted)]',
} as const;

// 현재 위치 표시. 같은 CSS 속성에 클래스가 둘 붙지 않도록 depth 값과 배타적으로 쓴다
const ACTIVE_WEIGHT = 'font-semibold';
const ACTIVE_COLOR = 'text-dl-primary';

const MAX_DEPTH = DEPTH_STYLES.length - 1;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function TableOfContents({ postBody, variant = 'sidebar' }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  // collapse variant 의 접기 상태 — 기본 접힘
  const [tocOpen, setTocOpen] = useState(false);
  // sidebar variant 의 내부 스크롤 컨테이너 — 목차가 길면 카드 안에서만 스크롤한다
  const scrollRef = useRef<HTMLDivElement>(null);

  // 본문 렌더 후 heading 수집 및 id 부여
  useEffect(() => {
    if (!postBody) {
      setItems([]);
      return;
    }

    // DOM 렌더링 후 실행을 보장하기 위한 requestAnimationFrame
    const frameId = requestAnimationFrame(() => {
      const container = document.getElementById('post-content');
      if (!container) return;

      const headings = container.querySelectorAll('h1, h2, h3, h4');
      if (headings.length === 0) {
        setItems([]);
        return;
      }

      const slugCount = new Map<string, number>();
      const collected: Omit<TocItem, 'depth'>[] = [];

      headings.forEach((heading) => {
        const text = heading.textContent?.trim() ?? '';
        if (!text) return;

        let slug = slugify(text);
        if (!slug) slug = 'heading';

        // 중복 slug 처리
        const count = slugCount.get(slug) ?? 0;
        slugCount.set(slug, count + 1);
        const uniqueSlug = count > 0 ? `${slug}-${count}` : slug;

        heading.id = uniqueSlug;

        const level = parseInt(heading.tagName.charAt(1), 10);
        collected.push({ id: uniqueSlug, text, level });
      });

      // 들여쓰기는 절대 태그 레벨이 아니라 글 안에서의 상대 깊이를 기준으로 한다
      const depths = normalizeHeadingDepths(
        collected.map((item) => item.level),
        MAX_DEPTH,
      );
      setItems(collected.map((item, index) => ({ ...item, depth: depths[index] })));
    });

    return () => cancelAnimationFrame(frameId);
  }, [postBody]);

  // IntersectionObserver로 현재 가시 heading 추적
  useEffect(() => {
    if (items.length === 0) return;

    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headingElements.length === 0) return;

    // 가장 상단에 보이는 heading을 active로 설정
    const observer = new IntersectionObserver(
      (entries) => {
        // 화면에 진입하는 heading 중 가장 위에 있는 것
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // boundingClientRect.top이 가장 작은 (가장 위) 항목
          const topEntry = visibleEntries.reduce((prev, curr) =>
            prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr,
          );
          setActiveId(topEntry.target.id);
        }
      },
      {
        // 상단 -80px은 헤딩의 scroll-margin-top(--reading-scroll-offset = --header-h + 2rem, 최소 88px)보다
        // 작아야 한다. 그래야 목차를 눌러 이동한 헤딩이 관측 영역 안에 들어와 활성 항목으로 잡힌다.
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      },
    );

    headingElements.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  // 본문 스크롤로 활성 항목이 바뀌면 내부 스크롤포트 밖에 있을 때만 리스트를 따라가게 한다.
  // scrollIntoView 는 조상(윈도우)까지 스크롤할 수 있어 컨테이너 scrollTop 만 직접 보정한다
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !activeId) return;
    const active = container.querySelector<HTMLElement>('[aria-current="location"]');
    if (!active) return;
    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    if (activeRect.top < containerRect.top) {
      container.scrollTop += activeRect.top - containerRect.top;
    } else if (activeRect.bottom > containerRect.bottom) {
      container.scrollTop += activeRect.bottom - containerRect.bottom;
    }
  }, [activeId]);

  // 헤딩으로 스크롤. 고정 헤더에 가리지 않도록 하는 여백은 CSS scroll-margin-top이 담당한다
  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  if (items.length === 0) return null;

  // 레벨이 한 종류뿐이면 모든 항목이 depth 0이라 전부 굵게 나온다. 그럴 땐 강약을 끈다
  const hasHierarchy = items.some((item) => item.depth > 0);

  const tocList = (
    <nav aria-label="목차">
      <ul className="mt-3 space-y-1">
        {items.map((item) => {
          const depthStyle = DEPTH_STYLES[item.depth];
          const base = hasHierarchy ? depthStyle : FLAT_STYLE;
          const isActive = activeId === item.id;
          return (
            // 들여쓰기를 li에 두어야 제목이 줄바꿈될 때 둘째 줄도 같은 위치에서 시작한다
            <li key={item.id} className={depthStyle.indent}>
              <button
                type="button"
                onClick={() => handleClick(item.id)}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  'w-full break-words text-left transition-colors duration-150 hover:text-dl-primary-ink',
                  base.size,
                  // text-*는 line-height도 함께 지정하므로 leading은 반드시 그 뒤에 와야 살아남는다
                  'leading-relaxed',
                  isActive ? ACTIVE_WEIGHT : base.weight,
                  isActive ? ACTIVE_COLOR : base.color,
                )}
              >
                {item.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  // sidebar: 항상 펼침 — 표시/숨김은 부모(aside)가, 높이 상한은 부모 카드(flex min-h-0)가 결정하고
  // 넘칠 때의 스크롤은 이 래퍼가 담당한다
  if (variant === 'sidebar') {
    return (
      <div ref={scrollRef} className="toc-scroll min-h-0 overflow-y-auto">
        {tocList}
      </div>
    );
  }

  // collapse: 접기/펼치기 버튼. pb-5 는 렌더될 때만 아래 블록과의 간격을 만든다.
  // 버튼의 -mx-2 는 자체 px-2 를 상쇄해 텍스트 시작점을 거터 라인에 맞춘다.
  return (
    <div className="pb-5">
      <button
        type="button"
        aria-expanded={tocOpen}
        onClick={() => setTocOpen((open) => !open)}
        className="public-text-body -mx-2 flex w-[calc(100%+1rem)] items-center justify-between rounded-lg px-2 py-1.5 text-[color:var(--public-text-muted)] transition hover:bg-[color:var(--public-chip-bg)] hover:text-dl-fg"
      >
        <span className="flex items-center gap-2">
          <List className="size-(--public-icon)" />
          목차 보기
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', tocOpen && 'rotate-180')} />
      </button>
      {tocOpen && tocList}
    </div>
  );
}
