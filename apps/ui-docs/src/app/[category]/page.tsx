import Link from 'next/link';
import { notFound } from 'next/navigation';
import { normalizeTheme, withTheme } from '../../shared/theme';
import { CATEGORY_LABEL, docHref, docsInCategory, isDocCategory } from '../_docs/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 카테고리 인덱스 — 해당 카테고리의 문서 카드 목록.
 * 미등록 카테고리·문서 0개 카테고리는 404 다(사이드바에서도 그룹째 숨는다).
 */
export default async function UiDocCategoryPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ category: string }>;
  readonly searchParams: Promise<{ theme?: string }>;
}) {
  const { category } = await params;
  const theme = normalizeTheme((await searchParams).theme);
  if (!isDocCategory(category)) notFound();

  const docs = docsInCategory(category);
  if (docs.length === 0) notFound();

  return (
    <>
      <h1 className="text-dl-heading font-bold text-dl-fg-strong">{CATEGORY_LABEL[category]}</h1>
      <ul className="grid gap-3 md:grid-cols-2">
        {docs.map((doc) => (
          <li key={doc.slug}>
            <Link
              href={withTheme(docHref(doc), theme)}
              className="block h-full rounded-dl-container border border-dl-border bg-dl-surface px-4 py-3 hover:border-dl-tonal-border hover:bg-dl-tonal"
            >
              <span className="text-dl-md font-bold text-dl-fg-strong">{doc.title}</span>
              <p className="mt-1 text-dl-sm text-dl-fg-muted">{doc.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
