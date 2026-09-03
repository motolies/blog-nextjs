'use client';

import { Badge } from '@hvy/ui';
import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import LinkGroupGrid from '@/components/common/LinkGroupGrid';
import LinkRow from '@/components/common/LinkRow';
import { resolveLinkIcon } from '@/lib/linkIcons';
import {
  DEFAULT_COLLAPSE_STATE,
  parseCollapseState,
  serializeCollapseState,
  toggleGroupCollapse,
} from '@/lib/linkTree';
import type { LinkGroup, PlatformCollapseState } from '@/types/linkTree';

const STORAGE_KEY = 'home.platform.collapse';

/** 접힘 상태를 저장한다. 실패는 무시 — 세션 내 상태로만 동작한다(AdminLayout 과 같은 규약). */
function persist(state: PlatformCollapseState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeCollapseState(state));
  } catch {
    // 프라이빗 모드·사이트데이터 차단 환경
  }
}

/**
 * 홈의 관리자 전용 플랫폼 링크 섹션.
 *
 * 데이터는 서버 컴포넌트가 이미 다 가져와 prop 으로 넘긴다 — 이 컴포넌트가 클라이언트인 이유는
 * 오직 접힘 상태(localStorage) 때문이다. 페칭을 여기로 내리면 관리자에게 워터폴이 생긴다.
 *
 * 접기에 높이 애니메이션을 넣지 않는다. 첫 렌더는 반드시 서버와 같은 "전부 펼침"이고 복원은
 * 마운트 후이므로, 애니메이션이 있으면 매 방문마다 "펼쳐졌다가 스르륵 접히는" 게 보인다.
 * 조건부 렌더면 한 프레임에 끝나 사실상 인지되지 않는다.
 */
export default function PlatformFavoriteSection({ groups }: { groups: readonly LinkGroup[] }) {
  const sectionPanelId = useId();

  // 첫 렌더는 서버 HTML 과 동일한 기본값이어야 한다. useState 의 lazy initializer 로
  // localStorage 를 읽으면 서버 출력과 어긋나 React 가 이 서브트리를 통째로 다시 만든다.
  const [collapse, setCollapse] = useState<PlatformCollapseState>(DEFAULT_COLLAPSE_STATE);

  useEffect(() => {
    try {
      setCollapse(parseCollapseState(window.localStorage.getItem(STORAGE_KEY)));
    } catch {
      // 접근 불가 환경은 기본값(전부 펼침) 유지
    }
  }, []);

  const toggleSection = useCallback(() => {
    setCollapse((prev) => {
      const next = { ...prev, section: !prev.section };
      persist(next);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((groupCode: string) => {
    setCollapse((prev) => {
      const next = toggleGroupCollapse(prev, groupCode);
      persist(next);
      return next;
    });
  }, []);

  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="public-container pb-10 pt-6 lg:pb-14">
      <div className="mb-4 flex items-end justify-between gap-4 lg:mb-6">
        <div className="flex items-center gap-3">
          <p className="public-label-text public-text-meta font-semibold uppercase tracking-[0.18em]">
            Platform
          </p>
          <Badge tone="warning" size="xs">
            관리자 전용
          </Badge>
        </div>
        <button
          type="button"
          onClick={toggleSection}
          aria-expanded={!collapse.section}
          aria-controls={sectionPanelId}
          className="public-card-surface public-text-body flex items-center gap-1.5 rounded-full border px-(--public-chip-pad-x) py-(--public-chip-pad-y) font-medium transition"
        >
          {collapse.section ? '펼치기' : '접기'}
          <ChevronDown
            className={`size-(--public-icon) transition-transform ${collapse.section ? '-rotate-90' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {!collapse.section && (
        <LinkGroupGrid id={sectionPanelId}>
          {groups.map((group) => (
            <PlatformGroupCard
              key={group.code}
              group={group}
              collapsed={collapse.groups.includes(group.code)}
              onToggle={toggleGroup}
            />
          ))}
        </LinkGroupGrid>
      )}
    </section>
  );
}

function PlatformGroupCard({
  group,
  collapsed,
  onToggle,
}: {
  group: LinkGroup;
  collapsed: boolean;
  onToggle: (groupCode: string) => void;
}) {
  const panelId = useId();
  const GroupIcon = resolveLinkIcon(group.icon);

  return (
    <section className="surface-panel-strong overflow-hidden rounded-(--radius-panel) p-(--public-pad-panel)">
      <button
        type="button"
        onClick={() => onToggle(group.code)}
        aria-expanded={!collapsed}
        aria-controls={panelId}
        className="flex w-full items-center gap-2 text-left lg:gap-3"
      >
        {/* 제목 크기에 비례시킨다 — @hvy/ui Icon 의 20px 은 고정이라 모바일에서 제목(18px)보다
            커지고, --public-icon(14→16)을 쓰면 데스크톱이 20→16 으로 줄어드는 회귀가 난다. */}
        {GroupIcon && (
          <GroupIcon
            className="size-[calc(var(--public-text-title)*0.833)] shrink-0"
            aria-hidden="true"
          />
        )}
        {/* truncate 의 overflow:hidden 이 flex 아이템의 자동 최소 크기를 0 으로 만든다 —
            그래서 min-w-0 을 따로 붙이지 않아도 긴 이름이 ChevronDown 을 밀어내지 않는다. */}
        <h3
          className="flex-1 truncate public-text-title font-semibold tracking-[-0.03em] text-dl-fg"
          title={group.name}
        >
          {group.name}
        </h3>
        <ChevronDown
          className={`size-(--public-icon) shrink-0 transition-transform ${collapsed ? '-rotate-90' : ''}`}
          aria-hidden="true"
        />
      </button>

      {!collapsed && (
        <ul id={panelId} className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-2 lg:mt-6 lg:gap-3">
          {group.links.map((link) => (
            <LinkRow key={link.name} link={link} />
          ))}
        </ul>
      )}
    </section>
  );
}
