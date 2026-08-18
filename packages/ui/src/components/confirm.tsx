'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { warnOnce } from '../lib/warnOnce';
import { ConfirmDialog } from './dialog';

export type ConfirmOptions = {
  readonly message: ReactNode;
  readonly confirmLabel: string;
  /** 없으면 단일 버튼(알림형)이 된다 — 읽고 닫으면 끝. */
  readonly cancelLabel?: string;
  /** 파괴적 실행이면 확인 버튼이 Danger 가 된다(v3 §ds-02). */
  readonly destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * 확인 모달 제공자.
 *
 * **토스트와 달리 모듈 스토어가 아니라 컨텍스트인 이유**: 결과를 `await` 로 기다려야 하고,
 * 닫힐 때 포커스를 트리거로 되돌려야 한다. 그건 Radix 가 React 트리 안에서 해준다.
 *
 * 브라우저 기본 `confirm()` 을 대체한다 — 화면 밖 OS 창이라 v3 §ds-02 의 버튼 위계
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
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((result: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setRequest(null);
  }, []);

  const confirm = useCallback<ConfirmFn>((options) => {
    /**
     * 이미 열려 있으면 **겹치지 않고 거절한다**(v3: 모달 위에 모달을 두지 않는다).
     * 두 번째를 큐에 쌓으면 사용자가 예상하지 못한 순간에 두 번째 창이 뜬다.
     */
    if (resolveRef.current) {
      warnOnce(
        'confirm-already-open',
        '확인 모달이 이미 열려 있어 두 번째 요청을 거절했습니다(false). 모달 위에 모달을 겹치지 않습니다.',
      );
      return Promise.resolve(false);
    }

    setRequest(options);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={request !== null}
        onOpenChange={(open) => {
          // 딤 클릭·Esc·취소 — 전부 "아니오"다
          if (!open) settle(false);
        }}
        message={request?.message ?? ''}
        confirmLabel={request?.confirmLabel ?? ''}
        cancelLabel={request?.cancelLabel ?? labels.cancel}
        destructive={request?.destructive}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  );
}

/**
 * ```tsx
 * const askConfirm = useConfirm();
 * if (await askConfirm({ message: '삭제하시겠습니까?', confirmLabel: '삭제', destructive: true })) …
 * ```
 *
 * ⚠️ 반환 함수를 `confirm` 이라는 이름으로 받지 않는다 — GritQL 은 스코프를 보지 않아
 * 지역 변수 호출도 `no-native-dialog` 규칙에 걸린다.
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
