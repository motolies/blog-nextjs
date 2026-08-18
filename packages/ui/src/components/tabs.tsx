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
  disabled,
  size: sizeProp,
  className,
  children,
}: {
  readonly value: string;
  readonly icon?: LucideIcon;
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
        'data-[state=active]:text-dl-fg',
        // 활성 하단 3px primary 라인 — 베이스라인(1px) 을 덮도록 -bottom-px
        'after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-transparent',
        'data-[state=active]:after:bg-dl-primary',
        'disabled:cursor-not-allowed disabled:text-dl-label-disabled',
        className,
      )}
    >
      {icon ? (
        <span className="text-dl-fg-muted group-data-[state=active]:text-dl-primary">
          <Icon icon={icon} className={TAB_ICON_CLASS[size]} />
        </span>
      ) : null}
      {children}
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
