'use client';

import { useEffect } from 'react';

/**
 * `when` 이 참인 동안 브라우저 이탈(새로고침·탭 닫기)에 확인을 요구한다.
 * 그리드 편집의 미저장 가드(`useGridEditing().isModified`)가 대표 사용처다.
 *
 * **SPA 라우팅(뒤로가기·메뉴 이동)은 여기서 못 막는다** — `ui` 는 라우터를 모른다
 * (프레임워크 중립 원칙). 앱이 `isModified` + `useConfirm()` 으로 직접 가드한다.
 */
export function useBeforeUnloadGuard(when: boolean): void {
  useEffect(() => {
    if (!when) return;
    const handler = (event: BeforeUnloadEvent) => {
      // 문구는 브라우저가 정한다 — 커스텀 메시지는 현대 브라우저가 전부 무시한다.
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [when]);
}
