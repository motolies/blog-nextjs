/**
 * 토스트 스토어 — **Provider 가 아니라 모듈 스토어인 이유**.
 *
 * 토스트를 띄워야 하는 자리 중에는 훅을 쓸 수 없는 곳이 있다:
 * `bffFetch` 실패 핸들러, TanStack Query 의 `MutationCache.onError`, 유틸 함수.
 * Provider + `useToast()` 로 만들면 그런 자리에서는 결국 다른 경로를 찾게 되고,
 * 그때부터 알림이 두 갈래로 갈린다.
 *
 * v3 §ds-02: 토스트는 **완료 안내 전용**이다. 되돌릴 수 있는 결과에만 쓰고,
 * 진행을 막아야 하면 확인 모달을 띄운다.
 */

export type ToastTone =
  /** 실행이 의도대로 끝났다. 다음에 할 일이 있으면 뒤에 붙인다. */
  | 'success'
  /** 끝나긴 했는데 일부가 빠졌다. **누락 건수를 반드시 숫자로** 적는다. */
  | 'warning'
  /** 아무것도 처리되지 않았다. 다시 하면 되는 실패만 — 막아야 하면 확인 모달. */
  | 'error'
  /** 성공·실패가 아니라 상태가 바뀌었거나 뒤에서 진행 중이다. */
  | 'info';

/** 토스트 안의 단일 액션 — "실행 취소"류. 누르면 실행 후 토스트가 닫힌다. */
export type ToastAction = {
  readonly label: string;
  readonly onClick: () => void;
};

export type Toast = {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
  /** 제목(선택) — QA 권고: 1줄. 본문은 문장이 아닌 명사형을 권장한다. */
  readonly title?: string;
  /** 액션(선택) — 있으면 토스트가 버튼형이 아니라 액션·닫기 버튼을 가진 박스가 된다. */
  readonly action?: ToastAction;
  /** 자동 닫힘까지(ms). 기본 3초. 유한하지 않으면(∞) 수동 닫기 전용이 된다. */
  readonly durationMs?: number;
};

/** v3: 3초 뒤 자동으로 사라진다. 액션이 있으면 durationMs 로 늘려 누를 시간을 준다. */
const AUTO_DISMISS_MS = 3000;

let toasts: readonly Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/**
 * 토스트를 띄운다. **이벤트 핸들러·effect 에서만 호출한다** —
 * 렌더 중 호출하면 서버에서 모듈 상태가 요청 간에 공유된다.
 *
 * @param message 이미 번역된 문자열. `ui` 는 사전을 모른다.
 */
export function showToast(
  message: string,
  tone: ToastTone = 'success',
  options?: {
    readonly title?: string;
    readonly action?: ToastAction;
    readonly durationMs?: number;
  },
): void {
  const id = nextId;
  nextId += 1;

  toasts = [
    ...toasts,
    {
      id,
      message,
      tone,
      title: options?.title,
      action: options?.action,
      durationMs: options?.durationMs,
    },
  ];
  emit();

  const duration = options?.durationMs ?? AUTO_DISMISS_MS;
  // 유한하지 않으면(∞) 예약하지 않는다 — setTimeout 은 Infinity 를 0 으로 강제한다(즉시 닫힘 사고).
  if (Number.isFinite(duration)) setTimeout(() => dismissToast(id), duration);
}

export function dismissToast(id: number): void {
  const next = toasts.filter((toast) => toast.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToastSnapshot(): readonly Toast[] {
  return toasts;
}

/**
 * SSR 스냅샷. **매번 같은 참조여야 한다** — 새 배열을 만들면
 * `useSyncExternalStore` 가 무한 루프로 판단한다.
 */
const EMPTY: readonly Toast[] = [];
export function getToastServerSnapshot(): readonly Toast[] {
  return EMPTY;
}
