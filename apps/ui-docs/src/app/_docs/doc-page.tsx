import { CodeBlock } from '../../client/ui-test/docs/code-block';
import { ComponentPreview } from '../../client/ui-test/docs/component-preview';
import { readDemoSource } from '../../server/ui-test/demo-source';
import { PropsTable } from './props-table';
import type { DocEntry } from './types';

/**
 * 문서 페이지 렌더 엔진(RSC) — 제목/설명 → 사용법 → 예제들 → 자유 본문 → API 표.
 * 예제 소스는 여기(서버)서 파일을 읽어 클라이언트 ComponentPreview 에 문자열로 내린다.
 * 우측 목차는 anchor 링크뿐인 정적 nav 다 — 스크롤스파이는 개발용 화면에 과하다.
 */
export function DocPage({ doc }: { readonly doc: DocEntry }) {
  const toc = [
    ...(doc.usage ? [{ id: 'usage', title: '사용법' }] : []),
    ...doc.examples.map((example) => ({ id: example.id, title: example.title })),
    ...(doc.propsTables?.length ? [{ id: 'api', title: 'API' }] : []),
  ];

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_180px] xl:items-start xl:gap-8">
      <article className="flex min-w-0 flex-col gap-6">
        <header>
          <h1 className="text-dl-heading font-bold text-dl-fg-strong">{doc.title}</h1>
          <p className="mt-1 text-dl-sm text-dl-fg-muted">{doc.description}</p>
        </header>

        {doc.usage ? (
          <section id="usage" className="scroll-mt-6">
            <h2 className="mb-3 text-dl-xl font-bold text-dl-fg-strong">사용법</h2>
            <CodeBlock code={doc.usage} />
          </section>
        ) : null}

        {doc.examples.map((example) => {
          const source = readDemoSource(example.file);
          return (
            <section key={example.id} id={example.id} className="scroll-mt-6">
              <ComponentPreview
                title={example.title}
                note={example.note}
                code={source.code}
                sourceError={source.error}
              >
                <example.Component />
              </ComponentPreview>
            </section>
          );
        })}

        {doc.Body ? <doc.Body /> : null}

        {doc.propsTables?.length ? (
          <section id="api" className="scroll-mt-6">
            <h2 className="mb-3 text-dl-xl font-bold text-dl-fg-strong">API</h2>
            <div className="flex flex-col gap-4">
              {doc.propsTables.map((table) => (
                <PropsTable key={table.title} def={table} />
              ))}
            </div>
          </section>
        ) : null}
      </article>

      {toc.length > 1 ? (
        <nav aria-label="이 문서의 목차" className="sticky top-dl-gutter hidden xl:block">
          <p className="text-dl-xs font-semibold text-dl-fg-muted">목차</p>
          <ul className="mt-2 flex flex-col gap-1 border-l border-dl-border-soft">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block truncate py-0.5 pl-3 text-dl-sm text-dl-nav-fg hover:text-dl-fg"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
