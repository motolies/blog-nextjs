'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

/**
 * 루트 레이아웃 자체가 실패했을 때의 최후 경계 — Sentry 공식 패턴.
 * root layout 을 통째로 대체하므로 <html>/<body> 를 직접 렌더하고, 전역 CSS 는 로드되지 않는다(NextError 는 인라인 스타일).
 * statusCode=0 은 "상태 코드를 알 수 없는 클라이언트 오류" 를 뜻하는 NextError 의 관례 값이다.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
