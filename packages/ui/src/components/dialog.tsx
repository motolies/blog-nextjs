'use client';

import { X } from 'lucide-react';
import { Dialog as RadixDialog } from 'radix-ui';
import { type ReactNode, useEffect } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { warnOnce } from '../lib/warnOnce';
import { Button } from './button';

/**
 * 모달 — Radix 래핑. QA 는 **두 규격**(alert · modal)을 정의하고, 우리는 동작으로
 * 세 유형을 나눈다.
 *
 *              알림형(alert)       콘텐츠형(modal)      선택형(modal)
 *   헤더       없음                흰 바 + 20px 제목    흰 바 + 20px 제목
 *   라운드     8                   8                    8
 *   너비       500 고정            size 축(~1140·full)  1140 · 리사이즈
 *   본문       16px 가운데정렬     회색 캔버스          회색 캔버스 위 흰 카드
 *   Esc        닫힘                닫힘                 **받지 않는다**
 *   버튼       가득(flex-1)        가운데 · 폭 220      가운데 · 폭 220
 *
 * 포커스 트랩·스크롤 잠금·aria 는 **틀리면 조용히 위험한 코드**라 Radix 에 맡긴다.
 *
 * ⚠️ 이 프로젝트에서 모달은 **반드시 URL 을 가진다**(`?trace=ORD-1001`).
 * 열림 상태를 컴포넌트 내부 state 로만 두면 새로고침·뒤로가기·링크공유가 전부 깨진다.
 */

/**
 * 열려 있는 모달 수. v3: **모달 위에 모달을 겹치지 않는다.**
 * 목업이 기록한 실제 사고(z-index 2147483646 위에 2147483647)를 구조적으로 막는다.
 */
let openCount = 0;

/**
 * ⚠️ **렌더 중이 아니라 effect 에서 센다.**
 *
 * 렌더 중에 증가시키면 닫힐 때 줄어들 자리가 없어서, 열린 모달이 리렌더될 때마다
 * 카운트가 올라간다 — 모달 하나만 열어도 두 번째 렌더에서 "겹쳤다"고 경고한다.
 * 오탐하는 경고는 곧 무시되는 경고이고, 그러면 **진짜 겹침을 못 잡는다.**
 * cleanup 이 짝을 맞추므로 StrictMode 이중 마운트에서도 균형이 유지된다.
 */
function useTrackOpen(open: boolean, kind: string): void {
  useEffect(() => {
    if (!open) return;
    openCount += 1;
    if (openCount > 1) {
      warnOnce(
        `dialog-stacked:${kind}`,
        `모달 위에 모달이 열렸습니다(${kind}). 겹치기 금지 규칙입니다 — 앞 모달을 닫고 여세요.`,
      );
    }
    return () => {
      openCount -= 1;
    };
  }, [open, kind]);
}

/** 딤 — 세 유형 모두 같다. 토스트만 딤이 없다. */
function Scrim() {
  return (
    <RadixDialog.Overlay className="fixed inset-0 z-[var(--dl-z-modal)] bg-dl-scrim data-[state=open]:animate-in data-[state=open]:fade-in-0" />
  );
}

/**
 * 알림·확인 모달 — QA alert: 500px 고정 · 본문 16px 가운데 · 버튼이 폭을 나눠 가진다.
 *
 * **제목 줄을 두지 않는다** — 무슨 알림인지는 본문 문장이 이미 말한다.
 * "Notice" 같은 제목은 읽을 것만 늘린다.
 * 기본 포커스는 **취소**이고, 딤 클릭과 Esc 로도 닫힌다.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly message: ReactNode;
  readonly confirmLabel: string;
  /** 없으면 단일 버튼(알림형)이 된다 — 읽고 닫으면 끝인 창이다. */
  readonly cancelLabel?: string;
  /** 파괴적 실행이면 확인 버튼이 Danger 가 된다. */
  readonly destructive?: boolean;
  readonly onConfirm: () => void;
}) {
  useTrackOpen(open, 'confirm');

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <Scrim />
        <RadixDialog.Content className="fixed top-1/2 left-1/2 z-[var(--dl-z-modal)] w-dl-modal-alert -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-dl-container bg-dl-surface shadow-dl-alert">
          {/* 제목 줄이 없으므로 본문이 접근성 이름을 맡는다 */}
          <RadixDialog.Title className="sr-only">{confirmLabel}</RadixDialog.Title>
          {/* QA alert-body: min-height 120 · 16px · 가운데 정렬 · padding 24 */}
          <RadixDialog.Description className="flex min-h-30 items-center justify-center p-6 text-center text-dl-xl text-dl-fg">
            {message}
          </RadixDialog.Description>

          {/* QA alert-footer: padding 24 · gap 12 · 버튼이 폭을 나눠 가진다(flex-1) */}
          <div className="flex gap-3 p-6 pt-0">
            {cancelLabel ? (
              <RadixDialog.Close asChild>
                <Button variant="outline-strong" className="flex-1">
                  {cancelLabel}
                </Button>
              </RadixDialog.Close>
            ) : null}
            <Button
              variant={destructive ? 'outline-red' : 'primary'}
              className="flex-1"
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/**
 * 콘텐츠 모달 — 무언가를 **보는** 창.
 * QA modal: 흰 헤더(20px bold 제목 + 24px 닫기) · 회색 캔버스 본문 · 흰 푸터(가운데 · 폭 220).
 */
export function ContentDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeLabel = '닫기',
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  /** `xl` 이 QA 기본 폭(1140) · `full` 은 화면 가득(QA modal-content-full). */
  readonly size?: 'md' | 'lg' | 'xl' | 'full';
  readonly closeLabel?: string;
}) {
  useTrackOpen(open, 'content');
  const width = {
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-dl-modal-pick',
    full: 'h-[calc(100vh-20px)] max-w-[calc(100vw-20px)]',
  }[size];

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <Scrim />
        <RadixDialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-[var(--dl-z-modal)] flex max-h-[calc(100vh-20px)] w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-dl-container bg-dl-surface shadow-dl-modal',
            width,
          )}
        >
          <DialogHeader title={title} description={description} closeLabel={closeLabel} />

          {/* 회색 캔버스 — 넘치면 **본문만** 스크롤한다(QA modal-body) */}
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto bg-dl-canvas p-2.5">
            {children}
          </div>

          {footer ? <DialogFooter>{footer}</DialogFooter> : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** QA modal-header: 흰 배경 · padding 10/20 · 제목 20px 700 · 닫기 아이콘 24. */
function DialogHeader({
  title,
  description,
  closeLabel,
}: {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly closeLabel: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-dl-divider bg-dl-surface py-2.5 pr-2.5 pl-5">
      <div className="min-w-0 flex-1">
        <RadixDialog.Title className="truncate text-dl-title font-bold text-dl-fg">
          {title}
        </RadixDialog.Title>
        {description ? (
          <RadixDialog.Description className="truncate text-dl-xs text-dl-fg-muted">
            {description}
          </RadixDialog.Description>
        ) : (
          // Radix 는 Description 이 없으면 콘솔 경고를 낸다. 숨김 요소로 조용히 만족시킨다.
          <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
        )}
      </div>
      <RadixDialog.Close
        className="flex size-9 shrink-0 items-center justify-center rounded-dl-badge text-dl-fg-muted hover:bg-dl-icon-hover"
        aria-label={closeLabel}
      >
        <Icon icon={X} size="lg" />
      </RadixDialog.Close>
    </div>
  );
}

/** QA modal-footer: 흰 배경 · 가운데 정렬 · gap 12 · **버튼 폭 220 고정**. */
function DialogFooter({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex shrink-0 justify-center gap-3 border-t border-dl-divider bg-dl-surface px-5 py-2.5 *:w-55">
      {children}
    </div>
  );
}

/**
 * 선택 모달 — 목록에서 **고르는** 창.
 *
 * 두 가지가 콘텐츠 모달과 다르다:
 *   · **Esc 를 받지 않는다** — 실수로 누르면 체크해 둔 건이 한 번에 사라진다.
 *   · 본문이 회색 캔버스다 — 흰 배경은 안쪽의 필터·그리드 카드가 갖는다.
 *
 * 창 크기 조절·드래그 이동은 브라우저 기본(`resize: both`)으로 둔다. 드래그 이동까지
 * 직접 구현하면 포커스 트랩·키보드 이동을 다시 만들게 되어 Radix 를 쓰는 의미가 없어진다.
 */
export function PickerDialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  closeLabel = '닫기',
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: ReactNode;
  readonly children: ReactNode;
  /** 오른쪽 끝 — 닫기(Tertiary) + 실행(Primary). 단일 선택형은 닫기만 둔다. */
  readonly footer?: ReactNode;
  readonly closeLabel?: string;
}) {
  useTrackOpen(open, 'picker');

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <Scrim />
        <RadixDialog.Content
          // Esc 를 막는다. 딤 클릭도 막는다 — 고른 것을 잃는 경로를 헤더 × 와 푸터 닫기로 좁힌다.
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          className="fixed top-1/2 left-1/2 z-[var(--dl-z-modal)] flex h-[80vh] max-h-[calc(100vh-20px)] w-dl-modal-pick max-w-[calc(100vw-20px)] min-w-dl-modal-pick-min -translate-x-1/2 -translate-y-1/2 resize flex-col overflow-hidden rounded-dl-container bg-dl-surface shadow-dl-modal"
        >
          <DialogHeader title={title} closeLabel={closeLabel} />

          {/* 회색 캔버스 — 상세 화면과 같은 기준. 흰 배경은 필터·그리드 카드가 갖는다 */}
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto bg-dl-canvas p-2.5">
            {children}
          </div>

          {footer ? <DialogFooter>{footer}</DialogFooter> : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
