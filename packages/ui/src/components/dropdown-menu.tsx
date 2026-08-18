'use client';

import type { LucideIcon } from 'lucide-react';
import { DropdownMenu as RadixDropdownMenu } from 'radix-ui';
import { createContext, type ReactNode, useContext } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { useControllableState } from '../lib/useControllableState';
import { warnOnce } from '../lib/warnOnce';
import { type MenuScanResult, type SoleItem, scanMenu } from './dropdownCollapse';

/**
 * 드롭다운 메뉴 — 그리드 행 액션·툴바 오버플로 메뉴용 범용 컨트롤.
 *
 * radix DropdownMenu 를 토큰으로 입힌 것이다 — roving focus·화살표 이동·typeahead·
 * Esc/외부 클릭 닫기는 radix 몫이고, 이 계층이 "틀리면 조용히 위험한" 부분이라
 * Primitive 로 중앙 관리한다(워크탭 컨텍스트 메뉴가 내부에서 이미 같은 것을 쓴다).
 *
 * 패널·아이템 배색은 select.tsx 패널 규격을 따른다(WorkTabsBar 의 메뉴와 동일 문법).
 * 문구·아이콘은 앱이 넣는다 — `ui` 는 사전을 모른다.
 *
 * **내비게이션이 아니다** — 메뉴 이동 링크는 사이드바 하나뿐(루트 CLAUDE.md)이므로
 * 아이템은 행동(onSelect)만 갖는다. 링크가 필요한 자리면 이 컨트롤이 아니다.
 *
 * ## 아이템이 하나면 메뉴가 아니라 버튼이다
 *
 * 고를 것이 없는 패널을 여는 것은 클릭 한 번을 그냥 버리는 일이다. 그래서 아이템이
 * 정확히 하나면 패널을 열지 않고 **트리거 클릭이 곧 그 아이템의 실행**이 된다.
 * 판정은 `dropdownCollapse.ts` 가 자식 트리를 **읽기만** 해서 하고, 결과는 컨텍스트로
 * 내린다 — cloneElement 로 자식을 개조하지 않는 규칙(field.tsx 머리말) 그대로다.
 *
 * 아이템 수는 런타임에 오간다(권한 필터·검색 조건 소진). 그래서 아래 셋을 지킨다.
 *  1. **판정을 memo 하지 않는다** — 굳히면 바뀐 개수·onSelect 를 놓친다.
 *  2. **트리거를 갈아끼우지 않는다** — 엘리먼트 타입이 바뀌면 자식 버튼이 리마운트되어
 *     포커스가 튄다. 늘 radix Trigger 를 렌더하고 넘기는 prop 만 바꾼다.
 *  3. **Content 를 지우지 않는다** — 메뉴가 **열려 있는 동안** 아이템이 하나로 줄면
 *     패널이 언마운트되어 포커스가 갈 곳을 잃는다. 닫혀 있으면 어차피 DOM 이 없다.
 *
 * 대가로 단일 모드에서도 `aria-haspopup="menu"` 가 남는다(radix Trigger 가 늘 붙인다).
 * 스크린리더에는 메뉴 버튼으로 안내되지만 실제로는 즉시 실행된다 — 리마운트·포커스
 * 손실과 맞바꾼 값이다.
 *
 * 접히지 않는 경우가 둘 있다(아이템 0/2개 이상, `DropdownMenuLabel` 존재).
 */

/** 팝업 패널 공통 — select.tsx 패널 규격. */
const MENU_PANEL_CLASS =
  'z-[var(--dl-z-menu)] min-w-40 rounded-dl-container border border-dl-field-border bg-dl-surface p-1 shadow-dl-menu';
const MENU_ITEM_CLASS =
  'flex cursor-pointer select-none items-center gap-2 rounded-dl-badge px-4 py-2 text-dl-fg text-dl-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:text-dl-locked-fg data-[highlighted]:bg-dl-option-hover';

/**
 * 접힘 판정이 보는 부품 — `type` 동일성 비교다.
 * 같은 모듈 안 참조라 번들이 갈려 신원이 어긋날 일이 없다(워크스페이스 단일 인스턴스).
 */
const SCAN = {
  isItem: (type: unknown) => type === DropdownMenuItem,
  isLabel: (type: unknown) => type === DropdownMenuLabel,
  isSkipped: (type: unknown) => type === DropdownMenuTrigger,
} as const;

/** 트리거가 "지금 버튼인가"를 가져가는 통로 — 이 파일 밖으로 나가지 않는다. */
const SoleItemContext = createContext<SoleItem>(null);

export function DropdownMenu({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: {
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly children: ReactNode;
}) {
  const [isOpen, setOpen] = useControllableState(open, defaultOpen ?? false, onOpenChange);

  // 매 렌더 다시 훑는다 — children 은 매 렌더 새 배열이라 memo 를 걸어도 캐시가 맞지 않고,
  // 억지로 맞추면 런타임에 바뀐 개수·onSelect 를 놓친다. 아이템 수만큼의 얕은 순회다.
  const { itemCount, sole }: MenuScanResult = scanMenu(children, SCAN);

  // 트리거가 받는 값 — **열려 있는 동안에는 잠그지 않는다.** 런타임에 아이템이 하나로
  // 줄면서 그것이 비활성이면, 잠긴 버튼이 열린 패널을 물고 있는 상태가 되기 때문이다.
  const triggerSole: SoleItem = sole && isOpen ? { ...sole, disabled: false } : sole;

  if (itemCount === 0) {
    warnOnce(
      'dropdown-menu-empty',
      '아이템이 없는 DropdownMenu 가 있습니다 — 빈 패널이 열립니다. 호출부에서 개수를 확인해 트리거를 감추거나 비활성으로 두세요.',
    );
  }

  /**
   * 아이템이 하나면 패널을 열지 않고 그대로 발화한다.
   *
   * radix 는 포인터 클릭·Enter·Space·ArrowDown 을 전부 Root 의 이 콜백 하나로 모은다.
   * 그래서 여기 한 곳만 가로채면 트리거를 건드리지 않고도 열기 경로 전부가 덮인다.
   *
   * **매 렌더 새 함수여도 된다** — useCallback 으로 굳히면 오래된 sole 을 클로저에 가둬
   * 옛 onSelect 가 실행된다. radix 는 이 콜백을 ref 로 잡으므로 재생성 비용도 없다.
   */
  const handleOpenChange = (next: boolean) => {
    if (next && sole) {
      if (!sole.disabled) sole.onSelect?.();
      return; // 열지 않는다 — 열린 적이 없으므로 onOpenChange 도 부르지 않는다
    }
    setOpen(next);
  };

  return (
    <SoleItemContext.Provider value={triggerSole}>
      <RadixDropdownMenu.Root open={isOpen} onOpenChange={handleOpenChange}>
        {children}
      </RadixDropdownMenu.Root>
    </SoleItemContext.Provider>
  );
}

/**
 * 트리거 — **단일 요소 자식**(Button·IconButton)에 병합된다(asChild 고정).
 * 자체 버튼을 만들지 않는 이유: 트리거의 시각은 언제나 기존 버튼 규격 중 하나다 —
 * 여기서 새 버튼 모양을 만들면 버튼 체계가 둘이 된다. 버튼 모드에서도 이 규칙은 같다.
 *
 * 자식에 값을 주는 통로도 radix 것을 그대로 쓴다 — `disabled` 는 Trigger 의 prop 이고
 * `title` 은 나머지 props 로 흘러 Slot 이 자식과 병합한다. Slot 병합은 **자식이 명시한
 * 값이 이기므로** 호출부가 직접 준 title 은 살아남는다(통제권을 뺏지 않는다).
 *
 * 하나뿐인 아이템이 비활성이면 트리거를 잠근다 — 열어 봐야 누를 게 없다. radix 는
 * disabled 트리거에서 열기 자체를 막으므로 잠금 하나로 둘 다 해결된다.
 * 단, **메뉴가 열려 있는 동안에는 잠그지 않는다** — 잠긴 버튼이 열린 패널을 물고 있는
 * 상태를 만들지 않기 위해서다(런타임에 아이템이 줄어드는 순간이 그렇다).
 */
export function DropdownMenuTrigger({ children }: { readonly children: ReactNode }) {
  const sole = useContext(SoleItemContext);

  return (
    <RadixDropdownMenu.Trigger asChild disabled={sole?.disabled || undefined} title={sole?.title}>
      {children}
    </RadixDropdownMenu.Trigger>
  );
}

export function DropdownMenuContent({
  align = 'start',
  sideOffset = 4,
  className,
  children,
}: {
  readonly align?: 'start' | 'center' | 'end';
  readonly sideOffset?: number;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  // 버튼 모드라고 이 패널을 지우지 않는다 — 열려 있는 동안 아이템이 하나로 줄면
  // 패널이 통째로 사라져 포커스가 갈 곳을 잃는다. 닫혀 있으면 radix 가 DOM 을 만들지 않는다.
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(MENU_PANEL_CLASS, className)}
      >
        {children}
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Portal>
  );
}

export function DropdownMenuItem({
  icon,
  destructive,
  disabled,
  onSelect,
  className,
  children,
}: {
  /** 라벨 왼쪽 아이콘 — 있으면 아이콘 없는 형제와 정렬이 어긋나므로 메뉴 단위로 통일한다. */
  readonly icon?: LucideIcon;
  /**
   * 파괴적 액션(삭제 등) — 빨간 글자로 위험 신호를 유지한다.
   * **이 아이템 하나뿐이면 메뉴가 버튼으로 접혀 한 클릭에 실행된다** — 메뉴를 여는 클릭이
   * 방지턱 역할을 하던 것이 사라지므로, 되돌릴 수 없는 액션이면 `useConfirm()` 을 붙인다.
   */
  readonly destructive?: boolean;
  readonly disabled?: boolean;
  readonly onSelect?: () => void;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <RadixDropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        MENU_ITEM_CLASS,
        destructive &&
          'text-dl-danger-ink data-[highlighted]:bg-dl-danger-bg data-[highlighted]:text-dl-danger-ink',
        className,
      )}
    >
      {icon ? (
        <span className="flex shrink-0">
          <Icon icon={icon} size="sm" />
        </span>
      ) : null}
      {children}
    </RadixDropdownMenu.Item>
  );
}

export function DropdownMenuSeparator() {
  return <RadixDropdownMenu.Separator className="my-1 h-px bg-dl-divider" />;
}

/**
 * 묶음 제목 — 선택 불가한 안내 줄.
 * **이것이 있으면 아이템이 하나여도 메뉴가 접히지 않는다** — 접으면 이 글자가 조용히 사라진다.
 */
export function DropdownMenuLabel({ children }: { readonly children: ReactNode }) {
  return (
    <RadixDropdownMenu.Label className="px-4 py-1.5 text-dl-fg-muted text-dl-xs">
      {children}
    </RadixDropdownMenu.Label>
  );
}

/**
 * 접힘 판정 — 부품 배선까지 한 자리에 묶는다.
 *
 * **배럴(index.ts)로는 내보내지 않는다**: 앱이 쓸 것이 아니라, 테스트가 predicate 를
 * 다시 적지 않고 **실제 배선**을 통과시켜 오배선까지 잡기 위한 문이다.
 */
export function scanDropdownMenu(children: ReactNode): MenuScanResult {
  return scanMenu(children, SCAN);
}
