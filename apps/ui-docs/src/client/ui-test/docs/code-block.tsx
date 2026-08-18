'use client';

import { cn } from '@hvy/ui';
import { CopyButton } from './copy-button';

/**
 * 플레인 코드블록 — 하이라이팅 라이브러리 없이 mono 토큰만 쓴다(의도적 무의존성).
 * 서버(doc-page)와 클라이언트(component-preview) 양쪽에서 같은 배색을 쓰도록
 * 한 곳에 모은다. 복사 버튼이 코드 위에 떠 있어 래퍼가 relative 기준면이다.
 */
export function CodeBlock({
  code,
  className,
}: {
  readonly code: string;
  readonly className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <pre className="max-h-96 overflow-auto rounded-dl-control bg-dl-canvas px-4 py-3 font-dl-mono text-dl-xs leading-relaxed text-dl-fg">
        {code}
      </pre>
      <CopyButton text={code} className="absolute top-2 right-2" />
    </div>
  );
}
