'use client';

import { ErrorState, Tab, TabList, TabPanel, Tabs } from '@hvy/ui';
import type { ReactNode } from 'react';
import { CodeBlock } from './code-block';

/**
 * 문서 예제 블록 — shadcn 문서의 예제 블록 대응물. Preview/Code 탭 전환 카드다.
 *
 * Code 탭의 소스는 서버(doc-page)가 **데모 파일 원문을 읽어** 문자열로 내린다 —
 * "보이는 코드 = 실행되는 코드"라 코드가 조용히 낡지 않는다. 읽기 실패면 문서 전체가
 * 죽는 대신 이 블록의 Code 탭에만 ErrorState 가 뜬다(부패가 화면에 드러나야 고쳐진다).
 * 탭 스타일은 QA filter-tab-menu 규격(h-12·px-8)이 문서용으로는 커서 h-10·px-4 로 줄인다.
 */
export function ComponentPreview({
  title,
  note,
  code,
  sourceError,
  children,
}: {
  readonly title: string;
  readonly note?: string;
  readonly code?: string;
  readonly sourceError?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="rounded-dl-container border border-dl-border bg-dl-surface">
      <header className="border-b border-dl-divider px-4 py-3">
        <h2 className="text-dl-xl font-bold text-dl-fg-strong">{title}</h2>
        {note ? <p className="mt-0.5 text-dl-sm text-dl-fg-muted">{note}</p> : null}
      </header>

      <Tabs defaultValue="preview">
        <TabList label={`${title} 보기 방식`} className="px-4">
          <Tab value="preview" className="h-10 px-4">
            Preview
          </Tab>
          <Tab value="code" className="h-10 px-4">
            Code
          </Tab>
        </TabList>
        <TabPanel value="preview" className="p-4">
          {children}
        </TabPanel>
        <TabPanel value="code" className="p-4">
          {code !== undefined ? (
            <CodeBlock code={code} />
          ) : (
            <ErrorState message={sourceError ?? '데모 소스를 표시할 수 없습니다.'} />
          )}
        </TabPanel>
      </Tabs>
    </div>
  );
}
