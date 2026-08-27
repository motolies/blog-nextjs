'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// 세그먼트 에러 경계 — React 19 는 boundary 가 잡은 에러를 window 로 재전파하지 않으므로 명시 캡처한다.
// digest 가 있으면 서버 렌더 유래 오류로, onRequestError 가 이미 보고했다 — 중복 전송하지 않는다(componentStack 유실은 수용).
export default function RouteError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (!error.digest) Sentry.captureException(error);
  }, [error]);
  return (
    <div style={{ padding: '5rem 1rem', textAlign: 'center' }}>
      <p>일시적인 오류가 발생했습니다.</p>
      <button type="button" onClick={() => window.location.reload()}>
        새로고침
      </button>
    </div>
  );
}
