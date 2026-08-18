'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, Ref } from 'react';
import { Icon, type IconSize } from '../icons';
import { cn } from '../lib/cn';
import type { ControlSize } from '../lib/controlSize';
import { warnOnce } from '../lib/warnOnce';

/**
 * 버튼 — QA `_button.css`.
 *
 * variant 는 QA 의 5종(primary 채움 + outline 4색)을 그대로 쓴다.
 * **삭제(`outline-red`)를 뺀 전 variant 가 hover 에서 primary-hover 채움 + 흰 글자**로
 * 수렴하고, active 는 primary-active 로 한 단계 더 눌린다 — QA `.btn:hover/:active` 실측.
 * 아이콘은 currentColor 라 글자와 함께 흰색으로 따라온다.
 * **예외는 삭제 하나뿐이다** — 공통 규칙대로 brand 로 채우면 손을 올리는 순간 위험
 * 신호가 사라지므로 자기 색(danger)으로 채운다. 근거는 그 variant 주석에 있다.
 *
 * 기본값은 `outline-gray` 다 — 보조 액션 기본형. Primary 는 **한 화면에 하나**이므로
 * 기본값이 될 수 없다.
 *
 * size 는 테마 스케일 5단이다(공식·값 표는 theme/default.css 치수 섹션).
 * default 테마에서 sm 36 · md 42 · xl 52 가 QA 3단 실측과 일치하고,
 * xs 32 · lg 46 은 같은 공식의 유도값이다. 높이·패딩·폰트·아이콘이 함께 변한다.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap',
    'gap-1.5 rounded-dl-container border font-semibold transition-colors',
    // hover·active 는 variant 공통 — 삭제(outline-red)를 뺀 전부가 primary 채움으로 수렴한다(QA).
    'hover:border-dl-primary-hover hover:bg-dl-primary-hover hover:text-dl-primary-fg',
    'active:border-dl-primary-active active:bg-dl-primary-active active:text-dl-primary-fg',
    // 비활성은 **톤보다 우선한다** — 글자 #919191 · 보더 #ccc · 배경 #e6e6e6 (QA .btn:disabled).
    'disabled:border-dl-outline-border disabled:bg-dl-locked-bg disabled:text-dl-locked-fg',
    'disabled:cursor-not-allowed',
    // pointer-events 를 죽이지 않는다 — title 툴팁이 안 뜨면
    // "왜 못 누르는지"를 알릴 방법이 사라진다.
    'disabled:pointer-events-auto',
  ].join(' '),
  {
    variants: {
      variant: {
        /** 주 실행 — 검색 · 저장 · 확정. 한 화면에 하나. */
        primary: 'border-dl-primary bg-dl-primary text-dl-primary-fg',
        /** 지금 해야 할 중요 보조 — 업로드 · 조정. (v3 의 secondary 자리를 승계) */
        'outline-primary': 'border-dl-primary bg-dl-surface text-dl-primary-ink',
        /** 강조 보조 — 취소 · 다운로드. (QA `btn-outline-black`. 'black' 이라는 이름은
            기본 팔레트 금지 규칙(`outline-black`)과 문자열이 겹쳐 strong 으로 바꿨다) */
        'outline-strong': 'border-dl-outline-strong-border bg-dl-surface text-dl-outline-strong-fg',
        /** 보조 액션 기본형 — 조회 · 출력 · 선택 기반. */
        'outline-gray': 'border-dl-outline-border bg-dl-surface text-dl-outline-fg',
        /**
         * 삭제 — 흰 배경 + 빨강 아웃라인. **채움이 아니다.**
         * 오클릭 비용이 커서 주 실행과 같은 무게로 보이면 안 된다.
         *
         * hover 만 **QA 에서 의도적으로 이탈한다** — 전 variant 공통 규칙대로 primary 로
         * 채우면 손을 올리는 순간 위험 신호가 사라진다. 자기 색으로 채우되 원색이 아니라
         * danger-hover(한 단 짙은 빨강)를 쓰는 이유는 흰 글자 대비다(theme/default.css 참조).
         */
        'outline-red': [
          'border-dl-danger-border bg-dl-surface text-dl-danger',
          'hover:border-dl-danger-hover hover:bg-dl-danger-hover hover:text-dl-danger-fg',
          'active:border-dl-danger-hover active:bg-dl-danger-hover active:text-dl-danger-fg',
        ].join(' '),
        /**
         * 투명 — 보더·배경 없이 글자만. 원본 @deleo/ui 에는 없던 blog 추가 variant.
         * 툴바 안 보조 액션·인라인 텍스트 버튼처럼 시각 무게가 없어야 하는 자리 전용.
         * hover 는 공통 규칙(primary 채움 수렴)을 따르지 않고 은은한 면만 깔린다.
         */
        ghost:
          'border-transparent bg-transparent text-dl-fg-muted hover:border-transparent hover:bg-dl-option-hover hover:text-dl-fg active:border-transparent active:bg-dl-option-hover active:text-dl-fg',
      },
      size: {
        xs: 'h-dl-control-xs gap-1 px-dl-btn-pad-xs text-dl-ctl-xs',
        sm: 'h-dl-control-sm px-dl-btn-pad-sm text-dl-ctl-sm',
        md: 'h-dl-control px-dl-btn-pad-md text-dl-ctl-md',
        lg: 'h-dl-control-lg gap-2 px-dl-btn-pad-lg text-dl-ctl-lg',
        xl: 'h-dl-control-xl gap-2 px-dl-btn-pad-xl text-dl-ctl-xl',
      },
    },
    defaultVariants: { variant: 'outline-gray', size: 'md' },
  },
);

/** 라벨 옆 아이콘 — 버튼 size 를 따라간다. Icon 기본 클래스(size-dl-ic-sm)를 twMerge 가 덮는다. */
const BUTTON_ICON_CLASS: Record<ControlSize, string> = {
  xs: 'size-dl-ctl-ic-xs',
  sm: 'size-dl-ctl-ic-sm',
  md: 'size-dl-ctl-ic-md',
  lg: 'size-dl-ctl-ic-lg',
  xl: 'size-dl-ctl-ic-xl',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    ref?: Ref<HTMLButtonElement>;
    /** 라벨 왼쪽 아이콘. 크기는 버튼 size 를 따라간다(md 16 = QA is-16). */
    icon?: LucideIcon;
    /**
     * 제출 중처럼 **일시적**으로 못 누르는 상태.
     *
     * `disabled` 와 나눠 두는 이유: `title` 로 조건을 적으라는 대상은
     * "선택된 항목이 없다"처럼 **이유가 화면 밖에 있는** 경우다. 방금 눌러서 처리 중인
     * 버튼은 이유가 자명하고 곧 풀리므로 적을 것이 없다. 같은 prop 으로 두면
     * 경고가 과하게 울리고, 울리는 경고는 곧 무시된다.
     */
    busy?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  type = 'button',
  icon,
  busy,
  children,
  ...props
}: ButtonProps) {
  /**
   * 비활성 버튼은 **왜 못 누르는지**를 `title` 로 적는다.
   * "선택된 항목이 없습니다" 모달을 띄우지 않고 애초에 눌리지 않게 두는 것이 규칙인데,
   * 이유가 없으면 사용자는 고장으로 읽는다.
   *
   * 타입(`{disabled: true; title: string}`)으로 강제하지 않는 이유:
   * 가장 흔한 형태가 `disabled={rows.length === 0}` 라 boolean 이 들어오고,
   * 그러면 항상 title 을 요구하게 되어 결국 우회로 돌아온다. 보이는 경고가 낫다.
   */
  if (props.disabled && !busy && !props.title) {
    warnOnce(
      `button-disabled-no-title:${typeof children === 'string' ? children : 'unknown'}`,
      `비활성 버튼에 title 이 없습니다. 왜 못 누르는지 적어 주세요 — 예: "목록에서 주문을 고르면 눌러진다". (제출 중이라면 disabled 대신 busy 를 쓰세요)`,
    );
  }

  return (
    // 기본 type 을 button 으로 둔다 — 폼 안에서 의도치 않은 submit 이 나는 실수가 흔하다.
    <button
      type={type}
      aria-busy={busy || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
      disabled={props.disabled || busy}
    >
      {icon ? <Icon icon={icon} className={BUTTON_ICON_CLASS[size ?? 'md']} /> : null}
      {children}
    </button>
  );
}

/** 버튼 박스 — 정사각형이라 컨트롤 높이 토큰을 양변에 쓴다. 기본 sm(36×36 = QA). */
const ICON_BUTTON_BOX: Record<ControlSize, string> = {
  xs: 'size-dl-control-xs',
  sm: 'size-dl-control-sm',
  md: 'size-dl-control',
  lg: 'size-dl-control-lg',
  xl: 'size-dl-control-xl',
};

const iconButtonVariants = cva(
  [
    'inline-flex items-center justify-center shrink-0',
    'rounded-dl-container transition-colors',
    // hover 는 텍스트 버튼과 같은 규칙 — primary 채움 + 흰 아이콘(QA form-group-append).
    // 삭제(tone=danger)만 자기 색으로 덮는다 — 근거는 그 tone 주석.
    'hover:bg-dl-primary-hover hover:text-dl-primary-fg',
    // **아이콘 단독 버튼만 비활성 규칙이 다르다**:
    // 텍스트 버튼은 회색 칩이 되지만 여기는 배경을 두지 않고 아이콘만 흐리게 한다.
    'disabled:bg-transparent disabled:text-dl-locked-icon disabled:cursor-not-allowed',
    'disabled:pointer-events-auto',
  ].join(' '),
  {
    variants: {
      tone: {
        /** 표시 컨트롤 — 행 높이 · 정렬 · 목록 · 컬럼. 액션과 분리 배치한다. */
        neutral: 'text-dl-icon',
        /** 등록 등 액션. */
        primary: 'text-dl-primary-ink',
        /** 삭제. hover 는 outline-red 와 같은 근거로 자기 색이다. */
        danger: 'text-dl-danger hover:bg-dl-danger-hover hover:text-dl-danger-fg',
        /** 엑셀 다운로드 — 아이콘이 아니라 제품 로고라 색이 고정이다. */
        excel: 'text-dl-excel',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  VariantProps<typeof iconButtonVariants> & {
    ref?: Ref<HTMLButtonElement>;
    readonly icon: LucideIcon;
    /** 아이콘 단독이라 이름이 없으면 스크린리더에 빈 버튼이 된다. 선택이 아니다. */
    readonly label: string;
    /**
     * **버튼 박스**의 5단 사이즈 — 기본 sm(36×36 = QA). `Button.size` 와 같은 축이다.
     * 글리프 크기는 `iconSize` 가 따로 정한다 — 박스가 커져도 글리프는 명세(is-16/is-20)를 지킨다.
     */
    readonly size?: ControlSize;
    /** 글리프 — 본문 액션 16 · 강조 액션 20 (QA is-16/is-20). */
    readonly iconSize?: Extract<IconSize, 'sm' | 'md'>;
  };

/**
 * 아이콘 단독 버튼 — `Button` 과 **다른 컴포넌트**인 이유는 비활성 규칙이 갈리기 때문이다.
 * 조건 분기로 두면 언젠가 누가 텍스트 버튼 스타일을 아이콘 버튼에 적용한다.
 */
export function IconButton({
  className,
  tone,
  type = 'button',
  icon,
  label,
  size = 'sm',
  iconSize = 'md',
  ...props
}: IconButtonProps) {
  if (props.disabled && !props.title) {
    warnOnce(
      `icon-button-disabled-no-title:${label}`,
      `비활성 아이콘 버튼("${label}")에 title 이 없습니다. 왜 못 누르는지 적어 주세요.`,
    );
  }

  return (
    <button
      type={type}
      aria-label={label}
      className={cn(iconButtonVariants({ tone }), ICON_BUTTON_BOX[size], className)}
      {...props}
    >
      <Icon icon={icon} size={iconSize} />
    </button>
  );
}

export { buttonVariants, iconButtonVariants };
