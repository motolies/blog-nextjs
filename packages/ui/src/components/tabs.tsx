'use client';

import type { LucideIcon } from 'lucide-react';
import { Tabs as RadixTabs } from 'radix-ui';
import { createContext, type ReactNode, useContext } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import type { ControlSize } from '../lib/controlSize';

/**
 * 탭 — QA `filter-tab-menu`: md 아이템 h48 · weight 500 · 활성이면 검정 글자 +
 * primary 아이콘 + 하단 3px primary 라인(1px 회색 베이스라인 위).
 * (높이 5단은 테마 스케일 유도 — 공식은 theme/default.css 치수 섹션.)
 *
 * **URL 을 모른다** — controlled(value/onValueChange)로만 동작한다.
 * "검색·페이징·열린 모달까지 URL 이 단일 진실 소스"인 앱에서는
 * `useSearchParams` 와 조합해 앱이 배선한다(`ui` 는 next/* 를 import 할 수 없다).
 *
 * 키보드(화살표 이동·roving tabindex)와 aria 배선은 Radix Tabs 가 맡는다.
 */

const TAB_H_CLASS: Record<ControlSize, string> = {
  xs: 'h-dl-tab-xs px-5',
  sm: 'h-dl-tab-sm px-6',
  md: 'h-dl-tab-md px-8',
  lg: 'h-dl-tab-lg px-8',
  xl: 'h-dl-tab-xl px-8',
};

/** 탭 아이콘 — md 이하는 QA is-16 유지, lg/xl 만 컨트롤 아이콘 축을 따라 커진다. */
const TAB_ICON_CLASS: Record<ControlSize, string | undefined> = {
  xs: undefined,
  sm: undefined,
  md: undefined,
  lg: 'size-dl-ctl-ic-lg',
  xl: 'size-dl-ctl-ic-xl',
};

/** TabList 의 size 를 개별 Tab 으로 내린다 — Tab 의 명시 prop 이 이긴다. */
const TabSizeContext = createContext<ControlSize>('md');

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <RadixTabs.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className={className}
    >
      {children}
    </RadixTabs.Root>
  );
}

export function TabList({
  label,
  size = 'md',
  className,
  children,
}: {
  /** 탭 묶음의 이름 — 스크린리더가 "무슨 탭들인지" 먼저 읽는다. */
  readonly label?: string;
  /** 5단 사이즈 — 묶음의 모든 Tab 에 내려간다(개별 Tab 의 명시 prop 이 이긴다). */
  readonly size?: ControlSize;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    // QA tab-menu__list:before — 전체 폭 1px 베이스라인. 활성 라인이 이 위에 얹힌다.
    <RadixTabs.List aria-label={label} className={cn('flex border-b border-dl-border', className)}>
      <TabSizeContext.Provider value={size}>{children}</TabSizeContext.Provider>
    </RadixTabs.List>
  );
}

export function Tab({
  value,
  icon,
  badge,
  disabled,
  size: sizeProp,
  className,
  children,
}: {
  readonly value: string;
  readonly icon?: LucideIcon;
  /**
   * 라벨 뒤 건수 표시 — 「목록 (32)」 관례. 숫자·짧은 문자열 전용이고 포맷(천단위 등)은
   * 앱이 한다. 닫기 버튼은 여기 없다 — 닫히는 탭은 WorkTabsBar 소관(시각 언어가 다르다).
   */
  readonly badge?: ReactNode;
  readonly disabled?: boolean;
  /** 5단 사이즈. 생략하면 묶음(TabList)의 size 를 따른다. */
  readonly size?: ControlSize;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  const listSize = useContext(TabSizeContext);
  const size = sizeProp ?? listSize;
  return (
    <RadixTabs.Trigger
      value={value}
      disabled={disabled}
      className={cn(
        'group relative flex shrink-0 items-center gap-2.5 text-dl-sm font-medium text-dl-fg-muted',
        TAB_H_CLASS[size],
        // 활성이어도 weight 를 올리지 않는다 — 밑줄형은 한 줄에 붙어 있어 굵기가 변하면 옆 탭이 밀린다.
        'hover:text-dl-fg data-[state=active]:text-dl-fg',
        // 활성 하단 3px primary 라인 — 베이스라인(1px) 을 덮도록 -bottom-px
        'after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-transparent',
        'hover:after:bg-dl-border data-[state=active]:after:bg-dl-primary',
        // 포커스 — 전역 사각 outline 은 h48 트리거를 통째로 감싸 밑줄형 언어를 깬다.
        // Radix 는 클릭 때도 Trigger 에 focus() 를 걸어 마우스 조작에서도 뜬다.
        // 밑줄이 포커스 표시를 겸하되, **활성 탭에 포커스가 와도 구별되도록** 배경 틴트를 함께 준다.
        'focus-visible:bg-dl-option-hover focus-visible:outline-none focus-visible:after:bg-dl-primary',
        // hover 규칙이 disabled 탭에도 걸리므로 여기서 되돌린다.
        'disabled:cursor-not-allowed disabled:text-dl-label-disabled disabled:hover:text-dl-label-disabled disabled:hover:after:bg-transparent',
        className,
      )}
    >
      {icon ? (
        <span className="text-dl-fg-muted group-data-[state=active]:text-dl-primary-ink">
          <Icon icon={icon} className={TAB_ICON_CLASS[size]} />
        </span>
      ) : null}
      {children}
      {badge != null ? (
        // 톤얼 칩 — 활성이어도 weight 를 올리지 않는 규칙과 같은 이유로 배지도 폭이 변하지 않는다.
        <span className="rounded-dl-badge bg-dl-tonal px-1.5 text-dl-tonal-fg text-dl-xs group-disabled:bg-dl-locked-bg group-disabled:text-dl-locked-ink">
          {badge}
        </span>
      ) : null}
    </RadixTabs.Trigger>
  );
}

export function TabPanel({
  value,
  className,
  children,
}: {
  readonly value: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <RadixTabs.Content value={value} className={className}>
      {children}
    </RadixTabs.Content>
  );
}
