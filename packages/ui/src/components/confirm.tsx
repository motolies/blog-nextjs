'use client';

import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { warnOnce } from '../lib/warnOnce';
import { ConfirmDialog } from './dialog';

export type ConfirmOptions = {
  readonly message: ReactNode;
  readonly confirmLabel: string;
  /**
   * 취소 버튼 문구. **생략해도 취소 버튼은 나온다** — `ConfirmProvider` 가 앱이 준 기본
   * 취소 문구(`labels.cancel`)를 채운다. 확인 모달에서 취소를 없앨 수단은 없고,
   * 읽고 닫으면 끝인 단일 버튼 창은 `useAlert()` 가 만든다.
   *
   * 한때 여기 "없으면 단일 버튼(알림형)이 된다"고 적혀 있었다. `ConfirmDialog` 를 직접
   * 쓸 때는 참이지만 이 경로에서는 성립한 적이 없다 — **타입·주석·데모가 전부 "된다"고
   * 말하는데 화면만 아니었던 것이 이번 버그였다.** 서술을 코드에 맞추는 쪽으로 고친다.
   */
  readonly cancelLabel?: string;
  /** 파괴적 실행이면 확인 버튼이 Danger 가 된다(v3 §ds-02). */
  readonly destructive?: boolean;
};

/**
 * 알림 — 취소가 없다. 그래서 `cancelLabel` 도 `destructive` 도 받지 않는다.
 *
 * 확인과 **타입이 갈리는 것이 핵심**이다: 확인은 `Promise<boolean>`(예/아니오)이고
 * 알림은 `Promise<void>`(읽었음)다. 한 함수에 `cancelLabel: null` 로 섞으면 호출부가
 * null↔undefined 차이를 기억해야 하고, 결과가 늘 boolean 이라 "false 면 취소한 것"이라는
 * 오독이 남는다.
 */
export type AlertOptions = {
  readonly message: ReactNode;
  readonly confirmLabel: string;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
type AlertFn = (options: AlertOptions) => Promise<void>;

/**
 * 확인과 알림은 **한 창을 공유하되 결과의 의미가 다르다** — 그래서 `kind` 로 가른다.
 * 이 태그가 없으면 취소 라벨을 채울지 말지 판단할 근거가 사라져서
 * (한때 그랬듯) 알림형에도 취소 버튼이 딸려 나온다.
 */
type Request =
  | ({ readonly kind: 'confirm' } & ConfirmOptions)
  | ({ readonly kind: 'alert' } & AlertOptions);

const ConfirmContext = createContext<ConfirmFn | null>(null);
const AlertContext = createContext<AlertFn | null>(null);

/**
 * 확인·알림 모달 제공자.
 *
 * **토스트와 달리 모듈 스토어가 아니라 컨텍스트인 이유**: 결과를 `await` 로 기다려야 하고,
 * 닫힐 때 포커스를 트리거로 되돌려야 한다. 그건 Radix 가 React 트리 안에서 해준다.
 *
 * **확인과 알림에 Provider 를 나누지 않는다** — 겹침 방지(열려 있으면 두 번째를 거절)와
 * `settle` 이 같은 자원을 쓴다. 나누면 확인 위에 알림이 겹쳐 뜨는 경로가 생긴다.
 *
 * 브라우저 기본 `confirm()`·`alert()` 을 대체한다 — 화면 밖 OS 창이라 v3 §ds-02 의 버튼 위계
 * (취소 Tertiary + 확인 Primary, 파괴적이면 Danger)를 표현할 방법이 없다.
 * `plugins/no-native-dialog.grit` 가 네이티브 사용을 막는다.
 */
export function ConfirmProvider({
  children,
  labels,
}: {
  readonly children: ReactNode;
  /** `ui` 는 사전을 모른다 — 기본 취소 문구를 앱이 넣는다. */
  readonly labels: { readonly cancel: string };
}) {
  const [request, setRequest] = useState<Request | null>(null);
  const resolveRef = useRef<((result: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setRequest(null);
  }, []);

  /** 확인·알림이 공유하는 열기 절차 — 겹침 거절과 resolve 보관이 여기 한 곳이다. */
  const openRequest = useCallback((next: Request) => {
    /**
     * 이미 열려 있으면 **겹치지 않고 거절한다**(v3: 모달 위에 모달을 두지 않는다).
     * 두 번째를 큐에 쌓으면 사용자가 예상하지 못한 순간에 두 번째 창이 뜬다.
     */
    if (resolveRef.current) {
      warnOnce(
        `confirm-already-open:${next.kind}`,
        next.kind === 'confirm'
          ? '확인 모달이 이미 열려 있어 두 번째 요청을 거절했습니다(false). 모달 위에 모달을 겹치지 않습니다.'
          : '확인 모달이 이미 열려 있어 알림 요청을 거절했습니다(표시하지 않음). 모달 위에 모달을 겹치지 않습니다.',
      );
      return Promise.resolve(false);
    }

    setRequest(next);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const confirm = useCallback<ConfirmFn>(
    (options) => openRequest({ kind: 'confirm', ...options }),
    [openRequest],
  );

  /**
   * 알림은 결과를 **버린다** — 딤 클릭·Esc·확인 어느 쪽이든 "읽었다"로 같다.
   * 반환 타입을 `void` 로 좁히는 지점이 여기 하나뿐이다.
   */
  const showAlert = useCallback<AlertFn>(
    async (options) => {
      await openRequest({ kind: 'alert', ...options });
    },
    [openRequest],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      <AlertContext.Provider value={showAlert}>
        {children}
        <ConfirmDialog
          open={request !== null}
          onOpenChange={(open) => {
            /**
             * 확인형에서 딤 클릭·Esc·취소는 전부 "아니오"다.
             * 알림형에는 취소 개념이 없어 같은 경로가 그냥 "읽고 닫음"이 된다 —
             * `showAlert` 가 결과를 버리므로 어느 쪽이든 resolve 로 끝난다.
             */
            if (!open) settle(false);
          }}
          message={request?.message ?? ''}
          confirmLabel={request?.confirmLabel ?? ''}
          /**
           * **알림형에는 취소 라벨을 채우지 않는다.** `ConfirmDialog` 는 `cancelLabel` 이
           * 없을 때만 단일 버튼이 되는데, 예전엔 여기서 `?? labels.cancel` 로 늘 채워
           * `useConfirm()` 경로에 알림형이 존재할 수 없었다.
           */
          cancelLabel={
            request?.kind === 'confirm' ? (request.cancelLabel ?? labels.cancel) : undefined
          }
          destructive={request?.kind === 'confirm' ? request.destructive : undefined}
          onConfirm={() => settle(true)}
        />
      </AlertContext.Provider>
    </ConfirmContext.Provider>
  );
}

/**
 * ```tsx
 * const askConfirm = useConfirm();
 * if (await askConfirm({ message: '삭제하시겠습니까?', confirmLabel: '삭제', destructive: true })) …
 * ```
 *
 * 취소 없이 **알리기만** 하는 창은 `useAlert()` 다 — `cancelLabel` 을 생략해도 이 경로는
 * 앱이 준 기본 취소 문구가 붙는다(취소 버튼 없는 확인 모달은 만들 수 없다).
 *
 * ⚠️ 반환 함수를 `confirm` 이라는 이름으로 받지 않는다 — GritQL 은 스코프를 보지 않아
 * 지역 변수 호출도 `no-native-dialog` 규칙에 걸린다. `useAlert()` 쪽도 같은 함정이 있다.
 */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    /**
     * Provider 를 빠뜨렸다고 화면이 통째로 죽지 않게 한다 —
     * `useTranslator()` 가 빈 번역기를 반환하는 것과 같은 방침이다.
     * 다만 확인 없이 진행하면 위험하므로 **false(취소)** 를 돌려준다.
     */
    return () => {
      warnOnce(
        'confirm-no-provider',
        'ConfirmProvider 가 없습니다. 확인 모달을 띄울 수 없어 취소로 처리했습니다.',
      );
      return Promise.resolve(false);
    };
  }
  return confirm;
}

/**
 * 알림 모달 — 읽고 닫으면 끝인 단일 버튼 창. `ConfirmProvider` 가 함께 제공한다.
 *
 * ```tsx
 * const showAlert = useAlert();
 * await showAlert({ message: '저장했습니다.', confirmLabel: '확인' });
 * ```
 *
 * ⚠️ **반환 함수를 `alert` 로 받지 않는다 — 이름이 `showAlert` 인 것이 규칙이다.**
 * `plugins/no-native-dialog.grit` 는 스코프를 보지 않고 `alert($args)` 호출 패턴을 잡으므로,
 * 지역 변수여도 `alert({ … })` 한 줄이 규칙 위반으로 뜬다(`useConfirm` 의 `askConfirm` 과
 * 같은 함정이다).
 */
export function useAlert(): AlertFn {
  const showAlert = useContext(AlertContext);
  if (!showAlert) {
    /**
     * `useConfirm` 과 같은 방침으로 화면을 죽이지 않는다. 다만 알림은 "확인 없이 진행하면
     * 위험"이 아니라 **그냥 못 보여준 것**이라 즉시 resolve 로 끝낸다 — 호출부의 `await`
     * 뒤 흐름을 막지 않는다.
     */
    return () => {
      warnOnce(
        'alert-no-provider',
        'ConfirmProvider 가 없습니다. 알림 모달을 띄우지 못하고 그대로 진행했습니다.',
      );
      return Promise.resolve();
    };
  }
  return showAlert;
}
